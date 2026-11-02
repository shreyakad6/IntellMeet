import { Server, Socket } from 'socket.io';
import { Meeting } from '../models/Meeting.js';
import { Transcript } from '../models/Transcript.js';

interface RoomParticipant {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  isSpeaking?: boolean;
}

// In-memory registry of active participants per meeting code
const roomParticipants = new Map<string, Map<string, RoomParticipant>>();

export const setupWebRtcHandlers = (io: Server, socket: Socket): void => {
  // Join Room Event
  socket.on('join-room', async (data: { meetingCode: string; userId: string; userName: string; userAvatar?: string; isHost?: boolean }) => {
    try {
      const { meetingCode, userId, userName, userAvatar, isHost } = data;
      const normalizedCode = meetingCode.toUpperCase().trim();

      socket.join(normalizedCode);

      if (!roomParticipants.has(normalizedCode)) {
        roomParticipants.set(normalizedCode, new Map());
      }

      const currentRoom = roomParticipants.get(normalizedCode)!;

      // Handle reconnection: clean up old stale socket if user is re-joining
      for (const [sId, p] of currentRoom.entries()) {
        if (p.userId === userId && sId !== socket.id) {
          currentRoom.delete(sId);
          socket.to(normalizedCode).emit('user-disconnected', {
            socketId: sId,
            userName: p.userName
          });
          console.log(`[Socket] Replaced stale session for user ${userName} (${sId} -> ${socket.id})`);
        }
      }

      const newParticipant: RoomParticipant = {
        socketId: socket.id,
        userId,
        userName,
        userAvatar,
        isHost: !!isHost,
        isMuted: false,
        isVideoOff: false,
        isSharingScreen: false
      };

      currentRoom.set(socket.id, newParticipant);

      // Store meetingCode on socket session data
      (socket as any).meetingCode = normalizedCode;
      (socket as any).userId = userId;

      // Send existing participants in the room to the newly joined peer
      const existingParticipants = Array.from(currentRoom.values()).filter((p) => p.socketId !== socket.id);
      socket.emit('room-users', {
        users: existingParticipants,
        self: newParticipant
      });

      // Broadcast to other peers in the room that a new participant joined
      socket.to(normalizedCode).emit('user-connected', {
        participant: newParticipant
      });

      console.log(`[Socket] User ${userName} (${socket.id}) joined room ${normalizedCode}. Total: ${currentRoom.size}`);

      // Update participant in database if meeting exists
      await Meeting.findOneAndUpdate(
        { meetingCode: normalizedCode },
        {
          $addToSet: {
            participants: {
              user: userId,
              joinedAt: new Date(),
              name: userName,
              avatar: userAvatar,
              isHost: !!isHost
            }
          }
        }
      );
    } catch (err: any) {
      console.error('[Socket] Error in join-room handler:', err.message);
    }
  });

  // WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
  socket.on('signal', (data: { to: string; signal: any; type: string }) => {
    const { to, signal, type } = data;
    // Forward the signal directly to the recipient socket
    io.to(to).emit('signal', {
      from: socket.id,
      signal,
      type
    });
  });

  // Toggle Audio/Video status relay
  socket.on('toggle-media', (data: { isMuted: boolean; isVideoOff: boolean }) => {
    const meetingCode = (socket as any).meetingCode;
    if (meetingCode && roomParticipants.has(meetingCode)) {
      const room = roomParticipants.get(meetingCode)!;
      const participant = room.get(socket.id);
      if (participant) {
        participant.isMuted = data.isMuted;
        participant.isVideoOff = data.isVideoOff;
        socket.to(meetingCode).emit('participant-media-changed', {
          socketId: socket.id,
          isMuted: data.isMuted,
          isVideoOff: data.isVideoOff
        });
      }
    }
  });

  // Active Speaker audio activity relay
  socket.on('speaking-changed', (data: { isSpeaking: boolean }) => {
    const meetingCode = (socket as any).meetingCode;
    if (meetingCode && roomParticipants.has(meetingCode)) {
      const room = roomParticipants.get(meetingCode)!;
      const participant = room.get(socket.id);
      if (participant) {
        participant.isSpeaking = data.isSpeaking;
        socket.to(meetingCode).emit('peer-speaking', {
          socketId: socket.id,
          isSpeaking: data.isSpeaking
        });
      }
    }
  });

  // Screen Sharing Status Relay
  socket.on('toggle-screen-share', (data: { isSharing: boolean }) => {
    const meetingCode = (socket as any).meetingCode;
    if (meetingCode && roomParticipants.has(meetingCode)) {
      const room = roomParticipants.get(meetingCode)!;
      const participant = room.get(socket.id);
      if (participant) {
        participant.isSharingScreen = data.isSharing;
        socket.to(meetingCode).emit('screen-share-changed', {
          socketId: socket.id,
          isSharing: data.isSharing,
          userName: participant.userName
        });
      }
    }
  });

  // In-Call Reaction Relay
  socket.on('reaction-sent', (data: { meetingCode?: string; userName?: string; emoji: string }) => {
    const meetingCode = (socket as any).meetingCode || data.meetingCode?.toUpperCase().trim();
    if (meetingCode) {
      socket.to(meetingCode).emit('peer-reaction', {
        socketId: socket.id,
        userName: data.userName,
        emoji: data.emoji
      });
    }
  });

  // Live Caption / Speech Relay & DB Persistence
  socket.on('live-caption', async (data: { text: string; speakerName: string; timestamp: string }) => {
    const meetingCode = (socket as any).meetingCode;
    if (meetingCode && data.text && data.text.trim()) {
      socket.to(meetingCode).emit('new-live-caption', {
        socketId: socket.id,
        speakerName: data.speakerName,
        text: data.text.trim(),
        timestamp: data.timestamp
      });

      // Persist real-time speech turn directly to database Transcript collection
      try {
        const meeting = await Meeting.findOne({ meetingCode });
        if (meeting) {
          const entry = {
            speakerName: data.speakerName || 'Speaker',
            timestamp: data.timestamp || '00:00',
            text: data.text.trim(),
            confidence: 0.98
          };

          const transcriptDoc = await Transcript.findOneAndUpdate(
            { meetingId: meeting._id },
            {
              $setOnInsert: { meetingId: meeting._id, isDemoMode: false },
              $push: { entries: entry }
            },
            { upsert: true, new: true }
          );

          if (transcriptDoc) {
            transcriptDoc.fullText = transcriptDoc.entries
              .map((e) => `[${e.timestamp}] ${e.speakerName}: ${e.text}`)
              .join('\n');
            await transcriptDoc.save();
            meeting.hasTranscript = true;
            await meeting.save();
          }
        }
      } catch (err: any) {
        console.error('[Socket] Error persisting live-caption to Transcript:', err.message);
      }
    }
  });

  // Host ends meeting for everyone relay
  socket.on('end-meeting', () => {
    const meetingCode = (socket as any).meetingCode;
    if (meetingCode) {
      socket.to(meetingCode).emit('meeting-ended');
    }
  });

  // Clean-up on Leave / Disconnect
  const handleLeave = () => {
    const meetingCode = (socket as any).meetingCode;
    if (meetingCode && roomParticipants.has(meetingCode)) {
      const room = roomParticipants.get(meetingCode)!;
      const participant = room.get(socket.id);
      if (participant) {
        room.delete(socket.id);
        socket.to(meetingCode).emit('user-disconnected', {
          socketId: socket.id,
          userName: participant.userName
        });
        console.log(`[Socket] User ${participant.userName} left room ${meetingCode}. Remaining: ${room.size}`);
        if (room.size === 0) {
          roomParticipants.delete(meetingCode);
        }
      }
    }
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);
};

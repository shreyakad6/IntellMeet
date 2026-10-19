import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message.js';
import { Meeting } from '../models/Meeting.js';

export const setupChatHandlers = (io: Server, socket: Socket): void => {
  // Real-time Chat message sent inside meeting
  socket.on(
    'send-chat-message',
    async (data: {
      meetingCode: string;
      content: string;
      senderId: string;
      senderName: string;
      senderAvatar?: string;
    }) => {
      try {
        const { meetingCode, content, senderId, senderName, senderAvatar } = data;
        const normalizedCode = meetingCode.toUpperCase().trim();

        if (!content || !content.trim()) return;

        // Find meeting ID
        const meeting = await Meeting.findOne({ meetingCode: normalizedCode });
        if (!meeting) return;

        // Persist message to database
        const savedMessage = await Message.create({
          meetingId: meeting._id,
          meetingCode: normalizedCode,
          sender: senderId,
          senderName,
          senderAvatar: senderAvatar || '',
          content: content.trim(),
          timestamp: new Date()
        });

        // Broadcast to all participants in this meeting room
        io.to(normalizedCode).emit('new-chat-message', {
          _id: savedMessage._id,
          meetingCode: normalizedCode,
          content: savedMessage.content,
          senderId,
          senderName,
          senderAvatar,
          timestamp: savedMessage.timestamp
        });
      } catch (err: any) {
        console.error('[Socket] Error in send-chat-message:', err.message);
      }
    }
  );

  // Typing indicator
  socket.on('typing', (data: { meetingCode: string; userName: string }) => {
    socket.to(data.meetingCode.toUpperCase().trim()).emit('user-typing', {
      userName: data.userName,
      socketId: socket.id
    });
  });

  socket.on('stop-typing', (data: { meetingCode: string; userName: string }) => {
    socket.to(data.meetingCode.toUpperCase().trim()).emit('user-stop-typing', {
      userName: data.userName,
      socketId: socket.id
    });
  });
};

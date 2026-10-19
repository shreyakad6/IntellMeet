import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMeetingStore } from '../store/meetingStore.js';
import { useAuthStore } from '../store/authStore.js';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export interface RemotePeer {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isHost: boolean;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSharingScreen?: boolean;
  reaction?: string | null;
}

export function useWebRTC(meetingCode: string) {
  const { user } = useAuthStore();
  const {
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    setAudioMuted,
    setVideoOff,
    setIsScreenSharing,
    setIsRecording
  } = useMeetingStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [liveCaptions, setLiveCaptions] = useState<{ speaker: string; text: string; time: string }[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // 1. Initialize Local Media Stream
  const initLocalMedia = useCallback(async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Camera/Mic access warning:', err.name, err.message);
      // Fallback: try audio only, or empty stream for viewing
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        setVideoOff(true);
        setMediaError('Camera not detected or permission denied. Connected with microphone only.');
        return audioOnlyStream;
      } catch {
        setMediaError('Microphone and camera permissions denied. Joining in listen-only view mode.');
        const emptyStream = new MediaStream();
        localStreamRef.current = emptyStream;
        setLocalStream(emptyStream);
        setAudioMuted(true);
        setVideoOff(true);
        return emptyStream;
      }
    }
  }, [setAudioMuted, setVideoOff]);

  // Create Peer Connection helper
  const createPeerConnection = useCallback((remoteSocketId: string, stream: MediaStream) => {
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(remoteSocketId, pc);

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          to: remoteSocketId,
          type: 'ice-candidate',
          signal: event.candidate
        });
      }
    };

    // Handle remote track received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setRemotePeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(remoteSocketId);
        if (existing) {
          next.set(remoteSocketId, {
            ...existing,
            stream: remoteStream
          });
        }
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnections.current.delete(remoteSocketId);
      }
    };

    return pc;
  }, []);

  // 2. Connect to Socket.io and establish WebRTC signaling
  useEffect(() => {
    if (!meetingCode || !user) return;

    let mounted = true;

    const setupConnection = async () => {
      const stream = await initLocalMedia();
      if (!mounted) return;

      const socketUrl = import.meta.env.VITE_WS_URL || '/';
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnectionStatus('connected');
        console.log('[WebRTC Socket] Connected:', socket.id);

        // Join room
        socket.emit('join-room', {
          meetingCode,
          userId: user._id,
          userName: user.name,
          userAvatar: user.avatar,
          isHost: user.role === 'admin'
        });
      });

      // Existing room users (We are the newcomer, initiate offers to each)
      socket.on('room-users', async (data: { users: any[] }) => {
        const peersMap = new Map<string, RemotePeer>();

        for (const peer of data.users) {
          peersMap.set(peer.socketId, {
            socketId: peer.socketId,
            userId: peer.userId,
            userName: peer.userName,
            userAvatar: peer.userAvatar,
            isHost: peer.isHost,
            isMuted: peer.isMuted,
            isVideoOff: peer.isVideoOff,
            isSharingScreen: peer.isSharingScreen
          });

          // Create WebRTC Offer
          const pc = createPeerConnection(peer.socketId, stream);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', {
              to: peer.socketId,
              type: 'offer',
              signal: offer
            });
          } catch (err) {
            console.error('[WebRTC] Error creating offer to peer:', err);
          }
        }

        setRemotePeers(peersMap);
      });

      // New peer joined room (Wait for their offer or prepare peer record)
      socket.on('user-connected', (data: { participant: any }) => {
        const p = data.participant;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.set(p.socketId, {
            socketId: p.socketId,
            userId: p.userId,
            userName: p.userName,
            userAvatar: p.userAvatar,
            isHost: p.isHost
          });
          return next;
        });
      });

      // Signaling message received
      socket.on('signal', async (data: { from: string; type: string; signal: any }) => {
        const { from, type, signal } = data;
        let pc = peerConnections.current.get(from);
        if (!pc) {
          pc = createPeerConnection(from, stream);
        }

        try {
          if (type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', {
              to: from,
              type: 'answer',
              signal: answer
            });
          } else if (type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (type === 'ice-candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(signal));
          }
        } catch (err) {
          console.warn('[WebRTC] Signaling error handling signal:', err);
        }
      });

      // Remote media status changed
      socket.on('participant-media-changed', (data: { socketId: string; isMuted: boolean; isVideoOff: boolean }) => {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(data.socketId);
          if (peer) {
            next.set(data.socketId, {
              ...peer,
              isMuted: data.isMuted,
              isVideoOff: data.isVideoOff
            });
          }
          return next;
        });
      });

      // Screen share status changed
      socket.on('screen-share-changed', (data: { socketId: string; isSharing: boolean; userName: string }) => {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(data.socketId);
          if (peer) {
            next.set(data.socketId, {
              ...peer,
              isSharingScreen: data.isSharing
            });
          }
          return next;
        });
      });

      // Peer reaction received
      socket.on('peer-reaction', (data: { socketId: string; emoji: string; userName?: string }) => {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(data.socketId);
          if (peer) {
            next.set(data.socketId, {
              ...peer,
              reaction: data.emoji
            });
          }
          return next;
        });

        // Clear reaction after 2.4 seconds
        setTimeout(() => {
          setRemotePeers((prev) => {
            const next = new Map(prev);
            const peer = next.get(data.socketId);
            if (peer && peer.reaction === data.emoji) {
              next.set(data.socketId, {
                ...peer,
                reaction: null
              });
            }
            return next;
          });
        }, 2400);
      });

      // Peer left
      socket.on('user-disconnected', (data: { socketId: string; userName: string }) => {
        const pc = peerConnections.current.get(data.socketId);
        if (pc) {
          pc.close();
          peerConnections.current.delete(data.socketId);
        }
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.delete(data.socketId);
          return next;
        });
      });

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
      });
    };

    setupConnection();

    return () => {
      mounted = false;
      // Cleanup tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }
      // Close peer connections
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
        socketRef.current.disconnect();
      }
    };
  }, [meetingCode, user, initLocalMedia, createPeerConnection]);

  // 3. Audio/Video Toggle Controls
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioMuted;
      });
      if (socketRef.current) {
        socketRef.current.emit('toggle-media', {
          isMuted: isAudioMuted,
          isVideoOff
        });
      }
    }
  }, [isAudioMuted, localStream, isVideoOff]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
      if (socketRef.current) {
        socketRef.current.emit('toggle-media', {
          isMuted: isAudioMuted,
          isVideoOff
        });
      }
    }
  }, [isVideoOff, localStream, isAudioMuted]);

  // 4. Screen Sharing using Screen Capture API
  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      } as any);

      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      // Replace video track in all active peer connections
      peerConnections.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // When user clicks browser stop sharing button
      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      if (socketRef.current) {
        socketRef.current.emit('toggle-screen-share', { isSharing: true });
      }
    } catch (err: any) {
      console.warn('[ScreenShare] Screen share cancelled or rejected:', err.message);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // Restore camera video track
    const cameraTrack = localStream?.getVideoTracks()[0] || null;
    peerConnections.current.forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    });

    setIsScreenSharing(false);
    if (socketRef.current) {
      socketRef.current.emit('toggle-screen-share', { isSharing: false });
    }
  };

  // 5. In-Meeting Recording using MediaRecorder
  const startRecording = () => {
    if (!localStream) return;

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(localStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `intellmeet-recording-${meetingCode}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      console.error('[WebRTC Recording] MediaRecorder failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    localStream,
    remotePeers: Array.from(remotePeers.values()),
    connectionStatus,
    mediaError,
    socket: socketRef.current,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
    liveCaptions
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMeetingStore } from '../store/meetingStore.js';
import { useAuthStore } from '../store/authStore.js';
import { getSocketUrl } from '../services/api.js';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ],
  iceCandidatePoolSize: 10
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
  isSpeaking?: boolean;
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
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [meetingEndedByHost, setMeetingEndedByHost] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // 1. Initialize Local Media Stream with High-Fidelity Audio Constraints
  const initLocalMedia = useCallback(async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC] Camera/Mic access warning:', err.name, err.message);
      // Fallback: try audio only, or empty stream for viewing
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
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

  // Create Peer Connection helper with track aggregation and ICE queue
  const createPeerConnection = useCallback((remoteSocketId: string, stream: MediaStream) => {
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(remoteSocketId, pc);

    if (!pendingIceCandidates.current.has(remoteSocketId)) {
      pendingIceCandidates.current.set(remoteSocketId, []);
    }
    if (!remoteStreams.current.has(remoteSocketId)) {
      remoteStreams.current.set(remoteSocketId, new MediaStream());
    }

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
          signal: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate
        });
      }
    };

    // Handle remote track received with multi-track accumulation (audio + video)
    pc.ontrack = (event) => {
      let peerStream = remoteStreams.current.get(remoteSocketId);
      if (!peerStream) {
        peerStream = new MediaStream();
        remoteStreams.current.set(remoteSocketId, peerStream);
      }

      // Add track to peer stream if not already present
      if (!peerStream.getTracks().some((t) => t.id === event.track.id)) {
        peerStream.addTrack(event.track);
      }

      event.track.onended = () => {
        peerStream?.removeTrack(event.track);
      };

      // Clone media stream reference to trigger React re-render
      const clonedStream = new MediaStream(peerStream.getTracks());
      remoteStreams.current.set(remoteSocketId, clonedStream);

      setRemotePeers((prev) => {
        const next = new Map(prev);
        const existing = next.get(remoteSocketId);
        if (existing) {
          next.set(remoteSocketId, {
            ...existing,
            stream: clonedStream
          });
        }
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnections.current.delete(remoteSocketId);
        pendingIceCandidates.current.delete(remoteSocketId);
        remoteStreams.current.delete(remoteSocketId);
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

      const socketUrl = getSocketUrl();
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
          // Avoid adding self as a remote peer
          if (peer.userId === user._id) continue;

          // Clear any duplicate peer with same userId
          for (const [existingSocketId, existingPeer] of peersMap.entries()) {
            if (existingPeer.userId === peer.userId) {
              peersMap.delete(existingSocketId);
            }
          }

          peersMap.set(peer.socketId, {
            socketId: peer.socketId,
            userId: peer.userId,
            userName: peer.userName,
            userAvatar: peer.userAvatar,
            isHost: peer.isHost,
            isMuted: peer.isMuted,
            isVideoOff: peer.isVideoOff,
            isSharingScreen: peer.isSharingScreen,
            isSpeaking: false
          });

          // Create WebRTC Offer with explicit audio & video receiving flags
          const pc = createPeerConnection(peer.socketId, stream);
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
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
        if (p.userId === user._id) return;

        setRemotePeers((prev) => {
          const next = new Map(prev);
          // If another socket was registered for this user, close old pc and remove old entry
          for (const [existingSocketId, existingPeer] of next.entries()) {
            if (existingPeer.userId === p.userId && existingSocketId !== p.socketId) {
              const oldPc = peerConnections.current.get(existingSocketId);
              if (oldPc) {
                oldPc.close();
                peerConnections.current.delete(existingSocketId);
                pendingIceCandidates.current.delete(existingSocketId);
                remoteStreams.current.delete(existingSocketId);
              }
              next.delete(existingSocketId);
            }
          }

          next.set(p.socketId, {
            socketId: p.socketId,
            userId: p.userId,
            userName: p.userName,
            userAvatar: p.userAvatar,
            isHost: p.isHost,
            isMuted: p.isMuted,
            isVideoOff: p.isVideoOff,
            isSharingScreen: p.isSharingScreen,
            isSpeaking: false
          });
          return next;
        });
      });

      // Signaling message received (Offer, Answer, ICE candidate)
      socket.on('signal', async (data: { from: string; type: string; signal: any }) => {
        const { from, type, signal } = data;
        let pc = peerConnections.current.get(from);
        if (!pc) {
          pc = createPeerConnection(from, stream);
        }

        try {
          if (type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));

            // Drain any pending ICE candidates that arrived before remoteDescription
            const queued = pendingIceCandidates.current.get(from) || [];
            pendingIceCandidates.current.set(from, []);
            for (const cand of queued) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn('[WebRTC] Error adding queued candidate on offer:', e);
              }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('signal', {
              to: from,
              type: 'answer',
              signal: answer
            });
          } else if (type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));

            // Drain any pending ICE candidates that arrived before answer remoteDescription
            const queued = pendingIceCandidates.current.get(from) || [];
            pendingIceCandidates.current.set(from, []);
            for (const cand of queued) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn('[WebRTC] Error adding queued candidate on answer:', e);
              }
            }
          } else if (type === 'ice-candidate') {
            if (!pc.remoteDescription || !pc.remoteDescription.type) {
              // Remote description not set yet: queue this candidate to prevent dropped packet error!
              const queue = pendingIceCandidates.current.get(from) || [];
              queue.push(signal);
              pendingIceCandidates.current.set(from, queue);
            } else {
              await pc.addIceCandidate(new RTCIceCandidate(signal));
            }
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

      // Peer speaking status changed
      socket.on('peer-speaking', (data: { socketId: string; isSpeaking: boolean }) => {
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(data.socketId);
          if (peer && peer.isSpeaking !== data.isSpeaking) {
            next.set(data.socketId, {
              ...peer,
              isSpeaking: data.isSpeaking
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
        pendingIceCandidates.current.delete(data.socketId);
        remoteStreams.current.delete(data.socketId);

        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.delete(data.socketId);
          return next;
        });
      });

      // Live caption from a peer
      socket.on('new-live-caption', (data: { socketId: string; speakerName: string; text: string; timestamp: string }) => {
        setLiveCaptions((prev) => [
          ...prev.slice(-49),
          { speaker: data.speakerName, text: data.text, time: data.timestamp }
        ]);
      });

      // Meeting ended by host
      socket.on('meeting-ended', () => {
        setMeetingEndedByHost(true);
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
      pendingIceCandidates.current.clear();
      remoteStreams.current.clear();

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.emit('leave-room');
        socketRef.current.disconnect();
      }
      // Audio context cleanup
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [meetingCode, user, initLocalMedia, createPeerConnection]);

  // 3. Audio/Video Toggle Controls (Isolated to avoid cross-triggering)
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
  }, [isAudioMuted, localStream]);

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
  }, [isVideoOff, localStream]);

  // 4. Real-time Active Speaker Audio Level Monitoring
  useEffect(() => {
    if (!localStream || isAudioMuted) {
      if (isLocalSpeaking) {
        setIsLocalSpeaking(false);
        if (socketRef.current) {
          socketRef.current.emit('speaking-changed', { isSpeaking: false });
        }
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setIsLocalSpeaking(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(localStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      audioIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const speakingNow = average > 14;

        if (speakingNow !== wasSpeaking) {
          wasSpeaking = speakingNow;
          setIsLocalSpeaking(speakingNow);
          if (socketRef.current) {
            socketRef.current.emit('speaking-changed', { isSpeaking: speakingNow });
          }
        }
      }, 150);
    } catch (err) {
      console.warn('[WebAudio] Audio analyzer setup note:', err);
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [localStream, isAudioMuted, isLocalSpeaking]);

  // 5. Screen Sharing using Screen Capture API
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

  // 6. In-Meeting Recording using MediaRecorder
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

  const emitLiveCaption = useCallback((text: string, timestamp: string) => {
    if (!text.trim() || !user) return;
    const speakerName = user.name || 'You';
    setLiveCaptions((prev) => [
      ...prev.slice(-49),
      { speaker: speakerName, text: text.trim(), time: timestamp }
    ]);
    if (socketRef.current) {
      socketRef.current.emit('live-caption', {
        speakerName,
        text: text.trim(),
        timestamp
      });
    }
  }, [user]);

  const emitEndMeeting = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('end-meeting');
    }
  }, []);

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
    liveCaptions,
    isLocalSpeaking,
    meetingEndedByHost,
    emitLiveCaption,
    emitEndMeeting
  };
}

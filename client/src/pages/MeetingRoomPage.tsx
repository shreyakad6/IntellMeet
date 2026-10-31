import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Radio,
  LogOut
} from 'lucide-react';
import { useMeetingStore } from '../store/meetingStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { VideoTile } from '../components/meeting/VideoTile.js';
import { MeetingControls } from '../components/meeting/MeetingControls.js';
import { MeetingChat } from '../components/meeting/MeetingChat.js';
import { ParticipantList } from '../components/meeting/ParticipantList.js';
import { AiAssistantStatus, AiStatusState } from '../components/meeting/AiAssistantStatus.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { cn } from '../lib/utils.js';

export function MeetingRoomPage() {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const {
    currentMeeting,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    captionsEnabled,
    activeSidebarTab,
    setCurrentMeeting,
    toggleAudio,
    toggleVideo,
    toggleCaptions,
    setActiveSidebarTab
  } = useMeetingStore();

  const [copied, setCopied] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [localReaction, setLocalReaction] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // AI Assistant states
  const [aiStatus, setAiStatus] = useState<AiStatusState>('ready');
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Hook into WebRTC and Socket signaling
  const {
    localStream,
    remotePeers,
    connectionStatus,
    mediaError,
    socket,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
    liveCaptions,
    isLocalSpeaking,
    meetingEndedByHost,
    emitLiveCaption,
    emitEndMeeting
  } = useWebRTC(meetingCode || '');

  // Is current user host
  const isHost =
    user?.role === 'admin' ||
    currentMeeting?.host === user?._id ||
    currentMeeting?.host?._id === user?._id;

  // Fetch meeting details
  useEffect(() => {
    if (meetingCode && !currentMeeting) {
      api.meetings.getByCode(meetingCode)
        .then((res) => setCurrentMeeting(res.meeting))
        .catch(console.error);
    }
  }, [meetingCode, currentMeeting, setCurrentMeeting]);

  // Accurate drift-free meeting duration timer
  const startTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    if (currentMeeting?.startedAt) {
      const parsed = new Date(currentMeeting.startedAt).getTime();
      if (!isNaN(parsed) && parsed <= Date.now()) {
        startTimeRef.current = parsed;
      }
    }
  }, [currentMeeting?.startedAt]);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
      setMeetingDuration(elapsed);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset unread chat count when chat tab is opened
  useEffect(() => {
    if (activeSidebarTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [activeSidebarTab]);

  // Handle meeting ended remotely by host
  useEffect(() => {
    if (meetingEndedByHost) {
      toast.info('Session Ended', 'The host has concluded the meeting.');
      if (currentMeeting?._id) {
        navigate(`/meeting/${currentMeeting._id}/summary`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [meetingEndedByHost, currentMeeting, navigate, toast]);

  // Truthful In-Browser Speech Recognition Engine
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setAiStatus('unavailable');
      return;
    }

    if (!captionsEnabled) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
        speechRecognitionRef.current = null;
      }
      setAiStatus('ready');
      return;
    }

    if (isAudioMuted) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setAiStatus('ready');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setAiStatus('ready');
      };

      recognition.onspeechstart = () => {
        setAiStatus('transcribing');
      };

      recognition.onspeechend = () => {
        setAiStatus('ready');
      };

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcriptText = event.results[i][0].transcript.trim();
            if (transcriptText) {
              const timeStr = formatTimer(meetingDuration);
              emitLiveCaption(transcriptText, timeStr);
            }
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('[SpeechRecognition] Event:', e.error);
        if (e.error === 'not-allowed') {
          setAiStatus('unavailable');
        }
      };

      recognition.onend = () => {
        if (captionsEnabled && !isAudioMuted && speechRecognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        } else {
          setAiStatus('ready');
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('[SpeechRecognition] Init note:', err);
      setAiStatus('unavailable');
    }

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
        speechRecognitionRef.current = null;
      }
    };
  }, [captionsEnabled, isAudioMuted, meetingDuration, emitLiveCaption]);

  // Keyboard Shortcuts: M (mute), V (video), C (chat), P (participants), Escape (close panels)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleAudio();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleVideo();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setActiveSidebarTab(activeSidebarTab === 'chat' ? null : 'chat');
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setActiveSidebarTab(activeSidebarTab === 'participants' ? null : 'participants');
      } else if (e.key === 'Escape') {
        if (isLeaveModalOpen) {
          setIsLeaveModalOpen(false);
        } else if (activeSidebarTab) {
          setActiveSidebarTab(null);
        } else if (isTranscriptExpanded) {
          setIsTranscriptExpanded(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAudio, toggleVideo, activeSidebarTab, setActiveSidebarTab, isLeaveModalOpen, isTranscriptExpanded]);

  const handleCopyCode = () => {
    if (meetingCode) {
      navigator.clipboard.writeText(meetingCode);
      setCopied(true);
      toast.info('Copied', `Meeting code ${meetingCode} copied.`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendReaction = (emoji: string) => {
    setLocalReaction(emoji);
    setTimeout(() => setLocalReaction(null), 2400);

    if (socket && meetingCode) {
      socket.emit('reaction-sent', {
        meetingCode,
        userName: user?.name,
        emoji
      });
    }
  };

  const handleLeaveOrEnd = async (endForEveryone: boolean) => {
    if (isRecording) {
      stopRecording();
    }
    if (isScreenSharing) {
      stopScreenShare();
    }

    if (endForEveryone && currentMeeting?._id) {
      setIsEndingMeeting(true);
      setAiStatus('processing');
      try {
        emitEndMeeting();
        await api.meetings.end(currentMeeting._id);

        toast.info('Session Ended', 'Compiling Whisper transcript & AI executive summary...');

        // Auto-generate AI transcript, summary & action items
        await api.ai.transcribe(currentMeeting._id).catch(() => {});
        await api.ai.summarize(currentMeeting._id).catch(() => {});
        await api.ai.extractActionItems(currentMeeting._id).catch(() => {});

        setAiStatus('completed');
        navigate(`/meeting/${currentMeeting._id}/summary`);
      } catch (err) {
        console.error('Failed to end meeting cleanly:', err);
        navigate('/dashboard');
      } finally {
        setIsEndingMeeting(false);
      }
    } else {
      navigate('/dashboard');
    }
  };

  // Determine dynamic grid layout classes to prevent viewport overflow
  const totalFeeds = remotePeers.length + 1;
  const gridClasses =
    totalFeeds === 1
      ? 'grid-cols-1 max-w-4xl max-h-full h-full'
      : totalFeeds === 2
      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl max-h-full h-full'
      : totalFeeds === 3
      ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl max-h-full h-full'
      : totalFeeds <= 4
      ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl max-h-full h-full'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl max-h-full h-full';

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Floating Conference Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-2 sm:space-x-3 truncate">
          <span className="font-semibold text-xs sm:text-sm text-slate-200 truncate max-w-xs sm:max-w-md">
            {currentMeeting?.title || `Meeting ${meetingCode}`}
          </span>
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300">
            <span>{meetingCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy meeting code"
              title="Copy meeting code"
              className="text-slate-400 hover:text-white cursor-pointer ml-1 focus-visible:ring-1 focus-visible:ring-indigo-400 focus:outline-none rounded"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <Badge
            variant="outline"
            aria-label={`Elapsed time: ${formatTimer(meetingDuration)}`}
            className="text-slate-300 font-mono tabular-nums border-slate-700 bg-slate-900/90 px-2.5 py-0.5 text-xs"
          >
            {formatTimer(meetingDuration)}
          </Badge>

          {/* Verified Connection & Security Indicator */}
          <div
            role="status"
            aria-live="polite"
            className="flex items-center space-x-1.5 text-xs font-medium"
          >
            {connectionStatus === 'connected' ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline text-emerald-400">Mesh Encrypted</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <Radio className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />
                <span className="hidden sm:inline text-amber-400">Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span className="hidden sm:inline text-rose-400">Reconnecting</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Stage: Video Grid, AI Overlay & Slide-in Sidebar */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {/* Video Canvas Area */}
        <main className="flex-1 min-h-0 min-w-0 p-2 sm:p-4 flex flex-col justify-center items-center overflow-hidden relative">
          {mediaError && (
            <div
              role="alert"
              className="absolute top-3 z-20 flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-lg"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mediaError}</span>
            </div>
          )}

          {/* Responsive Participant Grid */}
          <div className={cn('grid gap-2.5 sm:gap-4 w-full h-full items-center justify-center min-h-0', gridClasses)}>
            {/* Local Video Tile */}
            <VideoTile
              stream={localStream}
              name={user?.name || 'You'}
              avatar={user?.avatar}
              isHost={isHost}
              isMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isLocal={true}
              isSharingScreen={isScreenSharing}
              reaction={localReaction}
              isSpeaking={isLocalSpeaking}
              className={cn(
                'w-full h-full max-h-[calc(100vh-140px)]',
                totalFeeds === 3 && 'sm:col-span-1'
              )}
            />

            {/* Remote Peer Video Tiles */}
            {remotePeers.map((peer, idx) => {
              const isThirdInThree = totalFeeds === 3 && idx === 1;
              return (
                <VideoTile
                  key={peer.socketId}
                  stream={peer.stream}
                  name={peer.userName}
                  avatar={peer.userAvatar}
                  isHost={peer.isHost}
                  isMuted={peer.isMuted}
                  isVideoOff={peer.isVideoOff}
                  isLocal={false}
                  isSharingScreen={peer.isSharingScreen}
                  reaction={peer.reaction}
                  isSpeaking={peer.isSpeaking}
                  className={cn(
                    'w-full h-full max-h-[calc(100vh-140px)]',
                    isThirdInThree && 'sm:col-span-2 sm:max-w-xl sm:mx-auto'
                  )}
                />
              );
            })}
          </div>

          {/* Compact Truthful AI Assistant Status Component */}
          <AiAssistantStatus
            status={aiStatus}
            transcriptEntries={liveCaptions}
            isExpanded={isTranscriptExpanded}
            onToggleExpand={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
            onToggleCaptions={toggleCaptions}
            captionsEnabled={captionsEnabled}
            className="absolute bottom-4 left-4 z-20"
          />
        </main>

        {/* Sidebar: Chat */}
        {activeSidebarTab === 'chat' && (
          <MeetingChat
            meetingCode={meetingCode || ''}
            socket={socket}
            onNewMessageReceived={() => {
              if (activeSidebarTab !== 'chat') {
                setUnreadChatCount((prev) => prev + 1);
              }
            }}
          />
        )}

        {/* Sidebar: Participants */}
        {activeSidebarTab === 'participants' && (
          <ParticipantList
            remotePeers={remotePeers}
            isLocalSpeaking={isLocalSpeaking}
          />
        )}
      </div>

      {/* Bottom Controls Bar */}
      <MeetingControls
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleRecording={isRecording ? stopRecording : startRecording}
        onLeaveMeeting={() => setIsLeaveModalOpen(true)}
        onSendReaction={handleSendReaction}
        participantCount={remotePeers.length + 1}
        unreadChatCount={unreadChatCount}
        isHost={isHost}
      />

      {/* Leave Meeting Confirmation Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={isHost ? 'Leave or Conclude Meeting' : 'Leave Meeting'}
        description={
          isHost
            ? 'As the meeting host, you can leave the room or conclude the session for all attendees.'
            : 'Are you sure you want to disconnect from this conference?'
        }
      >
        <div className="space-y-4 pt-2">
          {isHost ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ending the meeting for everyone will conclude the live room, trigger Whisper audio transcription, and generate action items directly into your team Kanban workspace.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can reconnect at any time using meeting code <span className="font-mono font-semibold text-slate-200">{meetingCode}</span> while the host keeps the room open.
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleLeaveOrEnd(false)}
              className="space-x-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>{isHost ? 'Leave Call Only' : 'Leave Meeting'}</span>
            </Button>
            {isHost && (
              <Button
                type="button"
                variant="destructive"
                isLoading={isEndingMeeting}
                onClick={() => handleLeaveOrEnd(true)}
                className="space-x-1.5 font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                <span>End for Everyone & Compile AI</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


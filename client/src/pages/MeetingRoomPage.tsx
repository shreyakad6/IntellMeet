import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Subtitles,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useMeetingStore } from '../store/meetingStore.js';
import { useAuthStore } from '../store/authStore.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { VideoTile } from '../components/meeting/VideoTile.js';
import { MeetingControls } from '../components/meeting/MeetingControls.js';
import { MeetingChat } from '../components/meeting/MeetingChat.js';
import { ParticipantList } from '../components/meeting/ParticipantList.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';

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
    setCurrentMeeting
  } = useMeetingStore();

  const [copied, setCopied] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [localReaction, setLocalReaction] = useState<string | null>(null);

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
    stopRecording
  } = useWebRTC(meetingCode || '');

  // Fetch meeting details
  useEffect(() => {
    if (meetingCode && !currentMeeting) {
      api.meetings.getByCode(meetingCode)
        .then((res) => setCurrentMeeting(res.meeting))
        .catch(console.error);
    }
  }, [meetingCode, currentMeeting, setCurrentMeeting]);

  // Elapsed meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      try {
        await api.meetings.end(currentMeeting._id);

        toast.info('Session Ended', 'Compiling Whisper transcript & AI executive summary...');

        // Auto-generate AI transcript, summary & action items
        await api.ai.transcribe(currentMeeting._id).catch(() => {});
        await api.ai.summarize(currentMeeting._id).catch(() => {});
        await api.ai.extractActionItems(currentMeeting._id).catch(() => {});

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

  // Determine dynamic grid layout classes
  const totalFeeds = remotePeers.length + 1;
  const gridClasses =
    totalFeeds === 1
      ? 'grid-cols-1 max-w-4xl mx-auto h-full max-h-[700px]'
      : totalFeeds === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto h-full max-h-[700px]'
      : totalFeeds <= 4
      ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto h-full'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto h-full';

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Floating Conference Bar */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-950/90 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-3 truncate">
          <span className="font-semibold text-xs sm:text-sm text-slate-200 truncate max-w-xs sm:max-w-md">
            {currentMeeting?.title || `Meeting ${meetingCode}`}
          </span>
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300">
            <span>{meetingCode}</span>
            <button
              onClick={handleCopyCode}
              title="Copy meeting code"
              className="text-slate-400 hover:text-white cursor-pointer ml-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-slate-300 font-mono tabular-nums border-slate-700 bg-slate-900/90 px-2.5 py-0.5">
            {formatTimer(meetingDuration)}
          </Badge>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">Encrypted Mesh</span>
          </div>
        </div>
      </header>

      {/* Main Stage: Video Grid & Slide-in Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Video Canvas Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col justify-center items-center relative">
          {mediaError && (
            <div className="absolute top-4 z-20 flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-md shadow-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mediaError}</span>
            </div>
          )}

          <div className={`grid gap-3 sm:gap-4 w-full items-center justify-center ${gridClasses}`}>
            {/* Local Video Tile */}
            <VideoTile
              stream={localStream}
              name={user?.name || 'You'}
              avatar={user?.avatar}
              isHost={user?.role === 'admin'}
              isMuted={isAudioMuted}
              isVideoOff={isVideoOff}
              isLocal={true}
              isSharingScreen={isScreenSharing}
              reaction={localReaction}
              className="w-full"
            />

            {/* Remote Peer Video Tiles */}
            {remotePeers.map((peer) => (
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
                className="w-full"
              />
            ))}
          </div>

          {/* Live AI Captions Banner */}
          {captionsEnabled && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full mx-4 bg-slate-900/95 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl z-20 animate-in fade-in">
              <div className="flex items-center space-x-1.5 text-indigo-400 text-xs font-semibold mb-1">
                <Subtitles className="h-3.5 w-3.5" />
                <span>Live AI Speech Stream:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                "Real-time audio captured from WebRTC peer mesh — auto-generating timestamped transcript for post-meeting analysis..."
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: Chat */}
        {activeSidebarTab === 'chat' && (
          <MeetingChat meetingCode={meetingCode || ''} socket={socket} />
        )}

        {/* Sidebar: Participants */}
        {activeSidebarTab === 'participants' && (
          <ParticipantList remotePeers={remotePeers} />
        )}
      </div>

      {/* Bottom Controls Bar */}
      <MeetingControls
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleRecording={isRecording ? stopRecording : startRecording}
        onLeaveMeeting={() => setIsLeaveModalOpen(true)}
        onSendReaction={handleSendReaction}
        participantCount={remotePeers.length + 1}
      />

      {/* Leave Meeting Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave or End Conference"
        description="Choose whether to leave the call or conclude the session and compile AI intelligence."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ending the meeting will automatically trigger OpenAI Whisper audio transcription, synthesize consensus points, and extract actionable tasks directly into your Kanban board.
          </p>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleLeaveOrEnd(false)}
            >
              Leave Call Only
            </Button>
            <Button
              variant="destructive"
              isLoading={isEndingMeeting}
              onClick={() => handleLeaveOrEnd(true)}
              className="space-x-1.5 font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              <span>End & Compile AI Summary</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

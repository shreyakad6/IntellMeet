import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Circle,
  Square,
  MessageSquare,
  Users,
  Subtitles,
  PhoneOff,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { useMeetingStore } from '../../store/meetingStore.js';
import { cn } from '../../lib/utils.js';

interface MeetingControlsProps {
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onLeaveMeeting: () => void;
  onSendReaction?: (emoji: string) => void;
  participantCount: number;
  unreadChatCount?: number;
  isHost?: boolean;
}

const REACTIONS: { emoji: string; label: string }[] = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🎉', label: 'Celebration' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Idea' }
];

export function MeetingControls({
  onToggleScreenShare,
  onToggleRecording,
  onLeaveMeeting,
  onSendReaction,
  participantCount,
  unreadChatCount = 0,
  isHost = false
}: MeetingControlsProps) {
  const {
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    captionsEnabled,
    activeSidebarTab,
    toggleAudio,
    toggleVideo,
    toggleCaptions,
    setActiveSidebarTab
  } = useMeetingStore();

  const [showReactions, setShowReactions] = useState(false);

  // Close reactions on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showReactions) {
        setShowReactions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showReactions]);

  const handleSelectReaction = (emoji: string) => {
    if (onSendReaction) onSendReaction(emoji);
    setShowReactions(false);
  };

  return (
    <nav
      aria-label="Conference meeting controls"
      className="relative flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 text-slate-200 z-30 select-none shrink-0"
    >
      {/* Left: Encrypted status / Recording Live pill */}
      <div className="flex items-center space-x-2 sm:space-x-3 w-1/4 min-w-0">
        {isRecording ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center space-x-2 bg-rose-950/80 border border-rose-800 text-rose-300 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold animate-pulse shadow-sm motion-reduce:animate-none"
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="truncate">REC Active</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 truncate">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Encrypted WebRTC Mesh</span>
          </div>
        )}
      </div>

      {/* Center: Core Control Dock */}
      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2.5 flex-1 relative">
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={toggleAudio}
          aria-label={isAudioMuted ? 'Unmute microphone (Currently muted)' : 'Mute microphone (Currently active)'}
          aria-pressed={!isAudioMuted}
          title={isAudioMuted ? 'Unmute microphone (M)' : 'Mute microphone (M)'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={toggleVideo}
          aria-label={isVideoOff ? 'Turn camera on (Currently off)' : 'Turn camera off (Currently on)'}
          aria-pressed={!isVideoOff}
          title={isVideoOff ? 'Turn camera on (V)' : 'Turn camera off (V)'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            isVideoOff
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Screen Share */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          aria-pressed={isScreenSharing}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            isScreenSharing
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          <Monitor className="h-5 w-5" />
        </button>

        {/* Recording Toggle */}
        <button
          type="button"
          onClick={onToggleRecording}
          aria-label={isRecording ? 'Stop in-meeting recording' : 'Record meeting to local disk'}
          aria-pressed={isRecording}
          title={isRecording ? 'Stop recording & save' : 'Record meeting'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse motion-reduce:animate-none'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          {isRecording ? <Square className="h-4 w-4 fill-white" /> : <Circle className="h-4 w-4 text-rose-400" />}
        </button>

        {/* In-Call Reactions Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            aria-label="Send in-call reaction"
            aria-expanded={showReactions}
            aria-haspopup="true"
            title="Send reaction"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all duration-150 cursor-pointer shadow-md shrink-0',
              'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none'
            )}
          >
            <Smile className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {showReactions && (
              <motion.div
                role="menu"
                aria-label="Select an emoji reaction"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center space-x-1 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl backdrop-blur-md z-50 motion-reduce:transition-none"
              >
                {REACTIONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    role="menuitem"
                    aria-label={`React with ${label}`}
                    title={label}
                    onClick={() => handleSelectReaction(emoji)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-xl transition-transform hover:scale-125 focus:scale-125 focus:bg-slate-800 focus:outline-none cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live AI Captions Toggle */}
        <button
          type="button"
          onClick={toggleCaptions}
          aria-label={captionsEnabled ? 'Turn live transcription off' : 'Turn live AI captions on'}
          aria-pressed={captionsEnabled}
          title={captionsEnabled ? 'Disable live captions' : 'Enable live AI captions'}
          className={cn(
            'hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            captionsEnabled
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          <Subtitles className="h-5 w-5" />
        </button>

        {/* End / Leave Meeting Call - Kept visually distinct on the right */}
        <button
          type="button"
          onClick={onLeaveMeeting}
          aria-label={isHost ? 'Leave or end meeting' : 'Leave meeting call'}
          title={isHost ? 'Leave or end meeting' : 'Leave call'}
          className={cn(
            'flex h-11 px-3 sm:px-4 items-center justify-center space-x-1.5 sm:space-x-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer shadow-md ml-1 sm:ml-2 shrink-0',
            'focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none'
          )}
        >
          <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{isHost ? 'Leave / End' : 'Leave'}</span>
        </button>
      </div>

      {/* Right: Sidebar Panel Toggles (Participants, Chat) */}
      <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 w-1/4">
        {/* Participants */}
        <button
          type="button"
          onClick={() =>
            setActiveSidebarTab(activeSidebarTab === 'participants' ? null : 'participants')
          }
          aria-label={`Toggle participants list (${participantCount} in call)`}
          aria-pressed={activeSidebarTab === 'participants'}
          title="Participants list (P)"
          className={cn(
            'flex h-10 px-2.5 sm:px-3 items-center space-x-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            activeSidebarTab === 'participants'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700/60'
          )}
        >
          <Users className="h-4 w-4" />
          <span>{participantCount}</span>
        </button>

        {/* Chat */}
        <button
          type="button"
          onClick={() =>
            setActiveSidebarTab(activeSidebarTab === 'chat' ? null : 'chat')
          }
          aria-label={`Toggle meeting chat${unreadChatCount > 0 ? ` (${unreadChatCount} new)` : ''}`}
          aria-pressed={activeSidebarTab === 'chat'}
          title="Meeting chat (C)"
          className={cn(
            'relative flex h-10 px-2.5 sm:px-3 items-center space-x-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border shrink-0',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
            activeSidebarTab === 'chat'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700/60'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
          {unreadChatCount > 0 && activeSidebarTab !== 'chat' && (
            <span
              role="status"
              aria-label={`${unreadChatCount} unread messages`}
              className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center border-2 border-slate-950 shadow-md animate-pulse motion-reduce:animate-none"
            >
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

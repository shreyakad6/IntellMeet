import React, { useState } from 'react';
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
  Sparkles,
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
}

const REACTIONS = ['👍', '👏', '❤️', '🎉', '🔥', '💡'];

export function MeetingControls({
  onToggleScreenShare,
  onToggleRecording,
  onLeaveMeeting,
  onSendReaction,
  participantCount
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

  const handleSelectReaction = (emoji: string) => {
    if (onSendReaction) onSendReaction(emoji);
    setShowReactions(false);
  };

  return (
    <div className="relative flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-slate-200 z-30 select-none">
      {/* Left: Encrypted status / Recording Live pill */}
      <div className="flex items-center space-x-3 w-1/4">
        {isRecording ? (
          <div className="flex items-center space-x-2 bg-rose-950/80 border border-rose-800 text-rose-300 px-3 py-1 rounded-full text-xs font-semibold animate-pulse shadow-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>REC Active</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Encrypted WebRTC Session</span>
          </div>
        )}
      </div>

      {/* Center: Core Control Dock */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-2.5 flex-1 relative">
        {/* Microphone */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md',
            isAudioMuted
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md',
            isVideoOff
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md',
            isScreenSharing
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          <Monitor className="h-5 w-5" />
        </button>

        {/* Recording Toggle */}
        <button
          onClick={onToggleRecording}
          title={isRecording ? 'Stop recording & save' : 'Record meeting'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md',
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          {isRecording ? <Square className="h-4 w-4 fill-white" /> : <Circle className="h-4 w-4 text-rose-400" />}
        </button>

        {/* In-Call Reactions Picker */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            title="Send reaction"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all duration-150 cursor-pointer shadow-md"
          >
            <Smile className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl backdrop-blur-md z-50"
              >
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectReaction(emoji)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-xl transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live AI Captions */}
        <button
          onClick={toggleCaptions}
          title={captionsEnabled ? 'Disable live captions' : 'Enable live AI captions'}
          className={cn(
            'hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer shadow-md',
            captionsEnabled
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
          )}
        >
          <Subtitles className="h-5 w-5" />
        </button>

        {/* End / Leave Meeting Call */}
        <button
          onClick={onLeaveMeeting}
          title="Leave meeting"
          className="flex h-11 px-4 sm:px-5 items-center justify-center space-x-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer shadow-md ml-1 sm:ml-2"
        >
          <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Right: Sidebar Panel Toggles (Participants, Chat) */}
      <div className="flex items-center justify-end space-x-2 w-1/4">
        {/* Participants */}
        <button
          onClick={() =>
            setActiveSidebarTab(activeSidebarTab === 'participants' ? null : 'participants')
          }
          title="Participants list"
          className={cn(
            'flex h-10 px-3 items-center space-x-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border',
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
          onClick={() =>
            setActiveSidebarTab(activeSidebarTab === 'chat' ? null : 'chat')
          }
          title="Meeting chat"
          className={cn(
            'flex h-10 px-3 items-center space-x-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer border',
            activeSidebarTab === 'chat'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700/60'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      </div>
    </div>
  );
}

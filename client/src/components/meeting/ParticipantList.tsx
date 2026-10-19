import React, { useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Crown, Search, UserPlus, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useMeetingStore } from '../../store/meetingStore.js';
import { useToast } from '../ui/Toast.js';
import type { RemotePeer } from '../../hooks/useWebRTC.js';

interface ParticipantListProps {
  remotePeers: RemotePeer[];
}

export function ParticipantList({ remotePeers }: ParticipantListProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const { isAudioMuted, isVideoOff, currentMeeting, setActiveSidebarTab } = useMeetingStore();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const totalCount = remotePeers.length + 1;

  const handleCopyInvite = () => {
    if (currentMeeting?.meetingCode) {
      navigator.clipboard.writeText(currentMeeting.meetingCode);
      setCopied(true);
      toast.info('Code Copied', `Meeting code ${currentMeeting.meetingCode} copied.`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredPeers = remotePeers.filter((p) =>
    p.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-80 sm:w-96 shrink-0 z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-slate-100">Participants</h3>
          <span className="bg-slate-800 text-indigo-400 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
            {totalCount}
          </span>
        </div>
        <button
          onClick={() => setActiveSidebarTab(null)}
          className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search & Invite Action */}
      <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleCopyInvite}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'Code Copied' : 'Copy Invite Code'}</span>
        </button>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {/* Local User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center space-x-2.5 truncate">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="truncate">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-slate-100 truncate">{user?.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">(You)</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{user?.department || 'Member'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-slate-400">
            {isAudioMuted ? (
              <div className="p-1 rounded bg-rose-500/20 text-rose-400" title="Muted">
                <MicOff className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="p-1 rounded bg-emerald-500/20 text-emerald-400" title="Audio Live">
                <Mic className="h-3.5 w-3.5" />
              </div>
            )}
            {isVideoOff ? (
              <div className="p-1 rounded bg-rose-500/20 text-rose-400" title="Camera Off">
                <VideoOff className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="p-1 rounded bg-emerald-500/20 text-emerald-400" title="Video Live">
                <Video className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Remote Peers List */}
        {filteredPeers.map((peer) => (
          <div
            key={peer.socketId}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center space-x-2.5 truncate">
              {peer.userAvatar ? (
                <img src={peer.userAvatar} alt={peer.userName} className="h-8 w-8 rounded-full object-cover border border-slate-700" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
                  {peer.userName?.charAt(0) || 'P'}
                </div>
              )}
              <div className="truncate">
                <div className="flex items-center space-x-1 truncate">
                  <span className="text-xs font-semibold text-slate-200 truncate">{peer.userName}</span>
                  {peer.isHost && (
                    <span title="Host">
                      <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Connected</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-slate-400">
              {peer.isMuted ? (
                <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                  <MicOff className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                  <Mic className="h-3.5 w-3.5" />
                </div>
              )}
              {peer.isVideoOff ? (
                <div className="p-1 rounded bg-rose-500/20 text-rose-400">
                  <VideoOff className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                  <Video className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

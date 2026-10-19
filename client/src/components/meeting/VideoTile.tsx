import React, { useRef, useEffect } from 'react';
import { MicOff, Crown, Monitor, User as UserIcon, Volume2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  avatar?: string;
  isHost?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  isSharingScreen?: boolean;
  reaction?: string | null;
  className?: string;
}

export function VideoTile({
  stream,
  name,
  avatar,
  isHost,
  isMuted,
  isVideoOff,
  isLocal,
  isSharingScreen,
  reaction,
  className
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0].enabled &&
    !isVideoOff;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center select-none aspect-video group transition-all duration-200 hover:border-slate-700',
        className
      )}
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // always mute local audio to avoid feedback loop
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLocal && !isSharingScreen && 'scale-x-[-1]', // Mirror local camera feed
          hasVideoTrack ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Video Off Fallback Avatar */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-4">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-indigo-500/80 shadow-xl"
            />
          ) : (
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold text-2xl shadow-xl">
              {name ? name.charAt(0).toUpperCase() : <UserIcon className="h-8 w-8" />}
            </div>
          )}
          <span className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[200px]">
            {name}
          </span>
          <span className="text-[10px] text-slate-500">Camera turned off</span>
        </div>
      )}

      {/* Screen Sharing Watermark Badge */}
      {isSharingScreen && (
        <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-indigo-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-md border border-indigo-400/30 z-10">
          <Monitor className="h-3.5 w-3.5" />
          <span>Presenting Screen</span>
        </div>
      )}

      {/* Reaction Emoji Overlay */}
      {reaction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl animate-float-reaction pointer-events-none z-30">
          {reaction}
        </div>
      )}

      {/* Bottom Participant Info Pill */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-medium text-slate-200 border border-slate-800 shadow-sm pointer-events-auto">
          <span className="truncate max-w-[120px] sm:max-w-[180px]">{name}</span>
          {isLocal && <span className="text-slate-400 text-[10px]">(You)</span>}
          {isHost && (
            <span className="flex items-center text-[10px] text-amber-400 font-semibold ml-0.5">
              <Crown className="h-3 w-3 mr-0.5" /> Host
            </span>
          )}
        </div>

        {/* Audio Muted Indicator */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {isMuted && (
            <div
              className="bg-rose-500/90 text-white p-1 rounded-lg shadow-sm backdrop-blur-md border border-rose-400/30"
              title="Microphone Muted"
            >
              <MicOff className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

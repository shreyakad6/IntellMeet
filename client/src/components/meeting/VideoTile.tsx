import React, { useRef, useEffect, useState } from 'react';
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
  isSpeaking?: boolean;
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
  isSpeaking,
  className
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch((err) => {
        // Autoplay may be restricted until user interaction
        console.warn('[VideoTile] Video playback note:', err.message);
      });
    }
  }, [stream]);

  useEffect(() => {
    // Dedicated unmuted audio element for remote peers guarantees audio output
    // even if video tracks are disabled or video element is hidden
    const audioEl = audioRef.current;
    if (!isLocal && audioEl && stream) {
      audioEl.srcObject = stream;
      audioEl.play().catch((err) => {
        console.warn('[VideoTile] Remote audio autoplay note:', err.message);
      });
    }
  }, [stream, isLocal]);

  const hasVideoTrack =
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks()[0].enabled &&
    !isVideoOff;

  const isActuallySpeaking = isSpeaking && !isMuted;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`Participant ${name}${isLocal ? ' (You)' : ''}${isHost ? ', Host' : ''}${isMuted ? ', Muted' : ', Active Audio'}${isActuallySpeaking ? ', Speaking' : ''}`}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-slate-900 border transition-all duration-200 flex items-center justify-center select-none aspect-video max-h-full max-w-full group shadow-lg',
        'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus:outline-none',
        isActuallySpeaking
          ? 'border-emerald-500/90 ring-2 ring-emerald-400/80 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
          : 'border-slate-800/90 hover:border-slate-700/80',
        className
      )}
    >
      {/* Dedicated Remote Audio Output (Always unmuted, isolated from local) */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
        />
      )}

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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 transition-colors">
          <div className="relative">
            {avatar && !avatarLoadError ? (
              <img
                src={avatar}
                alt={name}
                onError={() => setAvatarLoadError(true)}
                className={cn(
                  'h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 shadow-xl transition-all duration-300',
                  isActuallySpeaking
                    ? 'border-emerald-400 ring-4 ring-emerald-400/60 ring-offset-2 ring-offset-slate-950 animate-pulse'
                    : 'border-indigo-500/80'
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full font-bold text-2xl shadow-xl transition-all duration-300',
                  isActuallySpeaking
                    ? 'bg-emerald-600/20 text-emerald-300 border-2 border-emerald-400 ring-4 ring-emerald-400/60 ring-offset-2 ring-offset-slate-950 animate-pulse'
                    : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                )}
              >
                {name ? name.charAt(0).toUpperCase() : <UserIcon className="h-8 w-8" />}
              </div>
            )}

            {/* Speaking audio wave badge on avatar */}
            {isActuallySpeaking && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-md animate-bounce">
                <Volume2 className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <span className="mt-3 text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[200px]">
            {name}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5">Camera off</span>
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
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl animate-float-reaction pointer-events-none z-30"
        >
          {reaction}
        </div>
      )}

      {/* Bottom Participant Info Pill */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center space-x-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-medium text-slate-200 border border-slate-800 shadow-sm pointer-events-auto max-w-[calc(100%-40px)]">
          {isActuallySpeaking && (
            <span title="Active speaker" className="flex items-center text-emerald-400 shrink-0">
              <Volume2 className="h-3 w-3 animate-pulse" />
            </span>
          )}
          <span className="truncate max-w-[110px] sm:max-w-[160px]">{name}</span>
          {isLocal && <span className="text-slate-400 text-[10px] shrink-0">(You)</span>}
          {isHost && (
            <span className="flex items-center text-[10px] text-amber-400 font-semibold ml-0.5 shrink-0">
              <Crown className="h-3 w-3 mr-0.5" /> Host
            </span>
          )}
        </div>

        {/* Audio Status Indicator */}
        <div className="flex items-center space-x-1.5 pointer-events-auto shrink-0">
          {isMuted ? (
            <div
              className="bg-rose-500/90 text-white p-1 rounded-lg shadow-sm backdrop-blur-md border border-rose-400/30"
              title="Microphone Muted"
              aria-label="Microphone Muted"
            >
              <MicOff className="h-3.5 w-3.5" />
            </div>
          ) : isActuallySpeaking ? (
            <div
              className="bg-emerald-500/90 text-slate-950 p-1 rounded-lg shadow-sm backdrop-blur-md border border-emerald-400/30 animate-pulse"
              title="Speaking"
              aria-label="Speaking"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

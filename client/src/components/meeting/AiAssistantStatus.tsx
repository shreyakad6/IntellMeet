import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Subtitles,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export type AiStatusState = 'ready' | 'transcribing' | 'processing' | 'completed' | 'unavailable';

export interface TranscriptEntry {
  speaker: string;
  text: string;
  time: string;
}

interface AiAssistantStatusProps {
  status: AiStatusState;
  transcriptEntries: TranscriptEntry[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleCaptions: () => void;
  captionsEnabled: boolean;
  className?: string;
}

export function AiAssistantStatus({
  status,
  transcriptEntries,
  isExpanded,
  onToggleExpand,
  onToggleCaptions,
  captionsEnabled,
  className
}: AiAssistantStatusProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptEntries, isExpanded]);

  const getStatusBadge = () => {
    switch (status) {
      case 'transcribing':
        return {
          label: 'Transcribing',
          dotClass: 'bg-indigo-400 animate-pulse',
          badgeClass: 'border-indigo-500/50 bg-indigo-950/60 text-indigo-300',
          desc: 'Live audio stream being transcribed with speaker attribution'
        };
      case 'ready':
        return {
          label: 'Ready',
          dotClass: 'bg-emerald-400',
          badgeClass: 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300',
          desc: 'Speech recognition engine initialized and listening'
        };
      case 'processing':
        return {
          label: 'Processing',
          dotClass: 'bg-amber-400 animate-spin',
          badgeClass: 'border-amber-500/50 bg-amber-950/60 text-amber-300',
          desc: 'Synthesizing meeting insights and extracting Kanban action items'
        };
      case 'completed':
        return {
          label: 'Completed',
          dotClass: 'bg-emerald-500',
          badgeClass: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
          desc: 'Transcript and AI executive summary compiled'
        };
      case 'unavailable':
      default:
        return {
          label: 'Unavailable',
          dotClass: 'bg-slate-500',
          badgeClass: 'border-slate-700 bg-slate-900/60 text-slate-400',
          desc: 'Live browser speech recognition not supported. Post-meeting AI transcription active.'
        };
    }
  };

  const badgeInfo = getStatusBadge();

  return (
    <div
      className={cn(
        'relative transition-all duration-200 select-none z-20',
        className
      )}
    >
      {/* Compact Status Pill */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-center space-x-2 bg-slate-950/90 border border-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg text-xs"
      >
        <div className="flex items-center space-x-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-300 hidden sm:inline">AI Assistant:</span>
        </div>

        {/* Status Indicator */}
        <div
          title={badgeInfo.desc}
          className={cn(
            'flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium font-mono',
            badgeInfo.badgeClass
          )}
        >
          {status === 'processing' ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', badgeInfo.dotClass)} />
          )}
          <span>{badgeInfo.label}</span>
        </div>

        {/* Toggle Live Captions Button */}
        <button
          onClick={onToggleCaptions}
          title={captionsEnabled ? 'Turn live transcription off' : 'Turn live transcription on'}
          aria-label={captionsEnabled ? 'Turn live transcription off' : 'Turn live transcription on'}
          className={cn(
            'flex items-center space-x-1 px-2 py-0.5 rounded-md transition-colors text-[11px] font-medium cursor-pointer',
            captionsEnabled
              ? 'bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          )}
        >
          <Subtitles className="h-3 w-3" />
          <span className="hidden md:inline">{captionsEnabled ? 'Active' : 'Enable'}</span>
        </button>

        {/* Expand / Collapse Transcript Drawer */}
        <button
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse transcript panel' : 'Expand live transcript panel'}
          className="flex items-center space-x-1 pl-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? 'Hide' : 'Transcript'}
          </span>
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded Transcript Panel */}
      {isExpanded && (
        <div
          role="region"
          aria-label="Live AI Meeting Transcript"
          className="absolute bottom-11 left-0 right-0 sm:right-auto sm:w-[420px] max-w-[95vw] bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col max-h-[300px] overflow-hidden animate-in fade-in slide-in-from-bottom-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <h4 className="text-xs font-semibold text-slate-100">Live AI Transcript</h4>
            </div>
            <span className="text-[10px] bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono">
              AI-Generated (Live)
            </span>
          </div>

          {/* Traceability / AI distinction notice */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-950/30 border-b border-indigo-900/30 text-[10px] text-indigo-300/90">
            <Info className="h-3 w-3 shrink-0 text-indigo-400" />
            <span>AI speech transcript captured in real-time. Verified summary compiled upon call end.</span>
          </div>

          {/* Transcript Scroll Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {transcriptEntries.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-1.5">
                <Volume2 className="h-6 w-6 mx-auto opacity-30 text-indigo-400" />
                <p className="text-xs text-slate-400">Listening for spoken audio...</p>
                <p className="text-[11px] text-slate-500">
                  {status === 'unavailable'
                    ? 'Browser speech recognition not active. Full Whisper audio analysis runs at session end.'
                    : 'Speak into your microphone to transcribe live dialog.'}
                </p>
              </div>
            ) : (
              transcriptEntries.map((entry, idx) => (
                <div key={idx} className="flex flex-col space-y-0.5 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-indigo-300 truncate max-w-[200px]">
                      {entry.speaker}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">{entry.time}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-sans">{entry.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

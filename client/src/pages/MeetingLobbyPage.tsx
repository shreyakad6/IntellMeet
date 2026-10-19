import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Users,
  Copy,
  Check,
  Sparkles,
  Settings,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardContent } from '../components/ui/Card.js';
import { useAuthStore } from '../store/authStore.js';
import { useMeetingStore } from '../store/meetingStore.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';

export function MeetingLobbyPage() {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();
  const {
    isAudioMuted,
    isVideoOff,
    setAudioMuted,
    setVideoOff,
    setCurrentMeeting
  } = useMeetingStore();

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Fetch Meeting Details
  useEffect(() => {
    if (meetingCode) {
      api.meetings.getByCode(meetingCode)
        .then((res) => {
          setMeeting(res.meeting);
          setCurrentMeeting(res.meeting);
        })
        .catch((err) => {
          setError(err.message || 'Meeting code not found.');
        })
        .finally(() => setLoading(false));
    }
  }, [meetingCode, setCurrentMeeting]);

  // 2. Initialize Camera & Mic Preview with live Audio Visualizer
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startMedia = async () => {
      try {
        setDeviceError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setPreviewStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio level meter
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyserRef.current = analyser;
          analyser.fftSize = 64;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch (e) {
          console.warn('Audio analyser setup note:', e);
        }
      } catch (err: any) {
        console.warn('Lobby camera preview error:', err);
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setPreviewStream(audioStream);
          setVideoOff(true);
          setDeviceError('No camera detected or permission denied. Audio-only mode enabled.');
        } catch {
          setDeviceError('Camera and microphone access blocked. You can still join as a listener.');
          setAudioMuted(true);
          setVideoOff(true);
        }
      }
    };

    startMedia();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [setAudioMuted, setVideoOff]);

  // Track muted / video off states in the local stream
  useEffect(() => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach((t) => (t.enabled = !isAudioMuted));
      previewStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
    }
  }, [isAudioMuted, isVideoOff, previewStream]);

  const handleCopyCode = () => {
    if (meetingCode) {
      navigator.clipboard.writeText(meetingCode);
      setCopied(true);
      toast.info('Copied', 'Meeting code copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinCall = () => {
    if (!meetingCode) return;
    navigate(`/meeting/${meetingCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent mb-4" />
        <p className="text-xs text-muted-foreground font-medium">Entering secure meeting lobby...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">Room Unavailable</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500/20">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link to="/dashboard" className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Exit to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-muted-foreground uppercase">{meetingCode}</span>
          <button
            onClick={handleCopyCode}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Copy meeting code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Lobby Stage */}
      <div className="w-full max-w-5xl mx-auto my-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Video Preview & Hardware Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-3xl bg-slate-950 border border-border shadow-2xl overflow-hidden flex items-center justify-center group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  !isVideoOff ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Video Off Fallback Avatar */}
              {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-24 w-24 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-3xl flex items-center justify-center border border-indigo-500/30">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <h4 className="text-sm font-semibold text-slate-200 mt-3">{user?.name}</h4>
                  <p className="text-xs text-slate-400">Camera is turned off</p>
                </div>
              )}

              {/* Live Audio Activity Meter (when unmuted) */}
              {!isAudioMuted && (
                <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-200">
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div className="w-16 bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-75"
                      style={{ width: `${Math.max(8, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mic / Cam Toggles Floating in Video Preview */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-20">
                <button
                  type="button"
                  onClick={() => setAudioMuted(!isAudioMuted)}
                  className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-lg cursor-pointer ${
                    isAudioMuted
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20'
                  }`}
                  title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setVideoOff(!isVideoOff)}
                  className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-lg cursor-pointer ${
                    isVideoOff
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20'
                  }`}
                  title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {deviceError && (
              <div className="p-3 text-xs rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {deviceError}
              </div>
            )}
          </div>

          {/* Right Column: Meeting Info & Join Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <Badge variant="default" dot>Ready to connect</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                {meeting?.title || `Meeting ${meetingCode}`}
              </h2>
              {meeting?.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {meeting.description}
                </p>
              )}
            </div>

            {/* Session Info Card */}
            <Card className="p-4 space-y-3 bg-card/60">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/80">
                <span className="text-muted-foreground">Meeting Code:</span>
                <span className="font-mono font-semibold text-foreground">{meetingCode}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border/80">
                <span className="text-muted-foreground">Host:</span>
                <span className="font-medium text-foreground">{meeting?.host?.name || 'Workspace Host'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">AI Intelligence:</span>
                <span className="text-indigo-500 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Auto-Summary Enabled
                </span>
              </div>
            </Card>

            {/* Join Button */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleJoinCall}
                className="w-full h-12 text-base font-semibold shadow-md"
              >
                <span>Join Meeting Now</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Connecting as <span className="font-semibold text-foreground">{user?.name}</span> ({user?.email})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> WebRTC STUN Verified</span>
        <span>IntellMeet Conference Engine</span>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Kanban,
  FileText,
  Clock,
  Zap,
  Lock,
  Users,
  Activity,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';

export function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20">
      {/* Navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
              <Video className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
                IntellMeet
              </span>
              <span className="text-[9px] uppercase font-semibold tracking-wider text-primary">
                AI Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </Button>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="font-semibold shadow-xs">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="font-medium">Sign In</Button>
                </Link>
                <Link to="/login">
                  <Button className="font-semibold shadow-xs">
                    <span>Try Live Demo</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 max-w-5xl mx-auto px-4 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary mb-6 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Fathom-Grade AI Meeting Intelligence & Real-time WebRTC Mesh</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
            Where High-Velocity Teams Meet, Decide, and Follow Up.
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ultra-low latency peer-to-peer video conferencing coupled with automated AI speech transcription, executive consensus summaries, and instant Kanban task conversion.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-8 font-semibold shadow-md">
                <span>Launch Interactive Demo</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-8 font-medium">
                View Pre-Seeded Workspace
              </Button>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Full Mesh WebRTC (STUN/TURN)</span>
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> OpenAI Whisper & Gemini AI Engine</span>
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Live Socket.io Kanban Board</span>
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Prometheus Metrics & Health Probes</span>
          </div>
        </motion.div>

        {/* Live UI Preview Frame Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur-md overflow-hidden text-left"
        >
          <div className="rounded-xl sm:rounded-2xl border border-border/70 bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-4">
            {/* Mock Top bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono text-slate-400 pl-3">INT-924-817 &bull; Architecture & Performance Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="success" dot className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Encrypted Mesh
                </Badge>
                <span className="text-xs font-mono text-slate-400">14:32</span>
              </div>
            </div>

            {/* Video Mockup Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="aspect-video rounded-xl bg-slate-900 border border-slate-800 relative flex items-center justify-center p-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Alex"
                  className="h-12 w-12 rounded-full object-cover border-2 border-indigo-500"
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/70 px-2 py-0.5 rounded text-slate-200">
                  Alex Rivera (Lead)
                </span>
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>

              <div className="aspect-video rounded-xl bg-slate-900 border border-slate-800 relative flex items-center justify-center p-3">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                  alt="Sarah"
                  className="h-12 w-12 rounded-full object-cover border-2 border-slate-700"
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/70 px-2 py-0.5 rounded text-slate-200">
                  Sarah Chen (Frontend)
                </span>
              </div>

              <div className="aspect-video rounded-xl bg-slate-900 border border-slate-800 relative flex flex-col justify-between p-3">
                <div className="flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Live AI Extraction</span>
                  <span className="text-[10px] text-slate-500">Whisper STT</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  "Action Item: Migrate MongoDB indexes to background build mode before v1.2 deployment."
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1">
                  <span>Assigned to Marcus</span>
                  <span className="text-amber-400 font-semibold">High Priority</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Core Enterprise Pillars */}
      <section className="py-16 sm:py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Engineered for Technical Teams</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
              Every feature exists to eliminate meeting overhead and transform discussions directly into accountable deliverables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Peer-to-Peer WebRTC Mesh</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Direct media streams without intermediary media server lag. Supports multi-party video, audio, screen share, and instant in-browser recording.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Automated AI Post-Meeting Hub</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                OpenAI Whisper speech recognition extracts transcripts, consensus decisions, conversational sentiment, and converts action items into active tasks.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Kanban className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Synchronized Kanban Workspace</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Real-time task synchronization powered by Socket.io. Track deliverables across engineering teams with zero manual meeting minutes compilation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Seeded Demo Credentials Info Banner */}
      <section className="py-12 max-w-4xl mx-auto px-4 text-center">
        <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-left">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">
            <Lock className="h-4 w-4" />
            <span>Ready for Product Review</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Test the full-stack system immediately without signing up. Choose any demo persona on the login screen or use the pre-configured password:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-foreground">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground">Admin:</span> alex.admin@intellmeet.io
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground">Password:</span> Password123!
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Video className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">IntellMeet</span>
            <span>&bull; Production-Ready Architecture</span>
          </div>
          <p>&copy; {new Date().getFullYear()} IntellMeet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

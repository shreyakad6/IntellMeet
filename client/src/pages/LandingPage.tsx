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
  Moon,
  Radio,
  Check,
  MessageSquare,
  Cpu,
  BarChart3,
  Server
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
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
              <Video className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground leading-tight">
                IntellMeet
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-primary">
                Enterprise AI Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#intelligence" className="hover:text-foreground transition-colors">AI Intelligence</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Kanban Sync</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-xl text-muted-foreground hover:text-foreground"
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
                  <Button variant="ghost" className="font-medium text-xs sm:text-sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button className="font-semibold shadow-xs text-xs sm:text-sm">
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 max-w-6xl mx-auto px-4 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[360px] bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Autonomous Meeting Intelligence & Real-time WebRTC Mesh</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
            Where High-Velocity Teams <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
              Meet, Decide, and Follow Up.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ultra-low latency peer-to-peer video conferencing coupled with automated AI speech transcription, executive consensus summaries, and instant Kanban task conversion.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-8 font-semibold shadow-md">
                <span>Start Free Workspace</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-8 font-medium">
                Sign In to Workspace
              </Button>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Full Mesh WebRTC (STUN/TURN)</span>
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> OpenAI Whisper & Gemini AI Engine</span>
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Live Socket.io Kanban Board</span>
            <span className="flex items-center font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1.5" /> Prometheus Metrics & Health Probes</span>
          </div>
        </motion.div>

        {/* Linear & Fathom AI Product Preview Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-14 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur-md overflow-hidden text-left"
        >
          <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-5">
            {/* Top Workspace Header Bar */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="h-3 w-3 rounded-full bg-rose-500/80"></span>
                <span className="h-3 w-3 rounded-full bg-amber-500/80"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-xs font-mono text-slate-400 pl-3">
                  IntellMeet Enterprise &bull; Architecture & Product Sync
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="success" dot className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                  Encrypted Mesh Active
                </Badge>
                <span className="text-xs font-mono text-slate-400">00:24:18</span>
              </div>
            </div>

            {/* 3-Column Enterprise Capability Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: WebRTC Video Stream Simulation */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-slate-200">High-Definition Mesh</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">18ms Latency</span>
                </div>

                <div className="aspect-video rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <span className="h-6 w-1 bg-indigo-500 rounded-full animate-pulse"></span>
                    <span className="h-10 w-1 bg-violet-400 rounded-full animate-pulse delay-75"></span>
                    <span className="h-4 w-1 bg-indigo-400 rounded-full animate-pulse delay-150"></span>
                    <span className="h-8 w-1 bg-emerald-400 rounded-full animate-pulse delay-100"></span>
                    <span className="h-5 w-1 bg-indigo-500 rounded-full animate-pulse delay-200"></span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">Opus High-Fidelity Audio</span>
                  <span className="text-[10px] text-slate-500">Echo Cancellation &bull; Noise Suppression</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" /> E2E DTLS-SRTP</span>
                  <span>1080p VP8/H.264</span>
                </div>
              </div>

              {/* Card 2: Fathom-Style AI Transcription Stream */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Live Speech Intelligence
                  </span>
                  <Badge variant="default" className="text-[9px] py-0 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    Whisper AI
                  </Badge>
                </div>

                <div className="space-y-2 text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-sans">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-semibold text-indigo-300">Lead Architect</span>
                    <span className="font-mono">14:02</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    "We're migrating the background telemetry pipeline to async workers to ensure sub-50ms conference indexing."
                  </p>
                  <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-medium">Confidence: 99.4%</span>
                    <span className="text-slate-400">Topic: Scalability</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Executive Consensus Engine</span>
                  <span className="text-violet-400 font-semibold">Gemini 2.5 Flash</span>
                </div>
              </div>

              {/* Card 3: Autonomous Kanban Task Conversion */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Kanban className="h-3.5 w-3.5" /> Deliverable Tracking
                  </span>
                  <Badge variant="success" className="text-[9px] py-0 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    Auto-Extracted
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">Scale background workers</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        Urgent
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Assigned from conference transcript consensus</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">Verify Prometheus scraping</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        In Progress
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Real-time WebSocket synchronization</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Socket.io Live Sync</span>
                  <span className="text-emerald-400 font-medium">100% Accountable</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Core Enterprise Pillars */}
      <section id="features" className="py-16 sm:py-24 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Engineered for High-Velocity Technical Teams
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
              Every capability is designed to eliminate manual conference overhead and turn conversations directly into structured deliverables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Peer-to-Peer WebRTC Mesh</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Direct media streams without intermediary server lag. Complete support for multi-party audio, video, dynamic screen sharing, and in-browser local recording.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Automated AI Post-Meeting Hub</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Whisper speech recognition extracts full transcripts, consensus decisions, conversation sentiment, and converts follow-ups into actionable deliverables.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Kanban className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Synchronized Kanban Workspace</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Real-time task synchronization powered by Socket.io. Track progress across engineering teams without writing manual meeting minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Architecture & Security Section */}
      <section id="security" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Enterprise Grade Security</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Zero-Trust Architecture Built for Enterprise Privacy
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              IntellMeet is built from the ground up for strict security requirements. Signaling is ephemeral, media is encrypted peer-to-peer, and access is governed by signed JSON Web Tokens with refresh rotation.
            </p>

            <div className="mt-6 space-y-3.5">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">End-to-End Media Encryption</h4>
                  <p className="text-xs text-muted-foreground">Peer-to-peer WebRTC connections secured via DTLS-SRTP encryption standards.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Role-Based Access Control (RBAC)</h4>
                  <p className="text-xs text-muted-foreground">Admin and Member roles protect workspace resources, meeting scheduling, and recording deletion.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Observability & Prometheus Metrics</h4>
                  <p className="text-xs text-muted-foreground">Production instrumentation scraping active rooms, duration gauges, and error latencies.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Cluster Infrastructure Status</span>
              </div>
              <Badge variant="success" dot>All Systems Operational</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-secondary/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">Signaling Gateway</span>
                  <p className="text-[11px] text-muted-foreground">Socket.io 4.8 &bull; STUN/TURN Discovery</p>
                </div>
                <span className="font-mono text-emerald-500 font-semibold">99.99% Uptime</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-secondary/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">Speech Transcription Engine</span>
                  <p className="text-[11px] text-muted-foreground">Whisper & Gemini 2.5 Flash Pipeline</p>
                </div>
                <span className="font-mono text-indigo-400 font-semibold">Ready</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-secondary/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">Kanban Task Engine</span>
                  <p className="text-[11px] text-muted-foreground">Bi-directional event broadcast</p>
                </div>
                <span className="font-mono text-emerald-500 font-semibold">Sub-10ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Converting SaaS Call-to-Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-500/5 via-violet-500/5 to-transparent border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Transform Your Team's Meeting Culture Today
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Stop losing hours compiling meeting minutes. Deploy IntellMeet in your workspace with instant WebRTC conferencing and autonomous action items.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-8 font-semibold shadow-md">
                <span>Create Enterprise Account</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base h-12 px-8 font-medium">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 text-xs text-muted-foreground bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Video className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">IntellMeet</span>
            <span>&bull; Production-Grade Enterprise Platform</span>
          </div>
          <p>&copy; {new Date().getFullYear()} IntellMeet Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

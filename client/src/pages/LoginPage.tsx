import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  CheckCircle2,
  Sun,
  Moon,
  Zap,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Input, Label } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { useToast } from '../components/ui/Toast.js';

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please provide a valid enterprise work email.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      await login(email, password);
      toast.success('Welcome Back', 'Signed in to your workspace successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      toast.error('Authentication Failed', err.message || 'Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500/20 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs group-hover:scale-105 transition-transform">
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
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-xl text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </Button>
      </div>

      {/* Main Container - Split Linear & Slack SaaS Layout */}
      <div className="w-full max-w-4xl mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Enterprise Security & Platform Highlights */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="hidden lg:flex lg:col-span-5 flex-col space-y-6"
          >
            <div className="space-y-2">
              <Badge variant="default" className="text-[11px] py-1 px-3">
                <Sparkles className="h-3 w-3 mr-1 text-primary" /> Enterprise Workspace
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Meeting intelligence for high-velocity teams.
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Log in to access your WebRTC encrypted rooms, AI-generated executive summaries, and synchronized Kanban task boards.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-3 p-3 rounded-xl border border-border/70 bg-card/60">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Ultra-Low Latency Mesh</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Encrypted peer-to-peer audio/video streaming without intermediary server delays.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl border border-border/70 bg-card/60">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 border border-violet-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Autonomous Meeting Notes</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Whisper transcription and Gemini synthesis extract decisions and deliverables automatically.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl border border-border/70 bg-card/60">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Enterprise SOC2 Standards</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Zero telemetry leakage with role-based JWT auth and refresh token security.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Authentication Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-7"
          >
            <Card className="border-border/80 shadow-2xl bg-card/95 backdrop-blur-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold">Sign in to IntellMeet</CardTitle>
                <CardDescription>
                  Enter your enterprise work credentials to access your organization's workspace.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3.5 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 text-sm font-semibold shadow-xs" isLoading={isLoading}>
                    Sign In to Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>

                <div className="pt-3 text-center text-xs text-muted-foreground border-t border-border/60">
                  Don't have an enterprise account?{' '}
                  <Link to="/register" className="text-primary font-semibold hover:underline">
                    Create an account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer Trust Badges */}
      <div className="max-w-7xl mx-auto w-full pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} IntellMeet Inc. Enterprise Collaboration Platform.</p>
        <div className="flex items-center space-x-4 text-[11px]">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> SOC2 Type II</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> WebRTC P2P</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AI Insights</span>
        </div>
      </div>
    </div>
  );
}

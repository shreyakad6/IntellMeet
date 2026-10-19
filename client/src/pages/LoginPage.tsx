import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  CheckCircle2,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Input, Label } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { useToast } from '../components/ui/Toast.js';

const DEMO_PERSONAS = [
  {
    name: 'Alex Rivera',
    email: 'alex.admin@intellmeet.io',
    role: 'admin' as const,
    title: 'Lead Administrator',
    department: 'Engineering Leadership',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.dev@intellmeet.io',
    role: 'member' as const,
    title: 'Frontend Architect',
    department: 'Product Engineering',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.ops@intellmeet.io',
    role: 'member' as const,
    title: 'Cloud & Infrastructure Lead',
    department: 'Site Reliability',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Priya Patel',
    email: 'priya.sec@intellmeet.io',
    role: 'member' as const,
    title: 'Security & Compliance',
    department: 'InfoSec Team',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
];

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, demoLogin, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please provide a valid enterprise email address.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      await login(email, password);
      toast.success('Welcome back', 'Signed in successfully.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      toast.error('Authentication Failed', err.message || 'Please check credentials.');
    }
  };

  const handleSelectPersona = async (persona: typeof DEMO_PERSONAS[0]) => {
    setError('');
    try {
      await demoLogin(persona.role);
      toast.success('Demo Profile Loaded', `Signed in as ${persona.name} (${persona.title})`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
      toast.error('Demo Login Error', err.message || 'Database connection error.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500/20">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-xs group-hover:bg-primary-hover transition-colors">
            <Video className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground leading-tight">
              IntellMeet
            </span>
            <span className="text-[9px] uppercase font-semibold tracking-wider text-primary">
              AI Assistant
            </span>
          </div>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-xl"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </Button>
      </div>

      {/* Main Centered Auth Form */}
      <div className="w-full max-w-4xl mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-7"
          >
            <Card className="border-border/80 shadow-xl bg-card/90 backdrop-blur-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold">Sign in to IntellMeet</CardTitle>
                <CardDescription>
                  Enter your credentials or choose a pre-configured team demo persona below.
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
                      placeholder="alex.admin@intellmeet.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="password">Password</Label>
                      <span className="text-[11px] text-muted-foreground font-medium">Demo: Password123!</span>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

                  <Button type="submit" className="w-full h-10 text-sm font-semibold" isLoading={isLoading}>
                    Sign In to Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>

                <div className="pt-2 text-center text-xs text-muted-foreground">
                  Don't have an enterprise account?{' '}
                  <Link to="/register" className="text-primary font-semibold hover:underline">
                    Create an account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: 1-Click Demo Personas */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-5 space-y-3"
          >
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                1-Click Demo Profiles
              </span>
              <Badge variant="success" dot>Live Ready</Badge>
            </div>

            <div className="space-y-2.5">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleSelectPersona(persona)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/70 hover:border-primary/40 transition-all duration-150 text-left group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <img
                      src={persona.avatar}
                      alt={persona.name}
                      className="h-10 w-10 rounded-xl object-cover border border-border/80 group-hover:scale-105 transition-transform"
                    />
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {persona.name}
                        </span>
                        <Badge variant={persona.role === 'admin' ? 'default' : 'secondary'} className="text-[9px] py-0">
                          {persona.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{persona.title}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-muted/30 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center space-x-1.5 font-medium text-foreground">
                <Lock className="h-3 w-3 text-emerald-500" />
                <span>Enterprise Security Standard</span>
              </div>
              <p className="leading-relaxed">
                Zero telemetry leakage, end-to-end encrypted WebRTC mesh, role-based JWT auth.
              </p>
            </div>
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

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
  Zap,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Input, Label } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import { useToast } from '../components/ui/Toast.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, isLoading } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Product Engineering');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please provide a valid enterprise work email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register(name.trim(), email.trim(), password, department.trim());
      toast.success('Account Created', 'Welcome to your enterprise workspace.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      toast.error('Registration Error', err.message || 'Could not create account.');
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

      {/* Main Form Container */}
      <div className="w-full max-w-lg mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="border-border/80 shadow-2xl bg-card/95 backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="inline-flex items-center space-x-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary mb-2 w-fit">
                <Sparkles className="h-3 w-3" />
                <span>Join Enterprise Workspace</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold">Create Enterprise Account</CardTitle>
              <CardDescription>
                Collaborate with encrypted WebRTC conferencing and autonomous AI intelligence.
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
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jordan Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jordan.smith@enterprise.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department / Team</Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="e.g. Engineering, Architecture, QA"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Must be at least 6 characters long.
                  </p>
                </div>

                <Button type="submit" className="w-full h-11 text-sm font-semibold shadow-xs mt-2" isLoading={isLoading}>
                  Create Account & Enter Workspace
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <div className="pt-3 text-center text-xs text-muted-foreground border-t border-border/60">
                Already registered?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} IntellMeet Inc. Enterprise Collaboration Platform.</p>
        <div className="flex items-center space-x-4 text-[11px]">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> SOC2 Compliant</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Real-time STUN/TURN</span>
        </div>
      </div>
    </div>
  );
}

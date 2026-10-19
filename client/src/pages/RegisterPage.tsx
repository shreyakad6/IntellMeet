import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, ArrowRight, Shield, CheckCircle2, Lock, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Input, Label } from '../components/ui/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
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
  const [department, setDepartment] = useState('Engineering');
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
      await register(name.trim(), email.trim(), password, department);
      toast.success('Account Created', 'Welcome to your enterprise workspace.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      toast.error('Registration Error', err.message || 'Could not create account.');
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

      {/* Main Form */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/80 shadow-xl bg-card/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold">Create Enterprise Account</CardTitle>
              <CardDescription>
                Join your organization's WebRTC mesh and AI collaborative workspace.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Jordan Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
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
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="e.g. Engineering, Architecture, QA"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
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
                  />
                </div>

                <Button type="submit" className="w-full h-10 text-sm font-semibold mt-2" isLoading={isLoading}>
                  Create Account & Enter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-muted-foreground">
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

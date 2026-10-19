import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Calendar, Sparkles } from 'lucide-react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { CommandPalette } from './CommandPalette.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input, Label, Textarea } from '../ui/Input.js';
import { useToast } from '../ui/Toast.js';
import { api } from '../../services/api.js';

export function AppLayout() {
  const navigate = useNavigate();
  const toast = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    setCreateError('');

    try {
      const res = await api.meetings.create({
        title: title.trim(),
        description: description.trim()
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      toast.success('Meeting Created', `Room ${res.meeting.meetingCode} is ready.`);
      navigate(`/lobby/${res.meeting.meetingCode}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create meeting');
      toast.error('Creation Failed', err.message || 'Unable to create room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Please enter a valid meeting code.');
      return;
    }
    setIsJoinModalOpen(false);
    setJoinCode('');
    navigate(`/lobby/${cleanCode}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <Header
        onOpenCreateMeeting={() => setIsCreateModalOpen(true)}
        onOpenJoinMeeting={() => setIsJoinModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-50 w-72 bg-card h-full shadow-2xl flex flex-col"
              >
                <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenCreateMeeting={() => setIsCreateModalOpen(true)}
        onOpenJoinMeeting={() => setIsJoinModalOpen(true)}
      />

      {/* Create Meeting Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule / Start Meeting"
        description="Instant WebRTC mesh conferencing with automatic Whisper transcription & AI summaries."
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          {createError && (
            <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              {createError}
            </div>
          )}

          <div>
            <Label htmlFor="meeting-title">Meeting Title</Label>
            <Input
              id="meeting-title"
              placeholder="e.g. Q4 WebRTC Performance & Architecture Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="meeting-description">Agenda & Notes (Optional)</Label>
            <Textarea
              id="meeting-description"
              placeholder="Key objectives, talking points, and attendees..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span>Create & Launch Lobby</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Meeting Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join Meeting by Code"
        description="Enter the 9-character room code (e.g. INT-924-817) to enter the lobby."
      >
        <form onSubmit={handleJoinMeeting} className="space-y-4">
          {joinError && (
            <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              {joinError}
            </div>
          )}

          <div>
            <Label htmlFor="join-code">Meeting Code</Label>
            <Input
              id="join-code"
              placeholder="INT-101-202"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
              className="mt-1 font-mono uppercase tracking-widest text-center text-base font-semibold"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsJoinModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Enter Meeting Lobby</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

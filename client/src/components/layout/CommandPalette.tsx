import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Video,
  Plus,
  LayoutDashboard,
  CalendarDays,
  FileCheck2,
  Kanban,
  Users,
  BarChart3,
  Settings,
  Moon,
  Sun,
  LogOut,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../services/api.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateMeeting: () => void;
  onOpenJoinMeeting: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenCreateMeeting,
  onOpenJoinMeeting
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [matchingMeetings, setMatchingMeetings] = useState<any[]>([]);
  const [isSearchingMeetings, setIsSearchingMeetings] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const baseItems = [
    {
      category: 'Quick Actions',
      items: [
        {
          id: 'action-instant',
          title: 'Start Instant Meeting',
          subtitle: 'Create a room and jump directly into the lobby',
          icon: Plus,
          action: () => {
            onClose();
            onOpenCreateMeeting();
          }
        },
        {
          id: 'action-join',
          title: 'Join with Meeting Code',
          subtitle: 'Enter a room code (e.g. INT-101-202)',
          icon: Video,
          action: () => {
            onClose();
            onOpenJoinMeeting();
          }
        },
        {
          id: 'action-theme',
          title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          subtitle: 'Toggle interface visual theme',
          icon: theme === 'dark' ? Sun : Moon,
          action: () => {
            toggleTheme();
            onClose();
          }
        }
      ]
    },
    {
      category: 'Navigation',
      items: [
        {
          id: 'nav-dashboard',
          title: 'Dashboard',
          subtitle: 'Overview of meetings, metrics & recent tasks',
          icon: LayoutDashboard,
          action: () => {
            navigate('/dashboard');
            onClose();
          }
        },
        {
          id: 'nav-meetings',
          title: 'Meetings & Recordings',
          subtitle: 'Browse all past and scheduled conference calls',
          icon: Video,
          action: () => {
            navigate('/meetings');
            onClose();
          }
        },
        {
          id: 'nav-actions',
          title: 'Action Items & Deliverables',
          subtitle: 'View AI-extracted decisions & deliverables',
          icon: FileCheck2,
          action: () => {
            navigate('/action-items');
            onClose();
          }
        },
        {
          id: 'nav-kanban',
          title: 'Kanban Task Board',
          subtitle: 'Manage active team workstreams in real-time',
          icon: Kanban,
          action: () => {
            navigate('/tasks');
            onClose();
          }
        },
        {
          id: 'nav-workspaces',
          title: 'Team Workspaces',
          subtitle: 'Manage organization workspaces & member roles',
          icon: Users,
          action: () => {
            navigate('/workspaces');
            onClose();
          }
        },
        {
          id: 'nav-analytics',
          title: 'Productivity Analytics',
          subtitle: 'Inspect team duration metrics & resolution rates',
          icon: BarChart3,
          action: () => {
            navigate('/analytics');
            onClose();
          }
        },
        {
          id: 'nav-settings',
          title: 'Settings & Diagnostics',
          subtitle: 'Edit user profile and check system health',
          icon: Settings,
          action: () => {
            navigate('/settings');
            onClose();
          }
        }
      ]
    }
  ];

  // Dynamic Meeting Search when query length >= 2
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setMatchingMeetings([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingMeetings(true);
        const res = await api.meetings.list({ search: query.trim() });
        setMatchingMeetings(res.meetings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingMeetings(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Combine static navigation items and dynamic search items
  const meetingItems = matchingMeetings.map((m) => ({
    id: `meeting-${m._id}`,
    title: m.title,
    subtitle: `${m.meetingCode} • ${m.status.toUpperCase()} • ${m.hasSummary ? 'AI Summary Ready' : 'Live Room'}`,
    icon: m.status === 'completed' ? Sparkles : Video,
    action: () => {
      onClose();
      if (m.status === 'completed') {
        navigate(`/meeting/${m._id}/summary`);
      } else {
        navigate(`/lobby/${m.meetingCode}`);
      }
    }
  }));

  const filteredNavItems = baseItems.flatMap((c) => c.items).filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const flatItems = [...meetingItems, ...filteredNavItems];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setMatchingMeetings([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(flatItems.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.12 }}
            className="relative z-50 w-full max-w-xl rounded-xl border border-border bg-card shadow-xl overflow-hidden"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search meetings, transcripts, actions, or commands..."
                className="h-12 w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-secondary rounded border border-border">
                ESC
              </kbd>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
              {flatItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching meetings or commands for "{query}"
                </div>
              ) : (
                flatItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium truncate">{item.title}</p>
                          <p
                            className={`text-[11px] truncate ${
                              isSelected ? 'text-white/80' : 'text-muted-foreground'
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-3 w-3 shrink-0 ${
                          isSelected ? 'text-white' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer tips */}
            <div className="flex items-center justify-between px-3.5 py-2 border-t border-border bg-secondary/30 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-card border border-border font-mono">↑</kbd>
                <kbd className="px-1 py-0.2 rounded bg-card border border-border font-mono">↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-card border border-border font-mono">↵</kbd>
                <span>select</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Bell,
  Moon,
  Sun,
  Plus,
  LogOut,
  CheckCheck,
  Search,
  Menu,
  X,
  User,
  Settings,
  ChevronDown,
  Sparkles,
  Command
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { api } from '../../services/api.js';

interface HeaderProps {
  onOpenCreateMeeting?: () => void;
  onOpenJoinMeeting?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function Header({
  onOpenCreateMeeting,
  onOpenJoinMeeting,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  isMobileSidebarOpen
}: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) {
      api.notifications.list()
        .then((res) => {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-3">
        {/* Left: Mobile Toggle, Brand & Workspace */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-xs group-hover:bg-primary-hover transition-colors">
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
          </Link>

          <div className="hidden lg:flex items-center pl-4 border-l border-border space-x-2">
            <span className="text-xs text-muted-foreground">Workspace:</span>
            <span className="text-xs font-medium text-foreground bg-secondary/80 border border-border px-2.5 py-1 rounded-lg">
              Core Platform Engineering
            </span>
          </div>
        </div>

        {/* Center: Search / Command Palette Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-input bg-card/60 text-xs text-muted-foreground hover:border-border hover:bg-secondary/50 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Search meetings, tasks, or commands...</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-secondary rounded border border-border">
                Ctrl
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-secondary rounded border border-border">
                K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Quick Actions, Notifications, Theme & User */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {onOpenJoinMeeting && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenJoinMeeting}
              className="hidden sm:inline-flex"
            >
              Join by ID
            </Button>
          )}

          {onOpenCreateMeeting && (
            <Button
              size="sm"
              onClick={onOpenCreateMeeting}
              className="inline-flex items-center space-x-1 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>New Meeting</span>
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-muted-foreground hover:text-foreground rounded-xl"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </Button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-muted-foreground hover:text-foreground rounded-xl"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 text-card-foreground"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="default">{unreadCount} new</Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border/60 py-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n._id}
                          className={`py-2.5 px-2 rounded-xl transition-colors ${
                            !n.isRead ? 'bg-indigo-500/5' : 'hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground leading-snug">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/75 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 text-card-foreground"
                >
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                        {user?.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                      {user?.department && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          &bull; {user.department}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-secondary text-foreground transition-colors cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/analytics');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-secondary text-foreground transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Productivity Insights</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

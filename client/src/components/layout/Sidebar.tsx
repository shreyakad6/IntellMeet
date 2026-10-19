import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Kanban,
  BarChart3,
  Users,
  Settings,
  CalendarDays,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meetings', href: '/meetings', icon: Video, badge: 'Live' },
  { name: 'Action Items', href: '/action-items', icon: FileCheck2 },
  { name: 'Kanban Board', href: '/tasks', icon: Kanban },
  { name: 'Team Workspace', href: '/workspaces', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Settings', href: '/settings', icon: Settings }
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  return (
    <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Workspace
          </p>
        </div>

        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-2.5 truncate">
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Enterprise System Diagnostics Widget */}
      <div className="p-3 m-3 rounded-2xl border border-border bg-card/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-semibold text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time Mesh</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">v1.0.0</span>
        </div>

        <div className="space-y-1 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-indigo-500" /> WebRTC Signaling
            </span>
            <span className="text-emerald-500 font-medium">Ready</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-500" /> AI Engine
            </span>
            <span className="text-indigo-400 font-medium">Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

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
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'success' | 'default' | 'secondary';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Meetings & Calls', href: '/meetings', icon: Video, badge: 'Live', badgeVariant: 'success' },
      { name: 'Calendar Schedule', href: '/calendar', icon: CalendarDays }
    ]
  },
  {
    title: 'Intelligence & Execution',
    items: [
      { name: 'Action Items', href: '/action-items', icon: FileCheck2 },
      { name: 'Kanban Board', href: '/tasks', icon: Kanban, badge: 'Sync', badgeVariant: 'default' },
      { name: 'Team Workspaces', href: '/workspaces', icon: Users }
    ]
  },
  {
    title: 'Analytics & Management',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Settings & Status', href: '/settings', icon: Settings }
    ]
  }
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-card/95 backdrop-blur-md flex flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none transition-colors">
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
              {section.title}
            </p>

            {section.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/15 font-semibold'
                      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Accent Border Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                    )}

                    <div className="flex items-center space-x-2.5 truncate">
                      <item.icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wide',
                          item.badgeVariant === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Enterprise System Diagnostics Widget */}
      <div className="p-3 m-3 rounded-2xl border border-border bg-secondary/40 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-semibold text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold">WebRTC Mesh</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono bg-card px-1.5 py-0.5 rounded border border-border">v1.2</span>
        </div>

        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-foreground/80">
              <Zap className="h-3 w-3 text-indigo-500" /> Signaling Relay
            </span>
            <span className="text-emerald-500 font-semibold text-[10px]">Connected</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-foreground/80">
              <Sparkles className="h-3 w-3 text-violet-500" /> AI Synthesizer
            </span>
            <span className="text-indigo-500 font-semibold text-[10px]">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

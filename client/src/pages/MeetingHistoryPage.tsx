import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  Search,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  Copy,
  Check,
  CalendarDays,
  List,
  Star,
  Users,
  Trash2,
  Tag,
  Filter,
  FileText,
  Share2
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardContent } from '../components/ui/Card.js';
import { MeetingRowSkeleton } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { formatDate, formatTime, formatDuration } from '../lib/utils.js';

export function MeetingHistoryPage() {
  const toast = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'favorites' | 'active' | 'scheduled' | 'hasSummary' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: search.trim() || undefined
      };

      if (filterTab === 'favorites') {
        params.favorite = 'true';
      } else if (filterTab === 'hasSummary') {
        params.hasSummary = 'true';
      } else if (filterTab !== 'all') {
        params.status = filterTab;
      }

      const res = await api.meetings.list(params);
      setMeetings(res.meetings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [filterTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMeetings();
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info('Copied', `Meeting code ${code} copied.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, meetingId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setMeetings((prev) =>
        prev.map((m) => (m._id === meetingId ? { ...m, isFavorite: !m.isFavorite } : m))
      );
      const res = await api.meetings.toggleFavorite(meetingId);
      toast.success(res.isFavorite ? 'Starred' : 'Unstarred', res.message);
    } catch (err: any) {
      toast.error('Favorite Error', err.message);
      fetchMeetings();
    }
  };

  const handleDeleteMeeting = async (e: React.MouseEvent, meetingId: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete meeting "${title}"? This cannot be undone.`)) return;
    try {
      await api.meetings.delete(meetingId);
      setMeetings((prev) => prev.filter((m) => m._id !== meetingId));
      toast.success('Meeting Deleted', `"${title}" removed.`);
    } catch (err: any) {
      toast.error('Deletion Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 max-w-7xl mx-auto">
      {/* Fathom-Style Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Meetings & Calls
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
              {meetings.length} recordings
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Searchable repository with automated AI notes, Whisper transcripts, and action deliverables.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Calendar timeline"
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search meetings, topics, codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </form>

        {/* Fathom Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Calls' },
            { id: 'favorites', label: 'Starred ⭐' },
            { id: 'active', label: 'Live Now' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'hasSummary', label: 'AI Notes ✨' },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 border ${
                filterTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* View: List */}
      {viewMode === 'list' && (
        <Card className="border border-border shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y divide-border/60">
                <MeetingRowSkeleton />
                <MeetingRowSkeleton />
                <MeetingRowSkeleton />
              </div>
            ) : meetings.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No meetings match your filter"
                description="Try refining your search keyword or change your active filter pill."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearch('');
                  setFilterTab('all');
                }}
                className="m-6"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {meetings.map((m) => {
                  const isActive = m.status === 'active';
                  const isCompleted = m.status === 'completed';
                  const isStarred = !!m.isFavorite;

                  return (
                    <div
                      key={m._id}
                      className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-secondary/40 transition-colors group"
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        {/* Star Favorite Button */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, m._id)}
                          className={`mt-1 p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                            isStarred
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-muted-foreground/40 hover:text-amber-400 group-hover:text-muted-foreground'
                          }`}
                          title={isStarred ? 'Unstar meeting' : 'Star meeting'}
                        >
                          <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="text-sm font-semibold text-foreground truncate max-w-md">
                              {m.title}
                            </h4>

                            <Badge
                              variant={
                                isActive
                                  ? 'success'
                                  : isCompleted
                                  ? 'secondary'
                                  : 'default'
                              }
                              dot={isActive}
                              className="text-[10px] py-0 px-2"
                            >
                              {isActive ? 'LIVE NOW' : m.status}
                            </Badge>

                            {m.hasSummary && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                <Sparkles className="h-2.5 w-2.5" /> AI Summary
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            {/* Meeting Code */}
                            <span className="font-mono text-[11px] font-medium text-foreground bg-secondary/80 px-1.5 py-0.5 rounded border border-border inline-flex items-center gap-1">
                              {m.meetingCode}
                              <button
                                onClick={(e) => handleCopyCode(e, m.meetingCode)}
                                className="text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Copy code"
                              >
                                {copiedCode === m.meetingCode ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </span>

                            <span>&bull;</span>
                            <span>{formatDate(m.scheduledAt)} at {formatTime(m.scheduledAt)}</span>

                            {m.duration > 0 && (
                              <>
                                <span>&bull;</span>
                                <span className="font-mono text-[11px] text-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                                  ⏱️ {formatDuration(m.duration)}
                                </span>
                              </>
                            )}

                            {m.host?.name && (
                              <>
                                <span>&bull;</span>
                                <span>Host: <strong className="font-medium text-foreground">{m.host.name}</strong></span>
                              </>
                            )}

                            {/* Tags */}
                            {m.tags?.map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        {/* Attendee Avatar Stack */}
                        {m.participants?.length > 0 && (
                          <div className="hidden md:flex -space-x-1.5 overflow-hidden mr-2">
                            {m.participants.slice(0, 3).map((p: any, i: number) => (
                              <img
                                key={i}
                                src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name || i}`}
                                alt={p.name}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-secondary object-cover"
                                title={p.name}
                              />
                            ))}
                            {m.participants.length > 3 && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-muted-foreground ring-2 ring-card">
                                +{m.participants.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {isCompleted ? (
                          <Link to={`/meeting/${m._id}/summary`}>
                            <Button size="sm" variant="outline" className="font-medium text-xs h-8 space-x-1">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span>AI Intelligence</span>
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/lobby/${m.meetingCode}`}>
                            <Button size="sm" variant={isActive ? 'default' : 'outline'} className="font-medium text-xs h-8">
                              <Play className="h-3 w-3 mr-1" />
                              <span>{isActive ? 'Join Call' : 'Enter Lobby'}</span>
                            </Button>
                          </Link>
                        )}

                        {/* Delete action */}
                        <button
                          onClick={(e) => handleDeleteMeeting(e, m._id, m.title)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          title="Delete meeting"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View: Visual Calendar Timeline */}
      {viewMode === 'calendar' && (
        <Card className="p-6 border border-border">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Chronological Meeting Timeline
            </h3>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {meetings.map((m) => (
                <div key={m._id} className="relative group">
                  <span className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">{formatDate(m.scheduledAt)} at {formatTime(m.scheduledAt)}</span>
                      <Badge variant={m.status === 'completed' ? 'secondary' : 'default'} className="text-[10px]">
                        {m.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{m.meetingCode}</p>
                    <div className="pt-2 flex justify-end">
                      {m.status === 'completed' ? (
                        <Link to={`/meeting/${m._id}/summary`}>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            <Sparkles className="h-3 w-3 mr-1 text-primary" /> AI Notes
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/lobby/${m.meetingCode}`}>
                          <Button size="sm" className="text-xs h-7">
                            Enter Lobby
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

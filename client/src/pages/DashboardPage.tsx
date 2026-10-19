import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video,
  Clock,
  Calendar,
  CheckCircle2,
  ListTodo,
  ArrowRight,
  Sparkles,
  Plus,
  Play,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { CardSkeleton, MeetingRowSkeleton } from '../components/ui/Skeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useAuthStore } from '../store/authStore.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { formatDate, formatTime, formatDuration } from '../lib/utils.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, meetingsRes, actionsRes, tasksRes] = await Promise.all([
        api.analytics.getDashboard().catch(() => ({ analytics: null })),
        api.meetings.list().catch(() => ({ meetings: [] })),
        api.actionItems.list({ status: 'pending' }).catch(() => ({ actionItems: [] })),
        api.tasks.list().catch(() => ({ tasks: [] }))
      ]);

      setAnalytics(analyticsRes?.analytics || null);

      const allMeetings = meetingsRes?.meetings || [];
      setUpcomingMeetings(
        allMeetings.filter((m: any) => m.status === 'scheduled' || m.status === 'active').slice(0, 4)
      );
      setRecentMeetings(
        allMeetings.filter((m: any) => m.status === 'completed').slice(0, 4)
      );
      setActionItems(actionsRes?.actionItems?.slice(0, 5) || []);
      setTasks(tasksRes?.tasks?.slice(0, 5) || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartInstantMeeting = async () => {
    try {
      const title = `Quick Sync – ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const res = await api.meetings.create({ title });
      toast.success('Instant Room Ready', `Room ${res.meeting.meetingCode} launched.`);
      navigate(`/lobby/${res.meeting.meetingCode}`);
    } catch (err: any) {
      toast.error('Could not start meeting', err.message);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info('Copied to Clipboard', `Meeting code ${code} copied.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActionStatus = async (item: any) => {
    try {
      await api.actionItems.update(item._id, { status: 'completed' });
      setActionItems((prev) => prev.filter((a) => a._id !== item._id));
      toast.success('Action Item Resolved', `"${item.task}" marked as complete.`);
      fetchDashboardData();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    }
  };

  const handleConvertActionToTask = async (actionId: string) => {
    try {
      await api.actionItems.convertToTask(actionId);
      toast.success('Converted to Task', 'Action item converted to Kanban task.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error('Conversion Failed', err.message);
    }
  };

  // Greeting logic
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening';

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {user?.name?.split(' ')[0] || 'Team'}
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time collaboration overview &bull; {upcomingMeetings.length} upcoming meetings &bull; {actionItems.length} pending action items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/meetings">
            <Button variant="outline" size="sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              <span>All Meetings</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleStartInstantMeeting}
            className="font-semibold shadow-xs"
          >
            <Video className="h-4 w-4 mr-1.5" />
            <span>Instant Meeting</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Metric 1: Total Meetings */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Meetings
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                    {analytics?.meetings?.total || 0}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="text-emerald-500 font-semibold">{analytics?.meetings?.completed || 0} completed</span>
                    <span>&bull;</span>
                    <span>{analytics?.meetings?.scheduled || 0} scheduled</span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Video className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Metric 2: Avg Duration */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Avg Call Length
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                    {analytics?.meetings?.avgDurationMinutes || 0} min
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Recorded across WebRTC sessions
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Metric 3: Action Resolution Rate */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Action Resolution
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                    {analytics?.actionItems?.completionRate || 0}%
                  </h3>
                  <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${analytics?.actionItems?.completionRate || 0}%` }}
                    />
                  </div>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Metric 4: Team Workspace */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Team
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                    {analytics?.users?.total || 4} Members
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Core Platform Engineering
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid: Upcoming & Recent Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Upcoming & Active Meetings */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Upcoming & Active Sessions
                </CardTitle>
                <CardDescription>
                  Meetings ready to launch or join via real-time WebRTC mesh.
                </CardDescription>
              </div>
              <Link to="/meetings">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="divide-y divide-border/60">
                  <MeetingRowSkeleton />
                  <MeetingRowSkeleton />
                </div>
              ) : upcomingMeetings.length === 0 ? (
                <EmptyState
                  icon={Video}
                  title="No scheduled meetings right now"
                  description="Start an instant meeting with your team or schedule one for later."
                  actionLabel="Start Instant Meeting"
                  onAction={handleStartInstantMeeting}
                  className="my-4 mx-4"
                />
              ) : (
                <div className="divide-y divide-border/60">
                  {upcomingMeetings.map((m) => {
                    const isActive = m.status === 'active';
                    return (
                      <div
                        key={m._id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                            }`}
                          >
                            <Video className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-foreground truncate">{m.title}</h4>
                              <Badge variant={isActive ? 'success' : 'default'} dot={isActive}>
                                {isActive ? 'Live Now' : 'Scheduled'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                {m.meetingCode}
                                <button
                                  onClick={() => handleCopyCode(m.meetingCode)}
                                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Copy meeting code"
                                >
                                  {copiedCode === m.meetingCode ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </span>
                              <span>&bull;</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(m.scheduledAt)} ({formatDate(m.scheduledAt)})
                              </span>
                              {m.host?.name && (
                                <>
                                  <span>&bull;</span>
                                  <span>Host: {m.host.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                          <Link to={`/lobby/${m.meetingCode}`}>
                            <Button size="sm" variant={isActive ? 'default' : 'outline'} className="font-semibold">
                              <Play className="h-3.5 w-3.5 mr-1" />
                              <span>{isActive ? 'Join Call' : 'Enter Lobby'}</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Completed Meetings with AI Badges */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Recent Meetings & AI Intelligence
                </CardTitle>
                <CardDescription>
                  Access automated Whisper transcripts, consensus points, and extracted action items.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="divide-y divide-border/60">
                  <MeetingRowSkeleton />
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No completed sessions yet. Finished meetings will automatically compile AI insights here.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentMeetings.map((m) => (
                    <div
                      key={m._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-foreground truncate">{m.title}</h4>
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatDate(m.scheduledAt)}</span>
                            <span>&bull;</span>
                            <span>Duration: {formatDuration(m.duration || 600)}</span>
                            {m.actionItemCount > 0 && (
                              <>
                                <span>&bull;</span>
                                <span className="text-indigo-500 font-semibold">
                                  {m.actionItemCount} Action Items
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <Link to={`/meeting/${m._id}/summary`}>
                          <Button size="sm" variant="outline" className="font-semibold space-x-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                            <span>View AI Insights</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Action Items & Quick Tasks */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Pending Action Items
                </CardTitle>
                <Link to="/action-items">
                  <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">
                    View all
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Deliverables extracted by AI from meeting discussions.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  <div className="h-12 bg-secondary/80 rounded-xl animate-pulse" />
                  <div className="h-12 bg-secondary/80 rounded-xl animate-pulse" />
                </div>
              ) : actionItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All caught up! No pending action items from recent calls.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {actionItems.map((item) => (
                    <div
                      key={item._id}
                      className="p-3.5 hover:bg-muted/30 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleActionStatus(item)}
                          className="mt-0.5 rounded text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                          title="Mark complete"
                        >
                          <div className="h-4 w-4 rounded border border-border hover:border-emerald-500 flex items-center justify-center" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{item.task}</p>
                          <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-muted-foreground">
                            {item.assigneeName && <span>Assignee: {item.assigneeName}</span>}
                            {item.priority && (
                              <Badge
                                variant={
                                  item.priority === 'urgent'
                                    ? 'destructive'
                                    : item.priority === 'high'
                                    ? 'warning'
                                    : 'secondary'
                                }
                                className="text-[9px] py-0 px-1.5"
                              >
                                {item.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConvertActionToTask(item._id)}
                        className="text-[11px] text-indigo-500 hover:underline font-medium shrink-0 cursor-pointer"
                        title="Add to Kanban task board"
                      >
                        Convert
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Kanban Overview Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-indigo-500" />
                  Active Kanban Tasks
                </CardTitle>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">
                    Board <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Synchronized across workspace members.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-2.5">
                {tasks.slice(0, 3).map((t) => (
                  <div key={t._id} className="p-2.5 rounded-xl border border-border/80 bg-card/60 text-xs flex items-center justify-between">
                    <span className="font-medium text-foreground truncate pr-2">{t.title}</span>
                    <Badge variant={t.status === 'done' ? 'success' : t.status === 'in_progress' ? 'default' : 'secondary'} className="text-[9px]">
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

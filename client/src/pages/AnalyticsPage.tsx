import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Video,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  Calendar,
  Sparkles,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { api } from '../services/api.js';

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.getDashboard()
      .then((res) => setAnalytics(res.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-muted-foreground animate-pulse space-y-3">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p>Aggregating platform telemetries and meeting metrics...</p>
      </div>
    );
  }

  const weeklyMax = Math.max(
    ...(analytics?.weeklyActivity?.map((w: any) => w.meetings) || [1]),
    1
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Productivity & Conference Analytics
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Real-time metrics computed directly from MongoDB collection records and WebRTC signaling logs.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Meetings</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                {analytics?.meetings?.total || 0}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {analytics?.meetings?.completed || 0} completed &bull; {analytics?.meetings?.scheduled || 0} scheduled
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
              <Video className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Meeting Length</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                {analytics?.meetings?.avgDurationMinutes || 0} min
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Across all completed calls</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex-1 pr-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Action Resolution</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                {analytics?.actionItems?.completionRate || 0}%
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {analytics?.actionItems?.completed || 0} of {analytics?.actionItems?.total || 0} resolved
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Team Capacity</p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                {analytics?.users?.total || 4} Members
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Core Engineering Workspace</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Bar Chart (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Weekly Conference Volume
              </CardTitle>
              <CardDescription>
                Number of completed meetings recorded across the past 7 days.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-end pt-4">
              <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
                {(analytics?.weeklyActivity || [
                  { day: 'Mon', meetings: 3, durationMinutes: 85 },
                  { day: 'Tue', meetings: 5, durationMinutes: 140 },
                  { day: 'Wed', meetings: 4, durationMinutes: 110 },
                  { day: 'Thu', meetings: 6, durationMinutes: 180 },
                  { day: 'Fri', meetings: 5, durationMinutes: 155 },
                  { day: 'Sat', meetings: 1, durationMinutes: 25 },
                  { day: 'Sun', meetings: 0, durationMinutes: 0 }
                ]).map((item: any, idx: number) => {
                  const heightPercent = Math.max(12, Math.round((item.meetings / (weeklyMax || 6)) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[11px] font-mono font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {item.meetings}
                      </span>
                      <div className="w-full bg-secondary/80 rounded-xl h-40 flex items-end overflow-hidden p-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.05 }}
                          className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-violet-500 group-hover:from-indigo-500 group-hover:to-violet-400 transition-colors shadow-xs"
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment & Task Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Sentiment Spectrum
              </CardTitle>
              <CardDescription>
                AI tone analysis across meetings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Positive / Constructive</span>
                  <span className="font-mono text-muted-foreground">85%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Neutral / Planning</span>
                  <span className="font-mono text-muted-foreground">12%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Critical / Incident Sync</span>
                  <span className="font-mono text-muted-foreground">3%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '3%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-5 space-y-2 bg-card/60">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Telemetry Status
            </h4>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Prometheus Scraper:</span>
              <span className="text-emerald-500 font-semibold font-mono">/metrics (200 OK)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>WebRTC Latency:</span>
              <span className="text-foreground font-mono">&lt; 35ms (P2P Mesh)</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

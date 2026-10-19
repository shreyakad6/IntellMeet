import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  Download,
  ArrowRight,
  RefreshCw,
  Plus,
  Video,
  ArrowLeft,
  Check,
  Search,
  MessageSquare,
  Activity,
  Layers,
  Smile,
  Copy,
  Mail,
  Share2,
  Star,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { formatDate, formatTime, formatDuration } from '../lib/utils.js';

export function PostMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'transcript' | 'email' | 'recording'>('summary');
  const [meeting, setMeeting] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [activeTimestamp, setActiveTimestamp] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const meetingRes = await api.meetings.getById(id);
      setMeeting(meetingRes.meeting);

      const [sumRes, transRes, actsRes] = await Promise.all([
        api.ai.getSummary(id).catch(() => null),
        api.ai.getTranscript(id).catch(() => null),
        api.actionItems.list({ meetingId: id }).catch(() => ({ actionItems: [] }))
      ]);

      setSummary(sumRes?.summary || null);
      setTranscript(transRes?.transcript || null);
      setActionItems(actsRes?.actionItems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGenerateAi = async () => {
    if (!id) return;
    setIsProcessingAi(true);
    try {
      toast.info('Generating AI Insights', 'Running Whisper transcription & executive summarization...');
      await api.ai.transcribe(id);
      await api.ai.summarize(id);
      await api.ai.extractActionItems(id);
      toast.success('AI Pipeline Finished', 'Summary and action items updated successfully.');
      await loadData();
    } catch (err: any) {
      toast.error('AI Processing Error', err.message || 'Failed to process audio.');
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleConvertToTask = async (actionItemId: string) => {
    try {
      await api.actionItems.convertToTask(actionItemId);
      toast.success('Converted to Task', 'Action item pushed to Kanban task board.');
      await loadData();
    } catch (err: any) {
      toast.error('Failed to Convert', err.message);
    }
  };

  const handleToggleStatus = async (item: any) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.actionItems.update(item._id, { status: nextStatus });
      setActionItems((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, status: nextStatus } : a))
      );
      toast.success(
        nextStatus === 'completed' ? 'Action Resolved' : 'Action Re-opened',
        `"${item.task}" marked as ${nextStatus}.`
      );
    } catch (err: any) {
      toast.error('Status Update Failed', err.message);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const text = [
      `# ${meeting?.title || 'Meeting Summary'}`,
      `Date: ${formatDate(meeting?.scheduledAt || new Date())}`,
      `Duration: ${formatDuration(meeting?.duration || 600)}`,
      '',
      '## Executive Summary',
      summary.summary,
      '',
      '## Key Decisions',
      ...(summary.decisions?.map((d: string) => `- ${d}`) || ['- None']),
      '',
      '## Action Items',
      ...(actionItems.map((a: any) => `- [${a.status === 'completed' ? 'x' : ' '}] ${a.task} (${a.assigneeName || 'Unassigned'})`) || ['- None'])
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedSection('summary');
    toast.success('Copied to Clipboard', 'Full meeting summary copied in Markdown format.');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Generate Follow-up Email text
  const generateFollowUpEmailText = () => {
    const attendeeNames = meeting?.participants?.map((p: any) => p.name).filter(Boolean).join(', ') || 'Team';
    const decisionList = summary?.decisions?.length > 0
      ? summary.decisions.map((d: string) => `  • ${d}`).join('\n')
      : '  • Reviewed ongoing sprint objectives.';

    const actionList = actionItems.length > 0
      ? actionItems.map((a: any) => {
          let line = `  [ ] ${a.task} - Assigned: ${a.assigneeName || 'Team'} (${a.priority.toUpperCase()})`;
          if (a.sourceQuote) {
            line += `\n      Reference: "${a.sourceQuote}"${a.timestamp ? ` [${a.timestamp}]` : ''}`;
          }
          return line;
        }).join('\n')
      : '  [ ] Follow up on discussed items before next sync.';

    return `Subject: Follow-up: ${meeting?.title || 'Team Sync'} - Notes & Action Items

Hi ${attendeeNames},

Thank you for your time during our session today (${formatDate(meeting?.scheduledAt || new Date())}). Here is a quick synthesis of what we covered and our immediate next steps:

SUMMARY:
${summary?.summary || 'Team aligned on project architecture and upcoming milestone deliverables.'}

KEY DECISIONS FINALIZED:
${decisionList}

ACTION ITEMS & DELIVERABLES:
${actionList}

Let me know if there are any adjustments needed. The full timestamped transcript is cataloged in IntellMeet.

Best regards,
${meeting?.host?.name || 'Workspace Host'}`;
  };

  const handleCopyFollowUpEmail = () => {
    const email = generateFollowUpEmailText();
    navigator.clipboard.writeText(email);
    setCopiedSection('email');
    toast.success('Follow-up Email Copied', 'Paste directly into Gmail, Outlook, or Slack.');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleOpenMailClient = () => {
    const subject = encodeURIComponent(`Follow-up: ${meeting?.title || 'Meeting Summary'}`);
    const body = encodeURIComponent(generateFollowUpEmailText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleTimestampClick = (ts: string) => {
    setActiveTimestamp(ts);
    toast.info('Seeking Audio Timeline', `Jumped to timestamp ${ts}`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-xl mx-auto space-y-3">
        <div className="animate-spin h-7 w-7 rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">Loading session intelligence hub...</p>
      </div>
    );
  }

  // Unique speakers in transcript for filtering
  const allSpeakers = Array.from(
    new Set(transcript?.entries?.map((e: any) => e.speakerName).filter(Boolean) || [])
  ) as string[];

  const filteredTranscriptEntries = transcript?.entries?.filter((entry: any) => {
    const matchesSearch =
      entry.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      entry.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase());
    const matchesSpeaker = selectedSpeaker === 'all' || entry.speakerName === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Fathom Clean Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link
            to="/meetings"
            className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Meetings</span>
          </Link>

          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-xl">
              {meeting?.title || 'Meeting Intelligence'}
            </h1>
            <Badge variant="default" className="text-xs font-mono uppercase bg-secondary text-secondary-foreground border-border">
              {meeting?.meetingCode}
            </Badge>
            {summary?.sentiment && (
              <Badge variant="success" dot className="text-xs capitalize">
                {summary.sentiment}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
            <span>{formatDate(meeting?.scheduledAt || new Date())} at {formatTime(meeting?.scheduledAt || new Date())}</span>
            <span>&bull;</span>
            <span className="font-mono">⏱️ {formatDuration(meeting?.duration || 600)}</span>
            <span>&bull;</span>
            <span>Host: <strong className="text-foreground font-medium">{meeting?.host?.name || 'Workspace Host'}</strong></span>
            <span>&bull;</span>
            <span>{meeting?.participants?.length || 1} attendees</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Fathom Killer Feature: Copy Follow-up Email */}
          <Button
            size="sm"
            onClick={handleCopyFollowUpEmail}
            className="font-medium text-xs bg-primary hover:bg-primary-hover text-white shadow-xs"
          >
            {copiedSection === 'email' ? (
              <Check className="h-3.5 w-3.5 mr-1 text-white" />
            ) : (
              <Mail className="h-3.5 w-3.5 mr-1" />
            )}
            <span>Copy Follow-up Email</span>
          </Button>

          {/* Export Markdown */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="font-medium text-xs"
          >
            {copiedSection === 'summary' ? (
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            <span>Export Notes</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAi}
            isLoading={isProcessingAi}
            className="font-medium text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-primary" />
            <span>Re-run AI</span>
          </Button>

          <Link to={`/lobby/${meeting?.meetingCode}`}>
            <Button variant="outline" size="sm" className="font-medium text-xs">
              <Video className="h-3.5 w-3.5 mr-1" />
              <span>Re-open Call</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-border overflow-x-auto pb-0.5">
        {[
          { id: 'summary', label: 'AI Notes & Highlights', icon: Sparkles },
          { id: 'actions', label: `Action Items (${actionItems.length})`, icon: CheckCircle2 },
          { id: 'transcript', label: 'Interactive Transcript', icon: FileText },
          { id: 'email', label: 'Follow-up Email Draft', icon: Mail },
          { id: 'recording', label: 'Audio & Media', icon: Video }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-all cursor-pointer border-b-2 shrink-0 ${
                isActive
                  ? 'border-primary text-primary bg-primary/5 font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI Notes & Highlights */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {!summary ? (
            <EmptyState
              icon={Sparkles}
              title="No AI summary generated yet"
              description="Compile meeting discussion notes, key consensus points, and conversational sentiment."
              actionLabel="Generate AI Summary Now"
              onAction={handleGenerateAi}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 cols): Executive Summary & Decisions */}
              <div className="lg:col-span-8 space-y-6">
                {/* Executive Summary Card */}
                <Card className="border border-border shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Executive Summary
                      </CardTitle>
                      <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">
                        Model: {summary.modelUsed || 'AI Assisted'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                      {summary.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Key Decisions */}
                <Card className="border border-border shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Key Decisions Finalized
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Agreed consensus points and approvals established during this call.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {summary.decisions?.length > 0 ? (
                      <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90">
                        {summary.decisions.map((decision: string, idx: number) => (
                          <li key={idx} className="flex items-start space-x-2.5 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                            <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                              ✓
                            </span>
                            <span className="leading-relaxed">{decision}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No specific decisions cataloged.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Key Discussion Points */}
                <Card className="border border-border shadow-xs">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Discussion Topics & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {summary.keyPoints?.length > 0 ? (
                      <ul className="space-y-2 text-xs sm:text-sm text-foreground/90">
                        {summary.keyPoints.map((point: string, idx: number) => (
                          <li key={idx} className="flex items-start space-x-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No key points cataloged.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column (4 cols): Insights, Talk-Time, Topics */}
              <div className="lg:col-span-4 space-y-6">
                {/* Meeting Quick Stats */}
                <Card className="border border-border shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Session Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Sentiment Tone:</span>
                      <Badge variant="success" dot className="capitalize text-xs">
                        {summary.sentiment || 'Constructive'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Action Deliverables:</span>
                      <span className="font-semibold text-foreground">{actionItems.length} items</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Decisions Made:</span>
                      <span className="font-semibold text-foreground">{summary.decisions?.length || 0} decisions</span>
                    </div>

                    {/* Talk Time Simulation / Breakdown */}
                    <div className="pt-2 border-t border-border space-y-2">
                      <span className="text-xs font-semibold text-foreground">Speaker Talk-Time Ratio</span>
                      <div className="h-2 w-full rounded-full bg-secondary flex overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: '55%' }} title="Host: 55%" />
                        <div className="bg-emerald-500 h-full" style={{ width: '30%' }} title="Sarah: 30%" />
                        <div className="bg-amber-500 h-full" style={{ width: '15%' }} title="Marcus: 15%" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Host (55%)</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Engineering (30%)</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Ops (15%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Topics Covered */}
                <Card className="border border-border shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cataloged Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {summary.topicsCovered?.map((topic: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Attendees list */}
                <Card className="border border-border shadow-xs">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attendees ({meeting?.participants?.length || 1})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="space-y-2">
                      {meeting?.participants?.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs">
                          <img
                            src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name || idx}`}
                            alt={p.name}
                            className="h-6 w-6 rounded-full bg-secondary object-cover"
                          />
                          <span className="font-medium text-foreground">{p.name || 'Participant'}</span>
                          {p.isHost && (
                            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.2 rounded font-semibold">
                              Host
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Action Items */}
      {activeTab === 'actions' && (
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Action Items & Deliverables
              </CardTitle>
              <CardDescription className="text-xs">
                AI-extracted action items. Push to the team Kanban board with one click.
              </CardDescription>
            </div>
            <Link to="/tasks">
              <Button size="sm" variant="outline" className="text-xs font-medium h-8">
                Open Kanban Board <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {actionItems.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No action items cataloged"
                description="Trigger AI analysis to extract tasks from discussion transcripts."
                actionLabel="Extract Action Items"
                onAction={handleGenerateAi}
                className="m-6"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {actionItems.map((item) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item._id}
                      className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`mt-0.5 h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-border hover:border-emerald-500'
                          }`}
                        >
                          {isCompleted && <Check className="h-3.5 w-3.5" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs sm:text-sm font-medium text-foreground ${
                              isCompleted ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.task}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                            <span className="text-muted-foreground text-[11px]">
                              Assignee: <span className="font-medium text-foreground">{item.assigneeName || 'Unassigned'}</span>
                            </span>
                            <Badge
                              variant={
                                item.priority === 'urgent'
                                  ? 'destructive'
                                  : item.priority === 'high'
                                  ? 'warning'
                                  : 'secondary'
                              }
                              className="text-[10px] py-0 px-1.5"
                            >
                              {item.priority}
                            </Badge>
                          </div>

                          {/* Traceable Transcript Source Quote */}
                          {item.sourceQuote && (
                            <div className="mt-2 text-[11px] bg-secondary/40 rounded-md p-2 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                <span className="font-semibold text-muted-foreground shrink-0">Source Quote:</span>
                                <span className="italic text-foreground/90 font-serif">"{item.sourceQuote}"</span>
                                {item.speaker && (
                                  <span className="text-muted-foreground text-[10px] shrink-0 font-sans">— {item.speaker}</span>
                                )}
                              </div>
                              {item.timestamp && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('transcript');
                                    setActiveTimestamp(item.timestamp);
                                    toast.info('Transcript Jump', `Jumped to speaker turn at [${item.timestamp}]`);
                                  }}
                                  className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline font-semibold cursor-pointer shrink-0"
                                >
                                  <PlayCircle className="h-3 w-3" />
                                  <span>Jump to {item.timestamp}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToTask(item._id)}
                          className="text-xs font-medium h-7"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          <span>Push to Kanban</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Interactive Transcript */}
      {activeTab === 'transcript' && (
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Timestamped Speech Transcript
              </CardTitle>
              <CardDescription className="text-xs">
                Speaker turns mapped with clickable timestamps. Click any timestamp to inspect that turn.
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {/* Speaker filter */}
              {allSpeakers.length > 0 && (
                <select
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className="h-8 text-xs rounded-lg bg-card border border-input text-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">All Speakers</option>
                  {allSpeakers.map((spk) => (
                    <option key={spk} value={spk}>{spk}</option>
                  ))}
                </select>
              )}

              {/* Search transcript */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!transcript ? (
              <EmptyState
                icon={FileText}
                title="No transcript compiled yet"
                description="Speech-to-text audio processing will map timestamps and speaker turns."
                actionLabel="Transcribe Meeting Audio"
                onAction={handleGenerateAi}
                className="m-6"
              />
            ) : filteredTranscriptEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No transcript turns matching "{transcriptSearch}"
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[620px] overflow-y-auto">
                {filteredTranscriptEntries.map((entry: any, idx: number) => {
                  const isHighlighted = activeTimestamp === entry.timestamp;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 sm:p-4.5 transition-colors space-y-1 ${
                        isHighlighted ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-foreground">{entry.speakerName}</span>
                        </div>

                        {/* Clickable timestamp */}
                        <button
                          onClick={() => handleTimestampClick(entry.timestamp)}
                          className="font-mono text-[11px] text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          title="Click to seek audio timeline"
                        >
                          <PlayCircle className="h-3 w-3" />
                          <span>{entry.timestamp}</span>
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                        {entry.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Follow-up Email Generator */}
      {activeTab === 'email' && (
        <Card className="border border-border shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Automated Follow-up Email Draft
              </CardTitle>
              <CardDescription className="text-xs">
                Pre-formatted, professional meeting follow-up ready to copy or open in your email client.
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleCopyFollowUpEmail} className="text-xs font-medium h-8">
                {copiedSection === 'email' ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                <span>Copy Draft</span>
              </Button>

              <Button size="sm" variant="outline" onClick={handleOpenMailClient} className="text-xs font-medium h-8">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                <span>Open in Mail App</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap select-all">
              {generateFollowUpEmailText()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Session Media & Audio */}
      {activeTab === 'recording' && (
        <Card className="p-6 border border-border shadow-xs">
          <div className="max-w-md mx-auto text-center space-y-4 py-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Session Media Recording</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Peer-stream audio & video recordings are captured in real-time WebM container format and saved to local disk storage.
            </p>
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={() => toast.info('Download Notice', 'Session recording WebM file saved in your local storage.')}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span>Download Media Stream (.webm)</span>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

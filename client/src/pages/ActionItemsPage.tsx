import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ListTodo,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { formatDate } from '../lib/utils.js';

export function ActionItemsPage() {
  const toast = useToast();
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.actionItems.list({
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setActionItems(res.actionItems || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleToggleStatus = async (item: any) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.actionItems.update(item._id, { status: nextStatus });
      setActionItems((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, status: nextStatus } : a))
      );
      toast.success(
        nextStatus === 'completed' ? 'Action Completed' : 'Action Re-opened',
        `"${item.task}" marked as ${nextStatus}.`
      );
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    }
  };

  const handleConvertToTask = async (actionItemId: string) => {
    try {
      await api.actionItems.convertToTask(actionItemId);
      toast.success('Pushed to Kanban', 'Action item converted to active task.');
      loadData();
    } catch (err: any) {
      toast.error('Conversion Failed', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.actionItems.delete(id);
      setActionItems((prev) => prev.filter((a) => a._id !== id));
      toast.info('Item Removed', 'Action item deleted.');
    } catch (err: any) {
      toast.error('Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Action Items Registry
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Deliverables, follow-ups, and key decisions extracted from conference speech transcripts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'pending', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer border ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
              Loading action deliverables...
            </div>
          ) : actionItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No action items found"
              description="Deliverables automatically populate here when meetings conclude and are processed by AI."
              actionLabel="Go to Meetings"
              onAction={() => window.location.href = '/meetings'}
              className="m-4"
            />
          ) : (
            <div className="divide-y divide-border/60">
              {actionItems.map((item) => {
                const isCompleted = item.status === 'completed';
                return (
                  <div
                    key={item._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-border hover:border-emerald-500'
                        }`}
                        title={isCompleted ? 'Mark pending' : 'Mark completed'}
                      >
                        {isCompleted && <Check className="h-3.5 w-3.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p
                            className={`text-xs sm:text-sm font-semibold text-foreground ${
                              isCompleted ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.task}
                          </p>
                          <Badge
                            variant={
                              item.priority === 'urgent'
                                ? 'destructive'
                                : item.priority === 'high'
                                ? 'warning'
                                : 'secondary'
                            }
                            className="text-[10px] py-0"
                          >
                            {item.priority}
                          </Badge>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span>
                            Assignee: <span className="font-semibold text-foreground">{item.assigneeName || 'Unassigned'}</span>
                          </span>
                          {item.meetingId?.title && (
                            <>
                              <span>&bull;</span>
                              <span>From: {item.meetingId.title}</span>
                            </>
                          )}
                          {item.extractedByAi && (
                            <>
                              <span>&bull;</span>
                              <span className="text-primary font-semibold flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> AI Extracted
                              </span>
                            </>
                          )}
                        </div>

                        {item.sourceQuote && (
                          <div className="mt-2 text-[11px] bg-secondary/40 rounded-md p-2 border border-border/60">
                            <span className="font-semibold text-muted-foreground">Source Quote:</span>{' '}
                            <span className="italic text-foreground/90 font-serif">"{item.sourceQuote}"</span>
                            {item.timestamp && (
                              <span className="ml-2 font-mono text-[10px] text-primary font-semibold">[{item.timestamp}]</span>
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
                        className="text-xs font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span>Push to Kanban</span>
                      </Button>

                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete action item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

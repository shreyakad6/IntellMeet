import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreVertical,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Users,
  Kanban as KanbanIcon,
  Sparkles
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { Input, Label, Textarea } from '../components/ui/Input.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useAuthStore } from '../store/authStore.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { formatDate } from '../lib/utils.js';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400 dark:bg-slate-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-primary' },
  { id: 'done', label: 'Done', color: 'bg-emerald-500' }
];

export function KanbanPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Socket for real-time task sync
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_WS_URL || '/';
    const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.emit('join-workspace', 'default');

    socket.on('task-updated', (updatedTask: any) => {
      setTasks((prev) => {
        const index = prev.findIndex((t) => t._id === updatedTask._id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedTask;
          return next;
        }
        return [updatedTask, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes] = await Promise.all([
        api.tasks.list(),
        api.users.getAll().catch(() => ({ users: [] }))
      ]);
      setTasks(tasksRes.tasks || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const wsRes = await api.workspaces.list();
      const workspaceId = wsRes.workspaces[0]?._id;

      await api.tasks.create({
        title: title.trim(),
        description: description.trim(),
        workspaceId,
        assignee: assignee || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setAssignee('');
      setDueDate('');

      toast.success('Task Added', 'New workstream created on Kanban board.');
      loadTasks();
    } catch (err: any) {
      toast.error('Task Creation Error', err.message);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
      await api.tasks.update(taskId, { status: newStatus });
      toast.info('Status Updated', `Task moved to ${newStatus.replace('_', ' ')}.`);
    } catch (err: any) {
      toast.error('Update Failed', err.message);
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.tasks.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.info('Task Deleted', 'Workstream removed.');
    } catch (err: any) {
      toast.error('Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Linear Kanban Workstream
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time interactive task board synchronized via WebSockets across workspace members.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsModalOpen(true)} className="font-semibold shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((column) => {
          const colTasks = tasks.filter((t) => t.status === column.id);
          return (
            <div
              key={column.id}
              className="flex flex-col rounded-2xl border border-border bg-card/60 p-4 min-h-[550px] shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${column.color}`} />
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {column.label}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setStatus(column.id as any);
                    setIsModalOpen(true);
                  }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  title="Add task to column"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Task Cards Stack */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    <span>No tasks in {column.label}</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all duration-150 shadow-2xs space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          {task.title}
                        </h4>
                        <Badge
                          variant={
                            task.priority === 'urgent'
                              ? 'destructive'
                              : task.priority === 'high'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[9px] py-0 px-1.5 shrink-0"
                        >
                          {task.priority}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.sourceQuote && (
                        <div className="text-[10px] bg-secondary/50 rounded-md p-1.5 border border-border/50 text-foreground/80 italic font-serif">
                          "{task.sourceQuote}" {task.timestamp && <span className="font-sans font-semibold text-primary not-italic">[{task.timestamp}]</span>}
                        </div>
                      )}

                      {/* Footer: Assignee & Movement Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1.5 truncate">
                          {task.assignee?.avatar ? (
                            <img
                              src={task.assignee.avatar}
                              alt={task.assignee.name}
                              className="h-5 w-5 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-secondary text-[10px] font-bold flex items-center justify-center border border-border">
                              {task.assignee?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="text-[11px] truncate max-w-[90px]">
                            {task.assignee?.name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Move Buttons */}
                        <div className="flex items-center space-x-1">
                          {column.id !== 'todo' && (
                            <button
                              onClick={() =>
                                handleMoveTask(
                                  task._id,
                                  column.id === 'done' ? 'in_progress' : 'todo'
                                )
                              }
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                              title="Move back"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {column.id !== 'done' && (
                            <button
                              onClick={() =>
                                handleMoveTask(
                                  task._id,
                                  column.id === 'todo' ? 'in_progress' : 'done'
                                )
                              }
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                              title="Advance task"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Workstream Task"
        description="Add a task to the synchronized workspace Kanban board."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Optimize STUN peer candidate gathering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Detailed specifications, AC, and implementation details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.department || 'Member'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

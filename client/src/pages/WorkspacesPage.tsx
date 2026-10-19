import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Shield,
  Mail,
  Calendar,
  UserPlus,
  Lock,
  CheckCircle2,
  Building,
  KeyRound
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { Input, Label, Textarea } from '../components/ui/Input.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import { formatDate } from '../lib/utils.js';

export function WorkspacesPage() {
  const toast = useToast();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member');

  const loadData = async () => {
    try {
      setLoading(true);
      const [wsRes, usersRes] = await Promise.all([
        api.workspaces.list(),
        api.users.getAll().catch(() => ({ users: [] }))
      ]);
      setWorkspaces(wsRes.workspaces || []);
      setAllUsers(usersRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.workspaces.create({
        name: name.trim(),
        description: description.trim()
      });
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      toast.success('Workspace Created', `Workspace "${name}" is active.`);
      loadData();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedWorkspace) return;

    try {
      await api.workspaces.addMember(selectedWorkspace._id, {
        userId: selectedUserId,
        role: memberRole
      });
      setIsInviteModalOpen(false);
      setSelectedUserId('');
      toast.success('Member Added', 'User joined the workspace successfully.');
      loadData();
    } catch (err: any) {
      toast.error('Add Member Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Team Workspaces & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage organization workspaces, project memberships, and granular role assignments.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="font-semibold shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Workspace</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
          Loading workspace directories...
        </div>
      ) : workspaces.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No workspaces created yet"
          description="Create your first organization workspace to organize conference rooms and teams."
          actionLabel="Create Workspace"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {workspaces.map((ws) => (
            <Card key={ws._id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                        {ws.name.charAt(0)}
                      </div>
                      <CardTitle className="text-lg">{ws.name}</CardTitle>
                      <Badge variant="default" className="text-[10px]">Active</Badge>
                    </div>
                    {ws.description && (
                      <CardDescription className="text-xs sm:text-sm">{ws.description}</CardDescription>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedWorkspace(ws);
                      setIsInviteModalOpen(true);
                    }}
                    className="shrink-0 font-semibold"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    <span>Add Team Member</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="p-4 sm:p-5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Workspace Members ({ws.members?.length || 0})
                  </h4>

                  <div className="divide-y divide-border/60">
                    {ws.members?.map((m: any, idx: number) => {
                      const memberData = m.user || {};
                      const isAdmin = m.role === 'admin';
                      return (
                        <div
                          key={idx}
                          className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center space-x-3 truncate">
                            {memberData.avatar ? (
                              <img
                                src={memberData.avatar}
                                alt={memberData.name}
                                className="h-9 w-9 rounded-xl object-cover border border-border"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs flex items-center justify-center border border-border">
                                {memberData.name?.charAt(0) || 'U'}
                              </div>
                            )}

                            <div className="truncate">
                              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                {memberData.name || 'Member'}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {memberData.email || 'user@intellmeet.io'} &bull; {memberData.department || 'Engineering'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[10px] capitalize">
                              {m.role || 'Member'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Role-Based Permissions Matrix */}
          <Card className="p-5 bg-card/60 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              Role-Based Access Control (RBAC) Specification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">Admin Privileges</span>
                <p>Full room control, workspace membership management, AI summarization re-runs, and system metrics inspection.</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground block">Member Privileges</span>
                <p>Create and join conferences, participate in real-time chat, update Kanban tasks, and view post-meeting intelligence.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Team Workspace"
        description="Set up a dedicated workspace for collaboration and meeting tracking."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <Label htmlFor="ws-name">Workspace Name</Label>
            <Input
              id="ws-name"
              placeholder="e.g. Distributed Systems & Reliability"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="ws-desc">Description</Label>
            <Textarea
              id="ws-desc"
              placeholder="Workspace objectives, charter, and department focus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Workspace</Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Add Workspace Member"
        description={`Assign a registered user to ${selectedWorkspace?.name || 'this workspace'}.`}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <Label htmlFor="user-select">Select User</Label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a team member...</option>
              {allUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email} - {u.department || 'Member'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="role-select">Workspace Role</Label>
            <select
              id="role-select"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add to Workspace</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

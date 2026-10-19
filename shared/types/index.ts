export type UserRole = 'admin' | 'member';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface IParticipant {
  user: IUser | string;
  joinedAt?: string;
  leftAt?: string;
  isHost?: boolean;
  name?: string;
  avatar?: string;
  peerId?: string;
}

export interface IActionItem {
  _id?: string;
  task: string;
  description?: string;
  assignee?: IUser | string | null;
  dueDate?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  meetingId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMeetingSummary {
  _id?: string;
  meetingId: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  topicsCovered: string[];
  sentiment?: 'positive' | 'neutral' | 'constructive' | 'mixed';
  actionItems?: IActionItem[];
  generatedByAi: boolean;
  isDemoMode: boolean;
  createdAt?: string;
}

export interface ITranscriptEntry {
  speakerId?: string;
  speakerName: string;
  timestamp: string;
  text: string;
  confidence?: number;
}

export interface ITranscript {
  _id?: string;
  meetingId: string;
  entries: ITranscriptEntry[];
  fullText: string;
  isDemoMode: boolean;
  durationSeconds?: number;
  createdAt?: string;
}

export interface IMeeting {
  _id: string;
  title: string;
  description?: string;
  meetingCode: string;
  host: IUser | string;
  participants: IParticipant[];
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  status: MeetingStatus;
  duration?: number; // duration in seconds
  workspaceId?: string;
  recordingUrl?: string;
  recordingSize?: number;
  hasTranscript?: boolean;
  hasSummary?: boolean;
  actionItemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  meetingId: string;
  sender: IUser | { _id: string; name: string; avatar?: string; email?: string };
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  workspaceId: string;
  meetingId?: string;
  assignee?: IUser | string | null;
  reporter?: IUser | string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspace {
  _id: string;
  name: string;
  description?: string;
  owner: IUser | string;
  members: {
    user: IUser | string;
    role: 'admin' | 'member';
    joinedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 
  | 'meeting_invite'
  | 'meeting_starting'
  | 'task_assigned'
  | 'action_item_assigned'
  | 'mention'
  | 'meeting_summary_ready';

export interface INotification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedMeetingId?: string;
  relatedTaskId?: string;
  isRead: boolean;
  createdAt: string;
}

// Socket signaling event payload contracts
export interface JoinRoomPayload {
  meetingCode: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isHost?: boolean;
}

export interface SignalPayload {
  to: string;
  from: string;
  signalData: any;
  type: 'offer' | 'answer' | 'ice-candidate';
}

export interface ChatMessagePayload {
  meetingCode: string;
  meetingId: string;
  message: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
}

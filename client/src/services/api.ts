const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  statusCode: number;
  data: any;
  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('intellmeet_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>)
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      // Clear expired token
      localStorage.removeItem('intellmeet_token');
      localStorage.removeItem('intellmeet_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (userData: { name: string; email: string; password: string; department?: string; role?: string }) =>
      request<{ success: boolean; token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' })
  },

  // Users
  users: {
    getAll: () => request<{ success: boolean; users: any[] }>('/users'),
    updateProfile: (profile: any) =>
      request<{ success: boolean; user: any }>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile)
      })
  },

  // Meetings
  meetings: {
    list: (params?: { status?: string; search?: string; from?: string; to?: string; favorite?: string; tag?: string; hasSummary?: string }) => {
      const cleanParams: any = {};
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') cleanParams[key] = val;
        });
      }
      const query = new URLSearchParams(cleanParams).toString();
      return request<{ success: boolean; count: number; meetings: any[] }>(`/meetings${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request<{ success: boolean; meeting: any }>(`/meetings/${id}`),
    getByCode: (code: string) => request<{ success: boolean; meeting: any }>(`/meetings/code/${code}`),
    create: (data: { title: string; description?: string; scheduledAt?: string; workspaceId?: string; tags?: string[] }) =>
      request<{ success: boolean; meeting: any }>('/meetings', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    start: (id: string) => request<{ success: boolean; meeting: any }>(`/meetings/${id}/start`, { method: 'PATCH' }),
    end: (id: string) => request<{ success: boolean; meeting: any }>(`/meetings/${id}/end`, { method: 'PATCH' }),
    toggleFavorite: (id: string) => request<{ success: boolean; isFavorite: boolean; message: string }>(`/meetings/${id}/favorite`, { method: 'PATCH' }),
    delete: (id: string) => request<{ success: boolean; message: string }>(`/meetings/${id}`, { method: 'DELETE' })
  },

  // In-meeting Chat messages
  chat: {
    getMessages: (meetingCode: string) =>
      request<{ success: boolean; messages: any[] }>(`/chat/${meetingCode}`)
  },

  // AI Pipeline
  ai: {
    transcribe: (meetingId: string, customTranscript?: string) =>
      request<{ success: boolean; transcript: any }>(`/ai/meetings/${meetingId}/transcribe`, {
        method: 'POST',
        body: JSON.stringify({ customTranscript })
      }),
    getTranscript: (meetingId: string) =>
      request<{ success: boolean; transcript: any }>(`/ai/meetings/${meetingId}/transcript`),
    summarize: (meetingId: string) =>
      request<{ success: boolean; summary: any }>(`/ai/meetings/${meetingId}/summary`, {
        method: 'POST'
      }),
    getSummary: (meetingId: string) =>
      request<{ success: boolean; summary: any }>(`/ai/meetings/${meetingId}/summary`),
    extractActionItems: (meetingId: string) =>
      request<{ success: boolean; actionItems: any[]; isDemoMode: boolean }>(`/ai/meetings/${meetingId}/action-items`, {
        method: 'POST'
      })
  },

  // Action Items
  actionItems: {
    list: (params?: { meetingId?: string; status?: string; assignee?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ success: boolean; actionItems: any[] }>(`/action-items${query ? `?${query}` : ''}`);
    },
    create: (data: { task: string; description?: string; meetingId: string; assignee?: string | null; priority?: string; dueDate?: string | null }) =>
      request<{ success: boolean; actionItem: any }>('/action-items', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; actionItem: any }>(`/action-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    convertToTask: (id: string, workspaceId?: string) =>
      request<{ success: boolean; task: any }>(`/action-items/${id}/convert-to-task`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId })
      }),
    delete: (id: string) => request<{ success: boolean }>(`/action-items/${id}`, { method: 'DELETE' })
  },

  // Workspaces
  workspaces: {
    list: () => request<{ success: boolean; workspaces: any[] }>('/workspaces'),
    create: (data: { name: string; description?: string }) =>
      request<{ success: boolean; workspace: any }>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    addMember: (workspaceId: string, data: { userId: string; role?: string }) =>
      request<{ success: boolean; workspace: any }>(`/workspaces/${workspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // Tasks (Kanban)
  tasks: {
    list: (params?: { workspaceId?: string; status?: string; priority?: string; assignee?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ success: boolean; tasks: any[] }>(`/tasks${query ? `?${query}` : ''}`);
    },
    create: (data: any) =>
      request<{ success: boolean; task: any }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; task: any }>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }),
    delete: (id: string) => request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' })
  },

  // Notifications
  notifications: {
    list: () => request<{ success: boolean; unreadCount: number; notifications: any[] }>('/notifications'),
    markRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' })
  },

  // Analytics
  analytics: {
    getDashboard: () => request<{ success: boolean; analytics: any }>('/analytics/dashboard')
  }
};

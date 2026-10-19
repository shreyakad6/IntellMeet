import { create } from 'zustand';
import { api } from '../services/api.js';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  department?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, department?: string) => Promise<void>;
  demoLogin: (role: 'admin' | 'member') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('intellmeet_user') || 'null'),
  token: localStorage.getItem('intellmeet_token'),
  isAuthenticated: !!localStorage.getItem('intellmeet_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('intellmeet_token', res.token);
      localStorage.setItem('intellmeet_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name: string, email: string, password: string, department?: string) => {
    set({ isLoading: true });
    try {
      const res = await api.auth.register({ name, email, password, department });
      localStorage.setItem('intellmeet_token', res.token);
      localStorage.setItem('intellmeet_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  demoLogin: async (role: 'admin' | 'member') => {
    set({ isLoading: true });
    try {
      const email = role === 'admin' ? 'alex.admin@intellmeet.io' : 'sarah.dev@intellmeet.io';
      const password = 'Password123!';
      const res = await api.auth.login({ email, password });
      localStorage.setItem('intellmeet_token', res.token);
      localStorage.setItem('intellmeet_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    api.auth.logout().catch(() => {});
    localStorage.removeItem('intellmeet_token');
    localStorage.removeItem('intellmeet_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('intellmeet_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.auth.getMe();
      localStorage.setItem('intellmeet_user', JSON.stringify(res.user));
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('intellmeet_token');
      localStorage.removeItem('intellmeet_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

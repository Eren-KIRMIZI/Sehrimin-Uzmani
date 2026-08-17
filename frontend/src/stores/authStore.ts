import { create } from 'zustand';
import type { User, AuthTokens } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: JSON.parse(localStorage.getItem('tokens') || 'null'),
  isAuthenticated: !!localStorage.getItem('tokens'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = res.data;
      const tokens: AuthTokens = { access_token, refresh_token, token_type: 'bearer' };
      localStorage.setItem('tokens', JSON.stringify(tokens));
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      const { access_token, refresh_token, user } = res.data;
      const tokens: AuthTokens = { access_token, refresh_token, token_type: 'bearer' };
      localStorage.setItem('tokens', JSON.stringify(tokens));
      set({ user, tokens, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('tokens');
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('tokens');
      set({ user: null, tokens: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));

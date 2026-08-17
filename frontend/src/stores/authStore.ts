import { create } from 'zustand';
import type { User, AuthTokens } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: JSON.parse(localStorage.getItem('tokens') || 'null'),
  isAuthenticated: !!localStorage.getItem('tokens'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = res.data;
      const tokens: AuthTokens = { access_token, refresh_token, token_type: 'bearer' };
      localStorage.setItem('tokens', JSON.stringify(tokens));
      set({ user, tokens, isAuthenticated: true, isLoading: false, error: null });
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Giris yapilamadi. Bilgilerinizi kontrol edin.";
      set({ isLoading: false, error: msg });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      const { access_token, refresh_token, user } = res.data;
      const tokens: AuthTokens = { access_token, refresh_token, token_type: 'bearer' };
      localStorage.setItem('tokens', JSON.stringify(tokens));
      set({ user, tokens, isAuthenticated: true, isLoading: false, error: null });
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Kayit yapilamadi. Bilgilerinizi kontrol edin.";
      set({ isLoading: false, error: msg });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout API errors
    }
    localStorage.removeItem('tokens');
    set({ user: null, tokens: null, isAuthenticated: false, error: null });
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
  clearError: () => set({ error: null }),
}));

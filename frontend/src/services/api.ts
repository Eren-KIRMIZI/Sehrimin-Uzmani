import axios from 'axios';
import type { AuthTokens } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kimlik doğrulama gerektirmeyen uçlar — 401'de refresh denenmaz
const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/login/2fa', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tek uçuşlu (single-flight) refresh — paralel 401'ler tek refresh tetikler
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await axios.post<AuthTokens>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  });

  const { access_token, refresh_token } = response.data;
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);
  return access_token;
};

const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
};

// Response interceptor — handle 401, auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !PUBLIC_ENDPOINTS.some((e) => url.includes(e))
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        forceLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

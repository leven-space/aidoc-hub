import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';
import { clearAuthCookie } from '../utils/authCookie';

type TimedAxiosConfig = InternalAxiosRequestConfig & { __startTime?: number };

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isDev) {
    console.debug(`[API] → ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
  }
  (config as TimedAxiosConfig).__startTime = Date.now();
  return config;
});

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - ((response.config as TimedAxiosConfig).__startTime || 0);
    const wrapped = response.data as ApiResponse<unknown>;
    if (wrapped && typeof wrapped === 'object' && 'success' in wrapped) {
      response.data = wrapped.data;
    }
    if (isDev) {
      console.debug(
        `[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`,
      );
    }
    return response;
  },
  (error) => {
    const duration = Date.now() - ((error.config as TimedAxiosConfig | undefined)?.__startTime || 0);
    if (isDev) {
      console.error(
        `[API] ✗ ${error.response?.status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`,
        error.response?.data || error.message,
      );
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      clearAuthCookie();
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/share')
      ) {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

export default api;

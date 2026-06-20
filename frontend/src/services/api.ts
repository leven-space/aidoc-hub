import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';
import { clearAuthCookie } from '../utils/authCookie';
import i18n from '../i18n';

type TimedAxiosConfig = InternalAxiosRequestConfig & { __startTime?: number };

const isDev = import.meta.env.DEV;

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = i18n.language || 'zh-CN';
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
    const rawMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    const code = error.response?.data?.code as string | undefined;
    let message: string;
    if (typeof rawMessage === 'string' && rawMessage.trim()) {
      // Prefer server message — it may include field-level validation details.
      message = rawMessage;
    } else if (Array.isArray(rawMessage)) {
      message = rawMessage.join(', ');
    } else if (code && i18n.exists(`errors.${code}`)) {
      message = i18n.t(`errors.${code}`);
    } else {
      message = i18n.t('common.requestFailed');
    }
    return Promise.reject(new Error(message));
  },
);

export default api;

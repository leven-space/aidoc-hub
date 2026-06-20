import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import { authApi } from '../services';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name?: string) => Promise<void>;
  loginWithToken: (accessToken: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('accessToken'));

  const loginWithToken = useCallback((accessToken: string, nextUser: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setAuthCookie(accessToken);
    setUser(nextUser);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.profile();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      clearAuthCookie();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAuthCookie(token);
      refreshProfile().finally(() => setLoading(false));
    } else {
      clearAuthCookie();
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = async (phone: string, password: string) => {
    const res = await authApi.login({ phone, password });
    loginWithToken(res.accessToken, res.user);
  };

  const register = async (phone: string, password: string, name?: string) => {
    const res = await authApi.register({ phone, password, name });
    loginWithToken(res.accessToken, res.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    clearAuthCookie();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithToken, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

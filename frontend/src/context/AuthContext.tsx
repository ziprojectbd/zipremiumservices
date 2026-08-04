import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { decodeJWT, isTokenExpired, refreshAccessToken, setOnTokenRefreshed } from '../lib/axios';

interface User {
  id?: string;
  _id?: string;
  email?: string;
  username?: string;
  name?: string;
  role?: string;
  image?: string;
  isTrader?: boolean;
  kycStatus?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (credential: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setAuthFromToken: (token: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount: restore from localStorage, refresh if needed
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // Check for token from URL (Google OAuth callback, etc.)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        window.history.replaceState({}, '', window.location.pathname);
        localStorage.setItem('token', urlToken);
        if (!cancelled) setToken(urlToken);
        const urlRefreshToken = params.get('refreshToken');
        if (urlRefreshToken) {
          localStorage.setItem('refreshToken', urlRefreshToken);
        }
        // Fetch user info in background
        api.get('/auth/user').then((res) => {
          if (!cancelled && res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        }).catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          if (!cancelled) setToken(null);
        });
        if (!cancelled) setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedToken && storedToken !== 'undefined' && decodeJWT(storedToken)) {
        // We have a token — check if it's expired
        if (isTokenExpired(storedToken)) {
          // Token expired — try to refresh silently
          if (storedRefreshToken) {
            const newToken = await refreshAccessToken();
            if (newToken && !cancelled) {
              setToken(newToken);
              if (storedUser) {
                try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
              }
              setLoading(false);
              return;
            }
          }
          // Refresh failed or no refresh token — clear auth
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        } else {
          // Token is still valid
          if (!cancelled) setToken(storedToken);
          if (storedUser && !cancelled) {
            try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
          }
        }
      } else if (storedToken) {
        // Stored token is invalid — clean up
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      if (!cancelled) setLoading(false);
    }

    initAuth();

    // Register callback so axios interceptor can update AuthContext state after silent refresh
    setOnTokenRefreshed((data) => {
      setToken(data.accessToken);
      if (data.user) {
        setUser(data.user as User);
      }
    });

    return () => {
      cancelled = true;
      setOnTokenRefreshed(null);
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/user');
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken || '');
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await api.post('/signup', data);
      if (res.data.success) {
        return { success: true };
      }
      return { success: false, error: res.data.error || 'Signup failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Signup failed' };
    }
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.data.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken || '');
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.error || 'Google sign-in failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Google sign-in failed' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }, []);

  const setAuthFromToken = useCallback(async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    try {
      const res = await api.get('/auth/user');
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch {
      // token invalid, will clear on next navigation
    }
    return null;
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    googleLogin,
    logout,
    refreshUser,
    setAuthFromToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

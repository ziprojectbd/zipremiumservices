import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, {
  setOnTokenRefreshed,
  bootstrapSession,
  resetSessionBootstrap,
  clearStoredAuth,
} from '../lib/axios';

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
  googleLogin: (credential: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setAuthFromToken: (token: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth on mount.
  //
  // The access token is restored from localStorage when it is still valid; when
  // it is missing or expired the HttpOnly refresh cookie restores the session.
  // That cookie is what makes the session survive a browser restart, and it is
  // not readable by scripts, so this is also the XSS-safe path.
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // 1. A token handed back as a URL fragment (Google OAuth fallback).
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      // Only treat a URL `token` as an auth token when it is a real JWT
      // (header.payload.signature — 3 dot-separated segments). The payment flow
      // also carries a query param named `token` (a random hex payment result
      // token on /payment/process); treating that as a session token would wipe
      // the session and eventually force a redirect to /sign-in.
      if (urlToken && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(urlToken)) {
        window.history.replaceState({}, '', window.location.pathname);
        localStorage.setItem('token', urlToken);
        if (!cancelled) setToken(urlToken);

        // Older builds passed the refresh token here too. Replay it once so the
        // backend can store it as an HttpOnly cookie, then forget it locally.
        const urlRefreshToken = params.get('refreshToken');
        if (urlRefreshToken) {
          try {
            await api.post('/auth/refresh', { refreshToken: urlRefreshToken });
            localStorage.removeItem('refreshToken');
          } catch {
            /* the access token above is already usable */
          }
        }
        localStorage.removeItem('refreshToken');

        // Fetch user info in background. A failure here (network / 5xx) must
        // NOT invalidate the just-issued token — the user stays signed in and
        // the profile is fetched again on the next API call.
        api.get('/auth/user').then((res) => {
          if (!cancelled && res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        }).catch(() => { /* transient — keep the session */ });
        if (!cancelled) setLoading(false);
        return;
      }

      // 2. Came back from the Google OAuth redirect. The tokens were delivered
      //    as an HttpOnly cookie; the access token still needs fetching.
      if (params.get('auth') === 'success') {
        params.delete('auth');
        const qs = params.toString();
        window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
        resetSessionBootstrap();
        const restored = await bootstrapSession();
        if (!cancelled) {
          setToken(restored.accessToken);
          setUser((restored.user as User) || null);
          setLoading(false);
        }
        return;
      }

      // 3. Normal startup: verify and restore the existing session.
      const restored = await bootstrapSession();
      if (cancelled) return;
      setToken(restored.accessToken);
      if (restored.user) setUser(restored.user as User);
      setLoading(false);
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
        const { accessToken, user: userData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        // The refresh token is delivered as an HttpOnly cookie by the server and
        // is deliberately not stored here; drop anything an older build left.
        localStorage.removeItem('refreshToken');
        resetSessionBootstrap();
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.data.success) {
        const { accessToken, user: userData } = res.data.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('refreshToken');
        resetSessionBootstrap();
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.error || 'Google sign-in failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Google sign-in failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    // Ask the backend to revoke the session first. It authenticates from the
    // HttpOnly refresh cookie, so this works even after the access token
    // expired. Local state is cleared regardless of the outcome — the user must
    // always end up signed out in the UI.
    try {
      await api.post('/auth/logout', {});
    } catch {
      /* server unreachable — clear locally anyway */
    }

    setToken(null);
    setUser(null);
    clearStoredAuth();
    resetSessionBootstrap();
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

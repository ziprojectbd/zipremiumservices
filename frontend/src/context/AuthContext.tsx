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
      // Only treat a URL `token` as an auth token when it is a real JWT
      // (header.payload.signature — 3 dot-separated segments). The payment
      // flow also carries a query param named `token` (a random hex payment
      // result token on /payment/process); treating that as a session token
      // would wipe the session and eventually force a redirect to /sign-in.
      if (urlToken && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(urlToken)) {
        window.history.replaceState({}, '', window.location.pathname);
        localStorage.setItem('token', urlToken);
        if (!cancelled) setToken(urlToken);
        const urlRefreshToken = params.get('refreshToken');
        if (urlRefreshToken) {
          localStorage.setItem('refreshToken', urlRefreshToken);
        }
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

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedToken && storedToken !== 'undefined' && decodeJWT(storedToken)) {
        // We have a token — check if it's expired
        if (isTokenExpired(storedToken)) {
          // Token expired — try to refresh silently. If the refresh fails due to
          // a transient problem (network / 5xx / server restart), keep the
          // stored session intact and leave the user signed in — the next
          // request will retry the refresh. Only a definitive server rejection
          // (refresh token invalid/expired/reused, or the refresh endpoint
          // explicitly refusing it) terminates the session.
          const newToken = await refreshAccessToken();
          if (newToken && !cancelled) {
            setToken(newToken);
            if (storedUser) {
              try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
            }
            setLoading(false);
            return;
          }
          // Distinguish "server rejected the token" (definitive → clear) from
          // "refresh request failed to reach the server" (transient → keep).
          let definitive = false;
          try {
            const probe = await api.get('/auth/user');
            if (!probe.data?.success) definitive = true;
          } catch (probeErr) {
            const probeStatus = (probeErr as { response?: { status?: number } })?.response?.status;
            definitive = probeStatus === 401 || probeStatus === 403;
          }
          if (definitive && !cancelled) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          } else if (!cancelled) {
            // Transient failure — keep the persisted session. The probe request
            // above may itself have triggered a successful interceptor refresh,
            // so read the token freshly from localStorage rather than restoring
            // the original (expired) one into state.
            const freshToken = localStorage.getItem('token') || storedToken;
            setToken(freshToken);
            if (storedUser) {
              try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
            }
          }
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
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        } else {
          localStorage.removeItem('refreshToken');
        }
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
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        } else {
          localStorage.removeItem('refreshToken');
        }
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: res.data.error || 'Google sign-in failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Google sign-in failed' };
    }
  }, []);

  const logout = useCallback(() => {
    // Revoke the refresh token server-side (Bearer access token is sent by the
    // shared axios instance; the refresh token travels in the body). If the
    // server is unreachable or rejects the request, local state is still wiped
    // so the user is fully signed out from the browser's perspective — the
    // un-revoked token simply expires on its own (7d) server-side.
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const currentToken = localStorage.getItem('token');
    if (storedRefreshToken && currentToken) {
      api.post('/auth/logout', { refreshToken: storedRefreshToken }, {
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => { /* non-blocking: local logout already proceeds */ });
    }
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

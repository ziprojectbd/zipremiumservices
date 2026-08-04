import axios from 'axios';
import maintenanceStore from '../store/maintenanceStore';

// Helper: decode JWT payload (handles base64url → JSON)
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp as number) * 1000;
}

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

// Callback for notifying AuthContext of token/user updates after a silent refresh
type RefreshCallback = (data: { accessToken: string; refreshToken?: string; user?: Record<string, unknown> }) => void;
let onTokenRefreshed: RefreshCallback | null = null;
export function setOnTokenRefreshed(cb: RefreshCallback | null) {
  onTokenRefreshed = cb;
}

// Refresh the access token (exported for proactive use)
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) return null;

  try {
    const res = await axios.post('/api/auth/refresh', { refreshToken: storedRefreshToken });
    if (res.data.success) {
      const { accessToken, refreshToken: newRefreshToken, user: userData } = res.data.data;
      localStorage.setItem('token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      // Notify AuthContext
      if (onTokenRefreshed) {
        onTokenRefreshed({ accessToken, refreshToken: newRefreshToken, user: userData });
      }
      return accessToken;
    }
  } catch {
    // Refresh failed
  }
  return null;
}

// Determine the correct login URL based on the current page context
function getLoginRedirectUrl(): string {
  if (typeof window === 'undefined') return '/sign-in';
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return '/admin/login';
  return '/sign-in';
}

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  const path = window.location.pathname;
  const loginUrl = path.startsWith('/admin') ? '/admin/login' : '/sign-in';
  if (!path.startsWith('/sign-in') && !path.startsWith('/sign-up') && !path.startsWith('/admin/login')) {
    window.location.href = loginUrl;
  }
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    // Skip proactive refresh for auth endpoints to avoid refresh loops and for the refresh request itself
    const isAuthEndpoint = config.url?.startsWith('/auth/') || config.url === '/signup';
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        }
        // Refresh failed — clear auth and reject so the response interceptor
        // doesn't try to refresh again (we already tried)
        clearAuthAndRedirect();
        return Promise.reject(new axios.Cancel('Token expired, refresh failed'));
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't handle cancelled requests (from our own request interceptor)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Maintenance mode detection — skip for auth routes and admin users
    if (error.response?.status === 503) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthRoute = currentPath.startsWith('/admin/login') || currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up');
      const isAuthApi = error.config?.url?.startsWith('/auth/') || error.config?.url === '/signup';

      // Check if user is admin (they bypass maintenance on backend)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const payload = token ? decodeJWT(token) : null;
      const isAdmin = payload?.role === 'admin';

      if (!isAuthRoute && !isAuthApi && !isAdmin) {
        maintenanceStore.setMaintenance(
          error.response?.data?.message || 'We are currently under maintenance. Please check back soon.'
        );
      }
    }

    // Automatic token refresh on 401 (skip if already refreshing or if this IS the refresh request)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!storedRefreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken: storedRefreshToken });
        if (res.data.success) {
          const { accessToken, refreshToken: newRefreshToken, user: userData } = res.data.data;
          localStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          // Notify AuthContext
          if (onTokenRefreshed) {
            onTokenRefreshed({ accessToken, refreshToken: newRefreshToken, user: userData });
          }
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Legacy 401 handler — only if refresh wasn't attempted
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthAndRedirect();
    }
    return Promise.reject(error);
  }
);

export default api;

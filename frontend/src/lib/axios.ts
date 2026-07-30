import axios from 'axios';
import maintenanceStore from '../store/maintenanceStore';

// Helper: decode JWT payload (handles base64url → JSON)
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
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

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
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
        // No refresh token — can't recover, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (!window.location.pathname.startsWith('/sign-in') && !window.location.pathname.startsWith('/sign-up')) {
            window.location.href = '/sign-in';
          }
        }
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
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          localStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear everything and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (!window.location.pathname.startsWith('/sign-in') && !window.location.pathname.startsWith('/sign-up')) {
            window.location.href = '/sign-in';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Legacy 401 handler — only if refresh wasn't attempted
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/sign-in') && !window.location.pathname.startsWith('/sign-up')) {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

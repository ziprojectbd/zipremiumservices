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

// Distinguish "definitive auth invalidation" (token rejected as invalid/expired by
// the server — retrying will never succeed) from transient failures (network,
// 5xx, timeout) where the stored session is still valid and must NOT be dropped.
// Only the former may clear persisted auth. Definitive invalidation includes:
//  - 401 (bad/expired credentials or refresh-token reuse detection on the backend)
//  - 403 on an authenticated request (account deactivated / role revoked)
function isDefinitiveAuthError(status: number | undefined, url: string | undefined): boolean {
  if (status === 401 || status === 403) return true;
  // The /auth/refresh endpoint returns 200 with success:false for expired/invalid
  // refresh tokens rather than an error status.
  if (status === 200 && url?.includes('/auth/refresh')) return true;
  return false;
}

// Refresh the access token (exported for proactive use)
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) return null;

  try {
    const res = await axios.post('/api/auth/refresh', { refreshToken: storedRefreshToken });
    if (res.data?.success) {
      const { accessToken, refreshToken: newRefreshToken, user: userData } = res.data.data || {};
      if (!accessToken) return null;
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
    // Refresh failed (network / 5xx / timeout) — the stored session is still
    // valid; the caller decides whether this failure is definitive.
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
        // Refresh failed. Only a definitive server rejection means the session
        // is gone; a network/5xx blip must NOT log the user out. Let the request
        // continue with the stale token — the response interceptor will retry
        // the refresh and only clear auth on definitive failure.
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
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    // Maintenance mode detection — skip for auth routes and admin users
    if (status === 503) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthRoute = currentPath.startsWith('/admin/login') || currentPath.startsWith('/sign-in') || currentPath.startsWith('/sign-up');
      const isAuthApi = url.startsWith('/auth/') || url === '/signup';

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
    if (status === 401 && !originalRequest._retry && !url.includes('/auth/refresh')) {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      // A 401 with no refresh token stored means there is no session to restore.
      // Only clear auth if we're on a protected page; public pages (e.g. a
      // misbehaving public endpoint) must not trigger a forced logout.
      if (!storedRefreshToken) {
        if (getLoginRedirectUrl() === window.location.pathname) {
          return Promise.reject(error);
        }
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
        if (res.data?.success) {
          const { accessToken, refreshToken: newRefreshToken, user: userData } = res.data.data || {};
          if (accessToken) {
            localStorage.setItem('token', accessToken);
          }
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
        // Refresh returned success:false → the refresh token was rejected as
        // invalid/expired/reused. This is definitive — clear and redirect.
        processQueue(error, null);
        clearAuthAndRedirect();
        return Promise.reject(error);
      } catch (refreshError) {
        // Refresh request itself errored (network / 5xx / timeout). The session
        // may still be valid — do NOT clear auth. Let the original error through;
        // the caller sees it and can retry.
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Legacy 401 handler — only fires when the refresh path above did not run
    // (e.g. the request was already retried, or it was the refresh request
    // itself). Only clear auth on a definitive server rejection, and never on
    // public endpoints (which legitimately 401 without meaning the session is
    // dead).
    if (status === 401 && typeof window !== 'undefined') {
      const isAuthApi = url.startsWith('/auth/') || url === '/signup';
      const isPublic = url.startsWith('/products') || url.startsWith('/categories') ||
        url.startsWith('/orders') || url.startsWith('/cart') || url.startsWith('/campaigns') ||
        url.startsWith('/coupons') || url.startsWith('/public') || url.startsWith('/reviews') ||
        url.startsWith('/payment-resolve') || url.startsWith('/convert-price') ||
        url.startsWith('/proxy') || url.startsWith('/health');
      if (!isAuthApi && !isPublic) {
        clearAuthAndRedirect();
      }
      return Promise.reject(error);
    }

    // 403 on an authenticated request = definitive invalidation (account
    // deactivated / role revoked). Clear auth, but only when a token was
    // actually being sent with the request.
    if (status === 403 && !url.includes('/auth/')) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        clearAuthAndRedirect();
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;

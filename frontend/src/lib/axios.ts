import axios from 'axios';
import maintenanceStore from '../store/maintenanceStore';

// ---------------------------------------------------------------------------
// Session model (client side)
//
//  - The ACCESS token is a short-lived JWT kept in localStorage and sent as
//    `Authorization: Bearer …`. It is not a credential on its own: it cannot
//    mint a new session.
//  - The REFRESH token lives in an HttpOnly cookie set by the backend. No script
//    can read it, so an XSS payload cannot steal a long-lived session. The
//    browser attaches it automatically (`withCredentials`).
//
// Because of that split, the common mutations (refresh, logout) do not read the
// refresh token at all — they simply call the endpoint with credentials and let
// the browser send the cookie.
// ---------------------------------------------------------------------------

/** Cookie-backed refresh endpoint. `withCredentials` is what actually sends it. */
const REFRESH_URL = '/api/auth/refresh';

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

// Distinguish "definitive auth invalidation" (the session was rejected/revoked —
// retrying can never succeed) from transient failures (network, 5xx, timeout)
// where the stored session is still valid and must NOT be dropped.
function isDefinitiveAuthError(status: number | undefined): boolean {
  return status === 401 || status === 403;
}

/** Remove any refresh token an older build of this app persisted in localStorage. */
function clearLegacyRefreshToken() {
  if (typeof window === 'undefined') return;
  // Earlier versions stored the refresh token here; it is now HttpOnly-only.
  // Leaving a stale copy behind would defeat the XSS protection.
  localStorage.removeItem('refreshToken');
}

/** Legacy refresh token from a pre-cookie build, if one is still around. */
function getLegacyRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function applyTokens(data: {
  accessToken?: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
}): string | null {
  if (typeof window === 'undefined') return null;
  const { accessToken, user: userData } = data;
  if (!accessToken) return null;

  localStorage.setItem('token', accessToken);
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }
  // The refresh token is never persisted on the client any more.
  clearLegacyRefreshToken();

  if (onTokenRefreshed) {
    onTokenRefreshed({ accessToken, user: userData });
  }
  return accessToken;
}

/**
 * Exchange the HttpOnly refresh cookie for a new access token.
 *
 * Returns the new access token, or null when the refresh could not be completed.
 * A null result is ambiguous on purpose — callers must decide whether the cause
 * was definitive (session revoked/expired) or transient before clearing auth.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // A refresh token from an older build must still be honoured once, so it is
  // replayed in the body. The backend prefers the cookie when both are present.
  const legacyToken = getLegacyRefreshToken();

  try {
    const res = await axios.post(
      REFRESH_URL,
      legacyToken ? { refreshToken: legacyToken } : {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
    );
    if (res.data?.success) {
      return applyTokens(res.data.data || {});
    }
  } catch {
    // Network / 5xx / timeout: the session may still be perfectly valid.
  }
  return null;
}

// ---------------------------------------------------------------------------
// Startup session restore
// ---------------------------------------------------------------------------

export interface SessionBootstrap {
  accessToken: string | null;
  user: Record<string, unknown> | null;
  /** True when there is no restorable session (cookie missing/expired/revoked). */
  expired: boolean;
}

let bootstrapPromise: Promise<SessionBootstrap> | null = null;

/**
 * Verify and restore the persisted session exactly once per page load.
 *
 * Order of preference:
 *  1. a still-valid access token in localStorage (fast path, no round trip)
 *  2. the HttpOnly refresh cookie (survives browser restart and clears of app
 *     storage, which is what makes the session truly persistent)
 *
 * Never triggers a logout on a transient failure — only a definitive server
 * rejection reports `expired`.
 */
export function bootstrapSession(): Promise<SessionBootstrap> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async (): Promise<SessionBootstrap> => {
    if (typeof window === 'undefined') {
      return { accessToken: null, user: null, expired: false };
    }

    const storedUser = ((): Record<string, unknown> | null => {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();

    const storedToken = localStorage.getItem('token');

    // Fast path — usable token already in memory.
    if (storedToken && storedToken !== 'undefined' && decodeJWT(storedToken) && !isTokenExpired(storedToken)) {
      clearLegacyRefreshToken();
      return { accessToken: storedToken, user: storedUser, expired: false };
    }

    // Slow path — let the cookie restore the session.
    const newToken = await refreshAccessToken();
    if (newToken) {
      const refreshedUser = ((): Record<string, unknown> | null => {
        const raw = localStorage.getItem('user');
        if (!raw) return storedUser;
        try {
          return JSON.parse(raw);
        } catch {
          return storedUser;
        }
      })();
      return { accessToken: newToken, user: refreshedUser, expired: false };
    }

    // Refresh produced nothing. Only a definitive rejection means the session is
    // gone; a network blip must leave the stored session in place.
    let expired = false;
    try {
      const probe = await axios.get('/api/auth/user', { withCredentials: true });
      if (!probe.data?.success) expired = true;
    } catch (probeErr) {
      const status = (probeErr as { response?: { status?: number } })?.response?.status;
      if (isDefinitiveAuthError(status)) expired = true;
    }

    if (expired) {
      clearStoredAuth();
      return { accessToken: null, user: null, expired: true };
    }

    // Transient failure — the interceptor probe above may have silently rotated
    // the token, so re-read it rather than restoring the stale value.
    const freshToken = localStorage.getItem('token') || storedToken;
    return {
      accessToken: freshToken && freshToken !== 'undefined' ? freshToken : null,
      user: storedUser,
      expired: false,
    };
  })();

  return bootstrapPromise;
}

/** Force the next bootstrap to run again (used after login/logout). */
export function resetSessionBootstrap(): void {
  bootstrapPromise = null;
}

// Determine the correct login URL based on the current page context
function getLoginRedirectUrl(): string {
  if (typeof window === 'undefined') return '/sign-in';
  const path = window.location.pathname;
  if (path.startsWith('/admin')) return '/admin/login';
  return '/sign-in';
}

/** Clear every locally held trace of the session (the cookie is cleared by the server). */
export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  clearStoredAuth();
  const path = window.location.pathname;
  const loginUrl = getLoginRedirectUrl();
  if (!path.startsWith('/sign-in') && !path.startsWith('/sign-up') && !path.startsWith('/admin/login')) {
    window.location.href = loginUrl;
  }
}

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // Send and accept the HttpOnly refresh cookie on every request.
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    // Skip proactive refresh for auth endpoints to avoid refresh loops and for the refresh request itself
    const isAuthEndpoint = config.url?.startsWith('/auth/');
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
      const isAuthApi = url.startsWith('/auth/');

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

    // Automatic token refresh on 401 (skip if already refreshing or if this IS
    // the refresh request).
    //
    // The refresh token lives in an HttpOnly cookie, so its presence cannot be
    // checked from JavaScript. We therefore attempt the refresh for any
    // non-public endpoint and only log out when the server definitively rejects
    // it. Public endpoints are excluded because they legitimately 401 without
    // implying that a session exists.
    if (status === 401 && !originalRequest._retry && !url.includes('/auth/refresh') && !url.includes('/auth/logout')) {
      const isPublicEndpoint = url.startsWith('/products') || url.startsWith('/categories') ||
        url.startsWith('/coupons') || url.startsWith('/campaigns') || url.startsWith('/public') ||
        url.startsWith('/reviews') || url.startsWith('/convert-price') || url.startsWith('/proxy') ||
        url.startsWith('/payment-resolve');
      if (isPublicEndpoint) {
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
        // The refresh token travels in the HttpOnly cookie; see REFRESH_URL.
        const res = await axios.post(
          REFRESH_URL,
          getLegacyRefreshToken() ? { refreshToken: getLegacyRefreshToken() } : {},
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
        );

        if (res.data?.success) {
          const accessToken = applyTokens(res.data.data || {});
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }

        // Refresh returned success:false → the session was rejected as
        // invalid/expired/revoked. This is definitive — clear and redirect.
        processQueue(error, null);
        clearAuthAndRedirect();
        return Promise.reject(error);
      } catch (refreshError) {
        // The refresh request itself errored (network / 5xx / timeout). The
        // session may still be valid — do NOT clear auth. Let the original error
        // through; the caller sees it and can retry.
        processQueue(refreshError, null);

        // …unless the refresh endpoint itself answered with a definitive status,
        // which means the session really is gone.
        const refreshStatus = (refreshError as { response?: { status?: number } })?.response?.status;
        if (isDefinitiveAuthError(refreshStatus)) {
          clearAuthAndRedirect();
        }
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
      const isAuthApi = url.startsWith('/auth/');
      const isPublic = url.startsWith('/products') || url.startsWith('/categories') ||
        url.startsWith('/orders') || url.startsWith('/cart') || url.startsWith('/campaigns') ||
        url.startsWith('/coupons') || url.startsWith('/public') || url.startsWith('/reviews') ||
        url.startsWith('/payment-resolve') || url.startsWith('/convert-price') ||
        url.startsWith('/proxy') || url.startsWith('/health');
      const hadSession = !!localStorage.getItem('token');
      if (!isAuthApi && !isPublic && hadSession) {
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

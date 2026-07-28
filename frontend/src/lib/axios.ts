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
  (error) => {
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

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/sign-in') && !window.location.pathname.startsWith('/sign-up')) {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

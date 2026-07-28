import { BrowserRouter } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ShopProvider } from './store/ShopContext';
import { AppSettingsProvider } from './store/AppSettingsContext';
import AppRoutes from './routes';
import ScrollToTop from './routes/ScrollToTop';
import MaintenancePage from './pages/public/MaintenancePage';
import maintenanceStore from './store/maintenanceStore';
import { subscribeMaintenance } from './lib/socket';
import api from './lib/axios';

// Helper: decode JWT payload (handles base64url → JSON)
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    // JWT uses base64url (no padding, - → +, _ → /)
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Helper: check if the current user has admin role from stored token
function isAdminUser(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  if (!token) return false;
  const payload = decodeJWT(token);
  return payload?.role === 'admin';
}

export default function App() {
  const [maintenance, setMaintenance] = useState(() => ({
    active: maintenanceStore.isUnderMaintenance,
    message: maintenanceStore.maintenanceMessage,
  }));
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // On mount: sync with actual backend state (so store doesn't get stuck)
    api
      .get('/public/maintenance')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.enabled && data?.type === 'fullscreen') {
          if (!isAdminUser()) {
            maintenanceStore.setMaintenance(data.message || '');
          } else {
            maintenanceStore.clearMaintenance();
          }
        } else {
          maintenanceStore.clearMaintenance();
        }
      })
      .catch(() => {
        // Backend unreachable — keep current store state
      })
      .finally(() => setInitialCheckDone(true));

    // Listen to store changes (from axios 503 interceptor)
    const unsub = maintenanceStore.subscribe(() => {
      setMaintenance({
        active: maintenanceStore.isUnderMaintenance,
        message: maintenanceStore.maintenanceMessage,
      });
    });

    // Listen to real-time WebSocket updates
    const unsubSocket = subscribeMaintenance((data) => {
      // Don't block admin users during fullscreen maintenance
      if (data.enabled && data.type === 'fullscreen') {
        if (!isAdminUser()) {
          maintenanceStore.setMaintenance(data.message);
        }
      } else if (!data.enabled) {
        maintenanceStore.clearMaintenance();
      }
    });

    return () => {
      unsub();
      unsubSocket();
    };
  }, []);

  // Always allow login routes and admin users during maintenance
  const isAuthRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin/login') ||
      window.location.pathname.startsWith('/sign-in') ||
      window.location.pathname.startsWith('/sign-up'));

  const isAdmin = isAdminUser();
  const showFullApp = !maintenance.active || isAuthRoute || isAdmin;

  const googleClientId = typeof window !== 'undefined'
    ? import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    : '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {showFullApp ? (
          <AuthProvider>
            <AppSettingsProvider>
              <ShopProvider>
                <ScrollToTop />
                <AppRoutes />
              </ShopProvider>
            </AppSettingsProvider>
          </AuthProvider>
        ) : (
          <MaintenancePage message={maintenance.message} />
        )}
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

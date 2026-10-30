import { BrowserRouter } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider } from './store/ShopContext';
import { AppSettingsProvider } from './store/AppSettingsContext';
import AppRoutes from './routes';
import ScrollToTop from './routes/ScrollToTop';
import MaintenancePage from './pages/public/MaintenancePage';
import maintenanceStore from './store/maintenanceStore';
import { subscribeMaintenance } from './lib/socket';
import api from './lib/axios';

function AppContent() {
  const [maintenance, setMaintenance] = useState(() => ({
    active: maintenanceStore.isUnderMaintenance,
    message: maintenanceStore.maintenanceMessage,
  }));
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    // On mount: sync with actual backend state (so store doesn't get stuck)
    api
      .get('/public/maintenance')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.enabled && data?.type === 'fullscreen') {
          if (!isAdmin) {
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
        if (!isAdmin) {
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
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always allow login routes and admin users during maintenance
  const isAuthRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/admin/login') ||
      window.location.pathname.startsWith('/sign-in') ||
      window.location.pathname.startsWith('/sign-up'));

  // Wait for auth to finish loading before deciding about maintenance
  const showFullApp = authLoading || !maintenance.active || isAuthRoute || isAdmin;

  // While auth is loading and we have no maintenance state yet, render nothing (avoid flash)
  if (authLoading && !initialCheckDone && maintenance.active) {
    return null;
  }

  return (
    <>
      {showFullApp ? (
        <AppSettingsProvider>
          <ShopProvider>
            <ScrollToTop />
            <AppRoutes />
          </ShopProvider>
        </AppSettingsProvider>
      ) : (
        <MaintenancePage message={maintenance.message} />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

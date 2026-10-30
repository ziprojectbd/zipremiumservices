import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from '../admin/AdminHeader';
import Sidebar from '../admin/Sidebar';
import { useAuth } from '../../context/AuthContext';

function getActiveTab(pathname: string): string {
  // Normalize: remove leading/trailing slashes, split
  const parts = pathname.replace(/^\/|\/$/g, '').split('/');

  // /admin/dashboard → dashboard
  // /admin/orders → orders
  // /admin/orders/trade → trade
  // /admin/products → products
  // /admin/products/smm → smm
  // /admin/products/edit/xxx → products (parent)
  // /admin/user/users → users
  // /admin/user/trader-kyc → trader-kyc
  // /admin/special-offer/campaigns → campaigns
  // /admin/settings → settings
  // /admin/settings/footer-management → footer-management

  if (parts.length >= 2 && parts[0] === 'admin') {
    if (parts.length === 2) {
      return parts[1];
    }
    // Sub-routes: figure out the "active tab" id
    // Special cases for nested structures
    const sub = parts[2];
    if (parts[1] === 'orders') {
      if (sub === 'details') return 'orders'; // /admin/orders/details/:id → highlight Orders
      return sub; // trade
    }
    if (parts[1] === 'products') return sub; // smm, captchamaster
    if (parts[1] === 'user') return sub; // users, user-submissions, customers, broker-chats, trader-kyc
    if (parts[1] === 'special-offer') return sub; // campaigns, special-promo, popup-management, coupons
    if (parts[1] === 'settings') return sub; // footer-management, payment-management, etc.
    return parts[1];
  }

  return 'dashboard';
}

export default function AdminShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const activeTab = getActiveTab(location.pathname);

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile backdrop overlay — closes sidebar on tap outside */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        handleLogout={handleLogout}
      />

      <div className="lg:pl-72">
        <AdminHeader
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          onLogout={handleLogout}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

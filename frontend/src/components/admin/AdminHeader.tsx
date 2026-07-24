import { Menu, Bell, LogOut, User, LayoutDashboard, ShoppingCart, Package, Users, Settings, Gift, MessageSquare, Star, Home, ShieldCheck, Tag, Globe, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_META: Record<string, { title: string; Icon: React.FC<{ className?: string }> }> = {
  dashboard: { title: 'Dashboard', Icon: LayoutDashboard },
  orders: { title: 'Orders', Icon: ShoppingCart },
  products: { title: 'Products', Icon: Package },
  airdrops: { title: 'Airdrops', Icon: Gift },
  campaigns: { title: 'Campaigns', Icon: Megaphone },
  popup: { title: 'Popup Management', Icon: MessageSquare },
  'special-promo': { title: 'Special Promo', Icon: Tag },
  customers: { title: 'Customers', Icon: Users },
  users: { title: 'Users', Icon: Users },
  'user-submissions': { title: 'User Submissions', Icon: Package },
  reviews: { title: 'Reviews', Icon: Star },
  settings: { title: 'Settings', Icon: Settings },
  'trader-kyc': { title: 'KYC Maintenance', Icon: ShieldCheck },
  coupons: { title: 'Coupon Management', Icon: Tag },
  smm: { title: 'SMM Services', Icon: Globe },
};

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  onLogout?: () => void;
}

export default function AdminHeader({ setSidebarOpen, activeTab, onLogout }: HeaderProps) {
  const { title, Icon } = PAGE_META[activeTab] ?? PAGE_META.dashboard;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-blue-900/80 backdrop-blur-xl border-b border-white/10">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>

      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-2.5 hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-blue-500/30"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
        </div>

        {/* Right Section - Notifications & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10 group">
            <Bell className="w-5 h-5 group-hover:animate-bounce" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">3</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                {user?.image && !avatarError ? (
                  <img
                    src={user.image.includes('googleusercontent.com') ? `/api/proxy/image?url=${encodeURIComponent(user.image)}` : user.image}
                    alt={user?.name || 'Admin User'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.name || user?.username || 'Admin User'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email || 'admin@zipremium.com'}
                </p>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <p className="text-sm font-medium text-white">
                    {user?.name || user?.username || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.email || 'admin@zipremium.com'}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg transition-all"
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Website</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
}

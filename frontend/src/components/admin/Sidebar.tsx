import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, X, Sparkles, Gift, MessageSquare, ArrowLeftRight, Tag, Inbox, Footprints, ShieldCheck, Bot, Globe, Megaphone, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  handleLogout: () => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, activeTab, handleLogout }: SidebarProps) {

  const topNavigation = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard', href: '/admin/dashboard', badge: null },
  ];

  const bottomNavigation = [
    { name: 'Airdrops', icon: Gift, id: 'airdrops', href: '/admin/airdrops', badge: 'New' },
    { name: 'Settings', icon: Settings, id: 'settings', href: '/admin/settings', badge: null },
  ];

  const ordersSubItems = [
    { name: 'Orders', icon: ShoppingCart, id: 'orders', href: '/admin/orders' },
    { name: 'Trade', icon: ArrowLeftRight, id: 'trade', href: '/admin/orders/trade' },
  ];

  const isOrdersActive = activeTab === 'orders' || activeTab === 'trade';

  const [ordersExpanded, setOrdersExpanded] = useState(isOrdersActive);

  useEffect(() => {
    if (isOrdersActive) {
      setOrdersExpanded(true);
    }
  }, [isOrdersActive]);

  const userSubItems = [
    { name: 'Users', icon: Users, id: 'users', href: '/admin/user/users' },
    { name: 'User Submissions', icon: Inbox, id: 'user-submissions', href: '/admin/user/user-submissions' },
    { name: 'Customers', icon: Users, id: 'customers', href: '/admin/user/customers' },
    { name: 'Broker Chats', icon: MessageSquare, id: 'broker-chats', href: '/admin/user/broker-chats' },
    { name: 'KYC Maintenance', icon: ShieldCheck, id: 'trader-kyc', href: '/admin/user/trader-kyc' },
  ];

  const isUserParentActive = activeTab === 'users' || activeTab === 'user-submissions' || activeTab === 'customers' || activeTab === 'broker-chats' || activeTab === 'trader-kyc';

  const [usersExpanded, setUsersExpanded] = useState(isUserParentActive);

  useEffect(() => {
    if (isUserParentActive) {
      setUsersExpanded(true);
    }
  }, [isUserParentActive]);

  const specialOfferSubItems = [
    { name: 'Campaigns', icon: Megaphone, id: 'campaigns', href: '/admin/special-offer/campaigns' },
    { name: 'Special Promo', icon: Tag, id: 'special-promo', href: '/admin/special-offer/special-promo' },
    { name: 'Popup Management', icon: MessageSquare, id: 'popup', href: '/admin/special-offer/popup-management' },
    { name: 'Coupons', icon: Tag, id: 'coupons', href: '/admin/special-offer/coupons' },
  ];

  const isSpecialOfferActive = activeTab === 'campaigns' || activeTab === 'special-promo' || activeTab === 'popup' || activeTab === 'coupons';

  const [specialOfferExpanded, setSpecialOfferExpanded] = useState(isSpecialOfferActive);

  useEffect(() => {
    if (isSpecialOfferActive) {
      setSpecialOfferExpanded(true);
    }
  }, [isSpecialOfferActive]);

  const productsSubItems = [
    { name: 'Regular Products', icon: Package, id: 'products', href: '/admin/products' },
    { name: 'SMM Services', icon: Globe, id: 'smm', href: '/admin/products/smm' },
    { name: 'CaptchaMaster', icon: Bot, id: 'captchamaster', href: '/admin/products/captchamaster' },
  ];

  const isProductsActive = activeTab === 'products' || activeTab === 'smm' || activeTab === 'captchamaster';

  const [productsExpanded, setProductsExpanded] = useState(isProductsActive);

  useEffect(() => {
    if (isProductsActive) {
      setProductsExpanded(true);
    }
  }, [isProductsActive]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-blue-900/50 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl blur-lg opacity-40 animate-pulse"></div>
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-500/30">
                <img
                  src="/zi-logo.svg"
                  alt="ZI Premium Services Logo"
                  className="object-contain p-1 w-full h-full"
                />
              </div>

            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent whitespace-nowrap tracking-wide drop-shadow-sm">
                ZI PREMIUM SERVICES
              </h1>
              <p className="text-xs text-blue-300/70 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3" /> Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-3">Main Menu</p>
          {topNavigation.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === item.id
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-500/20 text-blue-400'
                  }`}>
                  {item.badge}
                </span>
              )}
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </Link>
          ))}

          {/* Orders Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => setOrdersExpanded(!ordersExpanded)}
              className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${isOrdersActive
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isOrdersActive ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="font-medium">Orders</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${ordersExpanded ? 'rotate-0' : '-rotate-90'}`} />
              {isOrdersActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </button>

            {ordersExpanded && (
              <div className="ml-6 space-y-1 border-l border-white/10 pl-2">
                {ordersSubItems.map((sub) => (
                  <Link
                    key={sub.id}
                    to={sub.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === sub.id
                      ? 'bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-300'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg ${activeTab === sub.id ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                      <sub.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    {activeTab === sub.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Products Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => setProductsExpanded(!productsExpanded)}
              className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${isProductsActive
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isProductsActive ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                  <Package className="w-5 h-5" />
                </div>
                <span className="font-medium">Products</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${productsExpanded ? 'rotate-0' : '-rotate-90'}`} />
              {isProductsActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </button>

            {productsExpanded && (
              <div className="ml-6 space-y-1 border-l border-white/10 pl-2">
                {productsSubItems.map((sub) => (
                  <Link
                    key={sub.id}
                    to={sub.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === sub.id
                      ? 'bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-300'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg ${activeTab === sub.id ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                      <sub.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    {activeTab === sub.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* User Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => setUsersExpanded(!usersExpanded)}
              className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${isUserParentActive
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isUserParentActive ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium">User</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${usersExpanded ? 'rotate-0' : '-rotate-90'}`} />
              {isUserParentActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </button>

            {usersExpanded && (
              <div className="ml-6 space-y-1 border-l border-white/10 pl-2">
                {userSubItems.map((sub) => (
                  <Link
                    key={sub.id}
                    to={sub.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === sub.id
                      ? 'bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-300'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg ${activeTab === sub.id ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                      <sub.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    {activeTab === sub.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Special Offer Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => setSpecialOfferExpanded(!specialOfferExpanded)}
              className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${isSpecialOfferActive
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isSpecialOfferActive ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                  <Tag className="w-5 h-5" />
                </div>
                <span className="font-medium">Special Offer</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${specialOfferExpanded ? 'rotate-0' : '-rotate-90'}`} />
              {isSpecialOfferActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </button>

            {specialOfferExpanded && (
              <div className="ml-6 space-y-1 border-l border-white/10 pl-2">
                {specialOfferSubItems.map((sub) => (
                  <Link
                    key={sub.id}
                    to={sub.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${activeTab === sub.id
                      ? 'bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white shadow-lg shadow-purple-500/20'
                      : 'text-gray-300'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg ${activeTab === sub.id ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                      <sub.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{sub.name}</span>
                    {activeTab === sub.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {bottomNavigation.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${activeTab === item.id
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-white/20' : 'bg-white/5'} transition-all`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-500/20 text-blue-400'
                  }`}>
                  {item.badge}
                </span>
              )}
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

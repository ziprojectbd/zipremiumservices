import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Notebook, History, LogOut, Sparkles, ChevronRight, Package, Shield, Plus, List, Store, DollarSign, MessageCircle, Home } from 'lucide-react';
import SiteNavigation from './SiteNavigation';
import { useShopContext } from '../../store/ShopContext';
import { useAuth } from '../../context/AuthContext';

function useMobileTouchHandler(callback: () => void) {
  const lastTapRef = useRef(0);

  return {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      callback();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        return;
      }
      lastTapRef.current = now;

      callback();
    },
  };
}

export default function Header() {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();
  const {
    setIsCartOpen,
    getTotalItems,
    menuOpen,
    setMenuOpen,
    theme,
    toggleTheme,
    username,
    userEmail,
    userImage,
    userRole,
    isTraderMenu,
    isKycVerified,
    setView,
    handleSignOut: shopHandleSignOut,
    isLoggedIn,
  } = useShopContext();

  const onSignInClick = () => navigate('/sign-in');
  const onSignUpClick = () => navigate('/sign-up');
  const onAlert = useShopContext().showAlert;

  const menuRef = useRef<HTMLDivElement>(null);
  const [isGuestMenuOpen, setGuestMenuOpen] = useState(false);

  // Close menu on outside click/touch
  useEffect(() => {
    if (!menuOpen && !isGuestMenuOpen) return;

    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setGuestMenuOpen(false);
      }
    };

    // Delay adding listener so the same tap that opened doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [menuOpen, isGuestMenuOpen, setMenuOpen]);

  const profileButtonHandlers = useMobileTouchHandler(() => setMenuOpen(!menuOpen));
  const guestMenuButtonHandlers = useMobileTouchHandler(() => setGuestMenuOpen(!isGuestMenuOpen));

  const getMenuItemHandlers = useCallback((callback: () => void) => ({
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      callback();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      callback();
    },
  }), []);

  const handleSignOut = useCallback(() => {
    setMenuOpen(false);
    shopHandleSignOut();
    authLogout();
    if (onAlert) onAlert('success', 'Logged Out', 'You have been signed out successfully.');
  }, [setMenuOpen, shopHandleSignOut, authLogout, onAlert]);

  const [avatarError, setAvatarError] = useState(false);
  const [dropdownAvatarError, setDropdownAvatarError] = useState(false);

  const displayName = authUser?.name || authUser?.username || username;
  const displayEmail = authUser?.email || userEmail;
  const rawImage = authUser?.image || userImage;
  const displayImage = rawImage && rawImage.includes('googleusercontent.com')
    ? `/api/proxy/image?url=${encodeURIComponent(rawImage)}`
    : rawImage;
  const displayRole = authUser?.role || userRole;
  const isAuth = !!authUser || isLoggedIn;

  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-purple-500/20 relative">
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-14 sm:min-h-16 py-2">

          {/* Brand */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 min-w-0 cursor-default flex-shrink-0"
            >
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-350 to-purple-600 rounded-lg shadow-lg flex-shrink-0">
                <img src="/zi-logo.svg" alt="ZI PREMIUM SERVICES Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain select-none pointer-events-none" draggable={false} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h1 className="sm:text-2xl md:text-3xl font-extrabold leading-tight whitespace-nowrap" style={{ fontSize: 'clamp(0.8rem, 4.5vw, 1.5rem)' }}>
                  <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent drop-shadow-sm transition-all cinzel-decorative-black">
                    ZI PREMIUM SERVICES
                  </span>
                </h1>
                <p className="text-xs text-gray-300">Your Digital Gateway</p>
              </div>
            </div>

          {/* Site Navigation (Desktop, in-row) */}
          <div className="hidden md:flex flex-1 items-center justify-center mx-2 lg:mx-4 overflow-hidden">
            <SiteNavigation />
          </div>

          {/* Right controls */}
          <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAuth ? (
              <>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md text-[10px]">
                      {getTotalItems()}
                    </span>
                  )}
                </button>

                {/* Home Button (mobile only) */}
                <button
                  onClick={() => navigate('/')}
                  className="sm:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border border-purple-500/30 hover:bg-white/10 text-white transition-all"
                >
                  <Home className="w-5 h-5" />
                </button>

                  {/* Profile Picture / Menu Button */}
                  <button
                    onClick={profileButtonHandlers.onClick}
                    onTouchEnd={profileButtonHandlers.onTouchEnd}
                    style={{ touchAction: 'manipulation' }}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className={`relative flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-300 overflow-hidden
                      ${menuOpen
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/40 scale-95'
                        : 'bg-white/5 border border-purple-500/30 hover:bg-white/10 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20'
                      }`}
                  >
                    {displayImage && displayImage.length > 0 && !avatarError ? (
                      <img
                        src={displayImage}
                        alt={displayName}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                        crossOrigin="anonymous"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span className="relative w-5 h-5 flex flex-col items-center justify-center gap-[5px]">
                        <span className={`block h-[2px] rounded-full bg-white transition-all duration-300 origin-center ${menuOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'}`} />
                        <span className={`block h-[2px] rounded-full bg-white transition-all duration-300 ${menuOpen ? 'w-0 opacity-0' : 'w-3.5 self-start'}`} />
                        <span className={`block h-[2px] rounded-full bg-white transition-all duration-300 origin-center ${menuOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-5'}`} />
                      </span>
                    )}
                  </button>
              </>
            ) : (
              <>
                  <>
                    <button onClick={onSignInClick} className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium border border-purple-500/30 rounded-lg hover:bg-white/10 text-gray-200 transition-all">
                      Sign In
                    </button>
                    <button onClick={onSignUpClick} className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md">
                      Sign Up
                    </button>
                  </>
                <button
                  onClick={guestMenuButtonHandlers.onClick}
                  onTouchEnd={guestMenuButtonHandlers.onTouchEnd}
                  style={{ touchAction: 'manipulation' }}
                  className="sm:hidden p-1.5 rounded-lg border border-purple-500/30 hover:bg-white/10 text-gray-200 flex-shrink-0"
                >
                  <span className="relative w-5 h-5 flex flex-col items-center justify-center gap-[5px]">
                    <span className={`block h-[2px] rounded-full bg-white transition-all duration-300 origin-center ${isGuestMenuOpen ? 'w-5 rotate-45 translate-y-[7px]' : 'w-5'}`} />
                    <span className={`block h-[2px] rounded-full bg-white transition-all duration-300 ${isGuestMenuOpen ? 'w-0 opacity-0' : 'w-3.5 self-start'}`} />
                    <span className={`block h-[2px] rounded-full bg-white transition-all duration-300 origin-center ${isGuestMenuOpen ? 'w-5 -rotate-45 -translate-y-[7px]' : 'w-5'}`} />
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Guest Dropdown */}
      {isGuestMenuOpen && !isAuth && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 w-64 rounded-bl-2xl overflow-hidden z-[9999] shadow-2xl shadow-purple-900/50 border-l border-b border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(15,10,40,0.97) 0%, rgba(30,15,60,0.97) 100%)', backdropFilter: 'blur(20px)' }}
        >
          <div className="p-3 space-y-2">
            <button onClick={() => { onSignInClick(); setGuestMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium border border-purple-500/30 rounded-xl hover:bg-purple-500/20 text-gray-200 transition-all">Sign In</button>
            <button onClick={() => { onSignUpClick(); setGuestMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-md">Sign Up</button>
          </div>
        </div>
      )}

      {/* Premium Dropdown (card-style, fixed) */}
      {menuOpen && isAuth && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 rounded-bl-2xl z-[9999] shadow-2xl shadow-purple-900/70 border-l border-b border-white/8"
          style={{
            width: 'min(340px, calc(100vw - 2rem))',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'linear-gradient(160deg, rgba(10,6,30,0.98) 0%, rgba(20,10,48,0.98) 60%, rgba(28,8,42,0.98) 100%)',
            backdropFilter: 'blur(28px)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(168,85,247,0.3) transparent',
          }}
        >
          {/* Top accent */}
          <div className="h-[3px] w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400" />

          <div className="p-3 space-y-2">

            {/* Profile Card */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(88,28,135,0.5) 0%, rgba(157,23,77,0.3) 50%, rgba(236,72,153,0.2) 100%)',
                border: '1px solid rgba(168,85,247,0.3)',
                boxShadow: '0 0 40px rgba(168,85,247,0.2), inset 0 0 60px rgba(168,85,247,0.05)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-transparent to-pink-600/20 pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex items-center gap-4 px-4 py-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl border-2 border-purple-400/50 overflow-hidden">
                    {displayImage && displayImage.length > 0 && !dropdownAvatarError ? (
                      <img
                        src={displayImage}
                        alt={displayName}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                        crossOrigin="anonymous"
                        onError={() => setDropdownAvatarError(true)}
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#0a061e] shadow-lg shadow-green-400/50" />
                </div>
                {/* Info */}
                <div className="flex-1">
                  <div className="text-base font-bold text-white flex items-center gap-1.5 mb-0.5" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
                    <span>{displayName}</span>
                  </div>
                  <div className="text-xs text-purple-300/80 truncate mb-2" style={{ textShadow: '0 0 5px rgba(168,85,247,0.3)' }}>{displayEmail}</div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-full" style={{ boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    {isKycVerified ? 'KYC Verified' : 'Member'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trader Menu */}
            {isTraderMenu ? (
              <>
                {/* My Listings */}
                <button
                  onClick={() => {
                    if (!isKycVerified) {
                      setMenuOpen(false);
                      onAlert?.('warning', 'KYC Required', 'Please complete your KYC verification to access this feature.', () => navigate('/marketplace/trader-kyc'));
                      return;
                    }
                    setMenuOpen(false);
                    navigate("/marketplace/my-listings");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (!isKycVerified) {
                      setMenuOpen(false);
                      onAlert?.('warning', 'KYC Required', 'Please complete your KYC verification to access this feature.', () => navigate('/marketplace/trader-kyc'));
                      return;
                    }
                    setMenuOpen(false);
                    navigate("/marketplace/my-listings");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group/item relative overflow-hidden ${
                    isKycVerified
                      ? 'text-purple-300 hover:text-purple-200 cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover/item:from-purple-600/15 group-hover/item:to-pink-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/15 group-hover/item:bg-purple-500/30 transition-colors border border-purple-500/20 group-hover/item:border-purple-400/50 flex-shrink-0">
                    <List className="w-5 h-5 text-purple-400 group-hover/item:text-purple-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">My Listings</span>
                    <span className="block text-xs text-purple-400/60 group-hover/item:text-purple-300/80 whitespace-nowrap">View your digital assets</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-purple-600 group-hover/item:text-purple-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                {/* My Bids */}
                <button
                  onClick={() => {
                    if (!isKycVerified) {
                      setMenuOpen(false);
                      onAlert?.('warning', 'KYC Required', 'Please complete your KYC verification to access this feature.', () => navigate('/marketplace/trader-kyc'));
                      return;
                    }
                    setMenuOpen(false);
                    navigate("/marketplace/my-bids");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (!isKycVerified) {
                      setMenuOpen(false);
                      onAlert?.('warning', 'KYC Required', 'Please complete your KYC verification to access this feature.', () => navigate('/marketplace/trader-kyc'));
                      return;
                    }
                    setMenuOpen(false);
                    navigate("/marketplace/my-bids");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group/item relative overflow-hidden ${
                    isKycVerified
                      ? 'text-amber-300 hover:text-amber-200 cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-600/0 to-orange-600/0 group-hover/item:from-amber-600/15 group-hover/item:to-orange-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 group-hover/item:bg-amber-500/30 transition-colors border border-amber-500/20 group-hover/item:border-amber-400/50 flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-amber-400 group-hover/item:text-amber-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">My Bids</span>
                    <span className="block text-xs text-amber-400/60 group-hover/item:text-amber-300/80 whitespace-nowrap">Manage received bids</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-amber-600 group-hover/item:text-amber-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                {/* My Chats */}
                <button
                  onClick={() => {
                    if (!isKycVerified) {
                      setMenuOpen(false);
                      onAlert?.('warning', 'KYC Required', 'Please complete your KYC verification to access this feature.', () => navigate('/marketplace/trader-kyc'));
                      return;
                    }
                    setMenuOpen(false);
                    navigate("/marketplace/my-chats");
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (!isKycVerified) {
                      setMenuOpen(false);
                      onAlert?.('warning', 'KYC Required', 'Please complete your KYC verification to access this feature.', () => navigate('/marketplace/trader-kyc'));
                      return;
                    }
                    setMenuOpen(false);
                    navigate("/marketplace/my-chats");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group/item relative overflow-hidden ${
                    isKycVerified
                      ? 'text-cyan-300 hover:text-cyan-200 cursor-pointer'
                      : 'text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/0 to-blue-600/0 group-hover/item:from-cyan-600/15 group-hover/item:to-blue-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/15 group-hover/item:bg-cyan-500/30 transition-colors border border-cyan-500/20 group-hover/item:border-cyan-400/50 flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-cyan-400 group-hover/item:text-cyan-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">My Chats</span>
                    <span className="block text-xs text-cyan-400/60 group-hover/item:text-cyan-300/80 whitespace-nowrap">View your conversations</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-cyan-600 group-hover/item:text-cyan-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate("/marketplace"); }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    navigate("/marketplace");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-blue-300 hover:text-blue-200 transition-all duration-200 group/item relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 to-cyan-600/0 group-hover/item:from-blue-600/15 group-hover/item:to-cyan-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15 group-hover/item:bg-blue-500/30 transition-colors border border-blue-500/20 group-hover/item:border-blue-400/50 flex-shrink-0">
                    <Store className="w-5 h-5 text-blue-400 group-hover/item:text-blue-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">Marketplace</span>
                    <span className="block text-xs text-blue-400/60 group-hover/item:text-blue-300/80 whitespace-nowrap">Browse digital assets</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-blue-600 group-hover/item:text-blue-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              </>
            ) : (
              <>
                {/* My Orders */}
                <button
                  onClick={() => { setMenuOpen(false); setView('order-history'); navigate("/my-orders"); }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setView('order-history');
                    navigate("/my-orders");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-purple-300 hover:text-purple-200 transition-all duration-200 group/item relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 group-hover/item:from-purple-600/15 group-hover/item:to-pink-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/15 group-hover/item:bg-purple-500/30 transition-colors border border-purple-500/20 group-hover/item:border-purple-400/50 flex-shrink-0">
                    <Notebook className="w-5 h-5 text-purple-400 group-hover/item:text-purple-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">My Orders</span>
                    <span className="block text-xs text-purple-400/60 group-hover/item:text-purple-300/80 whitespace-nowrap">View your active orders</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-purple-600 group-hover/item:text-purple-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                {/* Order History */}
                <button
                  onClick={() => { setMenuOpen(false); setView('order-history'); navigate("/order-history"); }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    setView('order-history');
                    navigate("/order-history");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-blue-300 hover:text-blue-200 transition-all duration-200 group/item relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 to-cyan-600/0 group-hover/item:from-blue-600/15 group-hover/item:to-cyan-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15 group-hover/item:bg-blue-500/30 transition-colors border border-blue-500/20 group-hover/item:border-blue-400/50 flex-shrink-0">
                    <History className="w-5 h-5 text-blue-400 group-hover/item:text-blue-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">Order History</span>
                    <span className="block text-xs text-blue-400/60 group-hover/item:text-blue-300/80 whitespace-nowrap">Browse past purchases</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-blue-600 group-hover/item:text-blue-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                {/* Sell Your Product */}
                <button
                  onClick={() => { setMenuOpen(false); navigate("/sell-product"); }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    navigate("/sell-product");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-emerald-300 hover:text-emerald-200 transition-all duration-200 group/item relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/0 to-green-600/0 group-hover/item:from-emerald-600/15 group-hover/item:to-green-600/10 transition-all duration-300" />
                  <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 group-hover/item:bg-emerald-500/30 transition-colors border border-emerald-500/20 group-hover/item:border-emerald-400/50 flex-shrink-0">
                    <Package className="w-5 h-5 text-emerald-400 group-hover/item:text-emerald-300" />
                  </span>
                  <span className="relative flex-1 text-left">
                    <span className="block text-sm font-semibold whitespace-nowrap">Sell Your Product</span>
                    <span className="block text-xs text-emerald-400/60 group-hover/item:text-emerald-300/80 whitespace-nowrap">Submit to admin for purchase</span>
                  </span>
                  <ChevronRight className="relative w-4 h-4 text-emerald-600 group-hover/item:text-emerald-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                {/* Admin Dashboard (only for admin users) */}
                {displayRole === 'admin' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate("/admin/dashboard"); }}
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); navigate("/admin/dashboard"); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-amber-300 hover:text-amber-200 transition-all duration-200 group/item relative overflow-hidden"
                    style={{ touchAction: 'manipulation', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-600/0 to-orange-600/0 group-hover/item:from-amber-600/15 group-hover/item:to-orange-600/10 transition-all duration-300" />
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 group-hover/item:bg-amber-500/30 transition-colors border border-amber-500/20 group-hover/item:border-amber-400/50 flex-shrink-0">
                      <Shield className="w-5 h-5 text-amber-400 group-hover/item:text-amber-300" />
                    </span>
                    <span className="relative flex-1 text-left">
                      <span className="block text-sm font-semibold whitespace-nowrap">Admin Dashboard</span>
                      <span className="block text-xs text-amber-400/60 group-hover/item:text-amber-300/80 whitespace-nowrap">Manage products & orders</span>
                    </span>
                    <ChevronRight className="relative w-4 h-4 text-amber-600 group-hover/item:text-amber-400 group-hover/item:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                )}
              </>
            )}

            <>
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-red-500/25 to-transparent mx-1" />

              {/* Sign Out */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-white hover:text-gray-200 transition-all duration-200 group/item relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="absolute inset-0 rounded-xl bg-red-500/0 group-hover/item:bg-red-500/10 transition-all duration-300" />
                <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 group-hover/item:bg-red-500/20 transition-colors border border-red-500/20 group-hover/item:border-red-400/50 flex-shrink-0">
                  <LogOut className="w-5 h-5 text-red-400 group-hover/item:text-red-300" />
                </span>
                <span className="relative flex-1 text-left">
                  <span className="block text-sm font-semibold whitespace-nowrap">Sign Out</span>
                  <span className="block text-xs text-gray-400/60 group-hover/item:text-gray-300/80 whitespace-nowrap">End your session</span>
                </span>
              </button>
            </>

          </div>

          {/* Bottom accent */}
          <div className="h-[3px] w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600" />
        </div>
      )}

      {/* Header Bottom Accent "Edge" */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 opacity-80 shadow-[0_1px_10px_rgba(168,85,247,0.5)] z-[10000]" />
    </header>
  );
}

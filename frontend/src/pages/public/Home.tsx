import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../../lib/axios";
import { formatPrice } from "../../utils/formatPrice";
import {
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Shield,
  Zap,
  Globe,
  Play,
  Palette,
  Lock,
  Mail,
  Phone,
  MapPin,
  Wallet,
  Copy,
  CheckCircle2,
  MoreHorizontal,
  Sun,
  Moon,
  User,
  LogOut,
  History,
  Notebook,
  Home as HomeIcon,
  MessageCircle,
  Send,
  QrCode,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  Headset,
  Gift,
  ArrowLeftRight,
  Repeat,
  Coins,
  BookOpen,
  Bot,
  Clock,
  Package,
  Users,
  Settings,
} from "lucide-react";

import ProductCard from "../../components/public/ProductCard";
import LoadingScreen from "../../components/public/LoadingScreen";
import { shouldShowPopup } from "../../lib/popupConfig";
import MaintenanceBar from "../../components/public/MaintenanceBar";
import FullScreenMaintenance from "../../components/public/FullScreenMaintenance";
import SurprisePopup from "../../components/public/SurprisePopup";
import CategoryFilterBar from "../../components/public/CategoryFilterBar";
import CaptchaSolvesApiCards from "../../components/public/CaptchaSolvesApiCards";
import HeroSection from "../../components/public/HeroSection";
import LiveOrderTicker from "../../components/public/LiveOrderTicker";
import MarketplaceHeroBanner from "../../components/public/MarketplaceHeroBanner";
import { useAppSettings } from "../../store/AppSettingsContext";
import { useShopContext } from "../../store/ShopContext";

import { devLog } from "../../utils/devLogger";
import { tokenOptions, networkOptions } from "../../constants/navigation";
import type { Product, ShopProduct } from "../../types";

const toCategorySlug = (value?: string) =>
  (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { settings: appSettings } = useAppSettings();

  // Side slider settings from central AppSettingsContext (fetched every 60s)
  const sideSliderSettings = appSettings.sideSlider as any;

  // Recent orders — fetched live from API every 30 seconds
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await api.get('/public/recent-orders?limit=10');
      const result = response.data;
      if (result.success) {
        setRecentOrders(result.data);
      }
    } catch (error) {
      devLog('Error fetching recent orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecentOrders();
    const interval = setInterval(fetchRecentOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchRecentOrders]);

  // Live orders for display: live API data first, fallback to static side slider data
  const liveOrders = (recentOrders.length > 0 ? recentOrders : (sideSliderSettings?.liveActivity?.orders || [])).slice(0, 10);

  // Maintenance from App.tsx (WebSocket-driven, no polling needed here)
  const maintenanceSettings = {
    enabled: false,
    type: 'marquee' as const,
    message: ''
  };

  const {
    cart, setCart, addToCart, removeFromCart, getTotalPrice, getTotalItems,
    isCartOpen, setIsCartOpen,
    view, setView,
    paymentMethod, setPaymentMethod,
    cryptoCurrency, setCryptoCurrency,
    paymentType, setPaymentType,
    selectedNetwork, setSelectedNetwork,
    selectedPlatform, setSelectedPlatform,
    payerNumber, setPayerNumber,
    trxId, setTrxId,
    txHash, setTxHash,
    lastAddedProductId,
    orders, setOrders,
    copiedAddress, setCopiedAddress,
    selectedOrder, setSelectedOrder,
    isLoading, setIsLoading,
    menuOpen, setMenuOpen,
    theme, toggleTheme,
    username,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    userEmail,
    userImage,
    setUsername,
    setUserEmail,
    setUserImage,
    alertConfig,
    setAlertConfig,
    showAlert,
    showSurprisePopup,
    setShowSurprisePopup,
    userRole,
    setUserRole,
  } = useShopContext();

  // admin_access_denied check + set view
  useEffect(() => {
    setView("home");

    const error = searchParams.get('error');
    if (error === 'admin_access_denied') {
      showAlert(
        'error',
        'Access Denied',
        'You do not have permission to access the admin panel. Admin access is restricted to authorized personnel only. If you believe this is an error, please contact the system administrator.',
        () => {
          navigate('/', { replace: true });
        }
      );
    }
  }, [setView, searchParams, showAlert, navigate]);

  // Icon mapping function
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      gift: Gift,
      'arrow-left-right': ArrowLeftRight,
      repeat: Repeat,
      coins: Coins,
      'book-open': BookOpen,
      shield: Shield,
      zap: Zap,
      shopping: ShoppingCart,
      package: Package,
      users: Users,
      settings: Settings,
      message: MessageCircle,
      wallet: Wallet,
      home: HomeIcon,
      globe: Globe,
      lock: Lock,
      star: Star,
      bot: Bot,
    };
    return iconMap[iconName] || Gift;
  };

  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isCategorySwitching, setIsCategorySwitching] = useState(false);
  const [shouldRefetchProducts, setShouldRefetchProducts] = useState(false);

  const categorySlug = "all";

  const finishLoading = useCallback(() => setIsLoading(false), []);

  const previousPathRef = useRef<string>("");

  // Detect navigation from admin to home and re-trigger loading
  React.useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    if (previousPath.startsWith('/admin') && currentPath === '/') {
      devLog('Navigating from admin to home - re-triggering loading');
      setCategoriesLoaded(false);
      setProductsLoaded(false);
      setImagesLoaded(false);
      setShouldRefetchProducts(true);
      setIsLoading(true);
    }

    previousPathRef.current = currentPath;
  }, [location.pathname, setIsLoading]);

  // Clear category switching after data loads
  React.useEffect(() => {
    if (isCategorySwitching && categoriesLoaded && productsLoaded) {
      const timer = setTimeout(() => setIsCategorySwitching(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isCategorySwitching, categoriesLoaded, productsLoaded]);

  // Fetch categories from API
  const categoriesFetchedRef = useRef(false);
  React.useEffect(() => {
    if (categoriesFetchedRef.current) return;
    categoriesFetchedRef.current = true;

    const fetchCategories = async () => {
      try {
        devLog('Fetching categories');
        const res = await api.get('/categories');
        const json = res.data;
        if (json.success && json.data) {
          const injected = [
            ...json.data,
            {
              name: 'Captcha Solver Api',
              slug: 'captcha-solver-api',
              icon: 'bot',
              gradient: 'from-cyan-500 to-blue-500',
              productCount: 0,
            },
          ];
          setCategories(injected);
        } else {
          devLog('Failed to load categories:', json.error);
        }
      } catch (error) {
        devLog('Error fetching categories:', error);
      } finally {
        setCategoriesLoaded(true);
      }
    };
    fetchCategories();
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");

  const menuRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);

  // Scroll progress — direct DOM mutation via rAF
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
          if (scrollBarRef.current) {
            scrollBarRef.current.style.width = `${pct}%`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Surprise popup — show once after loading finishes
  useEffect(() => {
    if (isLoading) return;
    if (showSurprisePopup) return;
    if (location.pathname !== '/') return;

    const popupClosedThisSession = sessionStorage.getItem('popupClosedThisSession');
    if (popupClosedThisSession === 'true') return;

    const checkPopupSettings = async () => {
      try {
        const shouldShow = await shouldShowPopup();
        if (shouldShow) {
          setShowSurprisePopup(true);
        }
      } catch (error) {
        devLog('Error checking popup settings:', error);
      }
    };

    const timer = setTimeout(() => {
      checkPopupSettings();
    }, import.meta.env.DEV ? 500 : 1500);
    return () => clearTimeout(timer);
  }, [isLoading, showSurprisePopup, location.pathname, setShowSurprisePopup]);

  const clearPopupSession = () => {
    sessionStorage.removeItem('popupClosedThisSession');
  };

  if (typeof window !== 'undefined') {
    (window as any).clearPopupSession = clearPopupSession;
  }

  const [isSideSliderOpen, setIsSideSliderOpen] = useState(false);
  const sideSliderRef = useRef<HTMLDivElement>(null);

  // Close side slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sideSliderRef.current && !sideSliderRef.current.contains(event.target as Node)) {
        setIsSideSliderOpen(false);
      }
    };
    if (isSideSliderOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSideSliderOpen]);

  // Web3 P2P Fee form state
  const [web3Form, setWeb3Form] = useState({
    token: '',
    network: '',
    amount: '',
    walletAddress: '',
  });
  const [web3FormErrors, setWeb3FormErrors] = useState<{
    token?: string;
    network?: string;
    amount?: string;
    walletAddress?: string;
  }>({});

  // Trade settings state
  const [tradeSettings, setTradeSettings] = useState({
    enabled: true,
    minimumAmount: 0.10,
    maximumAmount: 10000,
    processingTime: "Instant",
    supportedTokens: ["USDT", "USDC", "BTC", "ETH"],
    autoProcess: true,
    requireVerification: false,
  });

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState(110);

  // Load trade settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('tradeSettings');
    if (savedSettings) {
      try {
        setTradeSettings(JSON.parse(savedSettings));
      } catch (error) {
        devLog('Error loading trade settings:', error);
      }
    }
  }, []);

  // Web3 form validation
  const validateWeb3Form = () => {
    const errors: typeof web3FormErrors = {};

    if (!web3Form.token) {
      errors.token = 'Please select a token';
    } else if (!tradeSettings.supportedTokens.includes(web3Form.token)) {
      errors.token = 'Unsupported token';
    }

    if (!web3Form.network) {
      errors.network = 'Please select a network';
    }

    if (!web3Form.amount) {
      errors.amount = 'Please enter an amount';
    } else {
      const amount = parseFloat(web3Form.amount);
      if (isNaN(amount) || amount < tradeSettings.minimumAmount) {
        errors.amount = `Minimum amount is $${tradeSettings.minimumAmount}`;
      } else if (amount > tradeSettings.maximumAmount) {
        errors.amount = `Maximum amount is $${tradeSettings.maximumAmount}`;
      }
    }

    if (!web3Form.walletAddress) {
      errors.walletAddress = 'Please enter your wallet address';
    } else if (web3Form.walletAddress.length < 26) {
      errors.walletAddress = 'Please enter a valid wallet address';
    }

    setWeb3FormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWeb3FormChange = (field: keyof typeof web3Form, value: string) => {
    setWeb3Form(prev => ({ ...prev, [field]: value }));
    if (web3FormErrors[field]) {
      setWeb3FormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleWeb3FormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateWeb3Form()) {
      const usdAmount = parseFloat(web3Form.amount);
      const bdtAmount = formatPrice(usdAmount * exchangeRate, 2);

      const p2pProduct = {
        id: `p2p-${Date.now()}`,
        name: `P2P Fee - ${web3Form.token} on ${web3Form.network}`,
        description: `P2P trading fee payment: ${web3Form.amount} USD (৳${bdtAmount} BDT)`,
        price: usdAmount,
        originalPrice: usdAmount,
        priceBDT: parseFloat(bdtAmount),
        priceUSDT: usdAmount,
        category: "Trade",
        icon: <Wallet className="w-6 h-6 text-blue-500" />,
        features: ["Instant processing", "Secure payment", "24/7 support"],
        p2pToken: web3Form.token,
        p2pNetwork: web3Form.network,
        p2pWalletAddress: web3Form.walletAddress,
      };
      addToCart(p2pProduct);

      setWeb3Form({ token: '', network: '', amount: '', walletAddress: '' });
      setWeb3FormErrors({});
    }
  };

  // Auto-close hamburger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const [apiProducts, setApiProducts] = useState<ShopProduct[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 50;
  const lastCategoryRef = useRef<string>('');

  // Fetch a page of products
  const fetchProductsPage = useCallback(async (page: number, categoryName: string, append: boolean = false) => {
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', PAGE_SIZE.toString());
      if (categoryName && categoryName !== 'All') {
        params.set('category', categoryName);
      }

      devLog(`Fetching products: /api/products?${params.toString()}`);
      const res = await api.get(`/products?${params.toString()}`);
      const json = res.data;
      if (json.success && json.data) {
        const mapped: ShopProduct[] = json.data.map((p: any, idx: number) => {
          const descLines = (p.description || '')
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0)
            .slice(0, 5);
          return {
            id: 100 + idx,
            name: p.name,
            description: descLines.length > 0 ? '' : (p.description || ''),
            price: p.priceBDT || p.priceUSDT || p.price || 0,
            priceBDT: p.priceBDT,
            priceUSDT: p.priceUSDT,
            originalPrice: p.priceUSDT || p.price || 0,
            category: p.category,
            icon: undefined as any,
            features: descLines.length > 0 ? descLines : (p.features || []),
            rating: 4.8,
            reviews: p.sales || 0,
            imageUrl: p.imageUrl,
            stock: p.stock,
            available: Boolean(p.available),
            showStock: p.smmProvider ? false : Boolean(p.showStock),
            showImageSlider: p.showImageSlider !== false,
            dbId: p._id,
            seoSlug: p.seoSlug,
            details: p.details,
            smmProvider: p.smmProvider || undefined,
            smmServiceId: p.smmServiceId || undefined,
            smmMin: p.smmMin || undefined,
            smmMax: p.smmMax || undefined,
            orderFields: p.orderFields || undefined,
          };
        });

        setApiProducts(prev => append ? [...prev, ...mapped] : mapped);
        setHasMoreProducts(json.pagination?.page < json.pagination?.pages);
        setTotalProducts(json.pagination?.total || 0);
        setCurrentPage(page);
      }
    } catch (e) {
      devLog('Failed to fetch products:', e);
    }
  }, []);

  // Fetch products
  useEffect(() => {
    if (lastCategoryRef.current === selectedCategory && !shouldRefetchProducts) return;
    lastCategoryRef.current = selectedCategory;

    setApiProducts([]);
    setCurrentPage(1);
    setHasMoreProducts(false);
    setIsLoadingMore(false);

    async function loadProducts() {
      setApiLoading(true);
      await fetchProductsPage(1, selectedCategory, false);
      setApiLoading(false);
      setProductsLoaded(true);
      setShouldRefetchProducts(false);
    }
    loadProducts();
  }, [selectedCategory, shouldRefetchProducts, categoriesLoaded, fetchProductsPage, categories]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreProducts) return;
    setIsLoadingMore(true);
    await fetchProductsPage(currentPage + 1, selectedCategory, true);
    setIsLoadingMore(false);
  };

  // Preload images function
  const preloadImages = async (imageUrls: string[]): Promise<void> => {
    const promises = imageUrls.map((url) => {
      return new Promise<void>((resolve) => {
        if (!url) { resolve(); return; }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
    });
    await Promise.all(promises);
  };

  // Preload critical UI images
  React.useEffect(() => {
    preloadImages(['/zi-logo.svg', '/images/live-button-floating.png']);
  }, []);

  // Preload product images
  React.useEffect(() => {
    if (apiProducts.length === 0) {
      setImagesLoaded(true);
      return;
    }

    const preloadProductImages = async () => {
      try {
        const productImages = apiProducts
          .map(p => p.imageUrl)
          .filter((url): url is string => Boolean(url));
        await preloadImages(productImages);
        setImagesLoaded(true);
      } catch (error) {
        devLog('Error preloading images:', error);
        setImagesLoaded(true);
      }
    };
    preloadProductImages();
  }, [apiProducts]);

  const homeDataReady = categoriesLoaded && productsLoaded && imagesLoaded;

  const isAdmin = userRole === 'admin';
  const showFullScreenMaintenance =
    maintenanceSettings.enabled === true &&
    maintenanceSettings.type === 'fullscreen' &&
    !isAdmin;

  if (showFullScreenMaintenance) {
    return <FullScreenMaintenance message={maintenanceSettings.message} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 transition-colors">
      {/* Scroll Progress Bar */}
      <div
        ref={scrollBarRef}
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 z-[100]"
        style={{ width: "0%", willChange: "width" }}
      />

      {/* Loading Screen */}
      {isLoading && view === "home" && (
        <LoadingScreen
          canFinish={homeDataReady}
          onFinish={finishLoading}
        />
      )}

      {/* Surprise Popup */}
      <SurprisePopup
        isVisible={showSurprisePopup}
        onClose={() => {
          setShowSurprisePopup(false);
          sessionStorage.setItem('popupClosedThisSession', 'true');
        }}
      />

      {/* Live Support Floating Button */}
      <a
        href="/live-support"
        className="fixed right-0 z-50 group scale-90 sm:scale-100"
        style={{ right: '-18px', bottom: '-22px' }}
        aria-label="Live Support Chat"
      >
        <div className="relative flex items-center justify-center">
          <div className="relative w-32 h-32 flex items-center justify-center hover:scale-105 transition-all duration-300">
            <img
              src="/images/live-button-floating.png"
              alt="Live Support"
              className="w-28 h-28 object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </a>

      {/* SIDE SLIDER SYSTEM */}
      <div
        ref={sideSliderRef}
        className={`fixed left-0 top-0 h-full w-[300px] sm:w-[360px] z-30 flex flex-col xl:hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSideSliderOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b1f]/95 via-[#0a061e]/98 to-[#0a061e]/100 backdrop-blur-2xl" />
        <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 right-0 w-32 h-32 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="h-[56px] sm:h-[64px] flex-shrink-0" />

          {/* Brand Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <img src="/zi-logo.svg" alt="ZI" className="w-5 h-5 object-contain brightness-0 invert" />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 opacity-30 blur-sm animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-black leading-none tracking-tight">
                    <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">ZI</span>
                    <span className="text-white/70 font-bold ml-1">PREMIUM</span>
                  </h2>
                  <p className="text-[10px] text-white/30 mt-0.5 tracking-widest uppercase">Navigation Menu</p>
                </div>
              </div>
              <button
                onClick={() => setIsSideSliderOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all duration-200 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="overflow-y-auto h-full px-4 pt-4 pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="space-y-2">
                {(sideSliderSettings?.navigation || [])
                  .filter((item: any) => item.enabled)
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((item: any, idx: number) => {
                    const IconComponent = getIconComponent(item.icon);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(item.slug === "all" ? "/" : `/${item.slug}`);
                          setIsSideSliderOpen(false);
                          window.scrollTo({ top: window.innerHeight - 100, behavior: "smooth" });
                        }}
                        className="group w-full relative flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 hover:translate-x-1"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500 -z-10" />
                        <div className={`relative flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                          <IconComponent className="w-5 h-5 text-white" />
                          {item.badge && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-black bg-white text-gray-900 rounded-full shadow-sm leading-none">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-white/90 group-hover:text-white transition-colors duration-200 truncate">{item.name}</p>
                          <p className="text-[11px] text-white/35 group-hover:text-white/55 transition-colors duration-200 mt-0.5 truncate">{item.description}</p>
                        </div>
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/0 group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
                          <ChevronRight className="w-4 h-4 text-white/0 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-300" />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 space-y-3">
            {sideSliderSettings?.liveActivity?.enabled !== false && (
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent animate-pulse" />
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <div className="relative flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400/40 animate-ping" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">Live Activity</span>
                </div>
                <div className="overflow-hidden h-[52px] relative">
                    <LiveOrderTicker orders={liveOrders} height={52} />
                  </div>
                </div>
              )}

            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                {sideSliderSettings?.trustBadges?.safe?.enabled !== false && (
                  <div className="group relative flex flex-col items-center gap-1 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-green-500/30 cursor-default transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Shield className="w-4 h-4 text-green-400 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-green-300/80 transition-colors uppercase tracking-wider leading-tight">
                      {sideSliderSettings?.trustBadges?.safe?.label}
                    </span>
                  </div>
                )}
                {sideSliderSettings?.trustBadges?.fast?.enabled !== false && (
                  <div className="group relative flex flex-col items-center gap-1 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/30 cursor-default transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Zap className="w-4 h-4 text-orange-400 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-orange-300/80 transition-colors uppercase tracking-wider leading-tight">
                      {sideSliderSettings?.trustBadges?.fast?.label}
                    </span>
                  </div>
                )}
              </div>

              {sideSliderSettings?.premiumServices?.enabled !== false && (
                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors duration-300">
                  <img
                    src={sideSliderSettings?.premiumServices?.logo || '/zi-logo.svg'}
                    alt="ZI"
                    className="w-5 h-5 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black leading-none">
                      <span className="bg-gradient-to-r from-pink-400 via-amber-300 to-sky-400 bg-clip-text text-transparent">
                        {sideSliderSettings?.premiumServices?.title?.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </p>
                    <p className="text-[8px] text-white/30 mt-0.5 leading-none">{sideSliderSettings?.premiumServices?.subtitle}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Side Slider Toggle Button */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 xl:hidden">
        <button
          onClick={() => setIsSideSliderOpen(!isSideSliderOpen)}
          className={`relative flex items-center gap-2 px-3 py-3 text-white rounded-l-lg transition-all duration-300
            ${
              isSideSliderOpen
                ? 'opacity-0 pointer-events-none translate-x-2'
                : 'bg-transparent bg-none border border-purple-500/50 hover:bg-white/10 active:bg-white/15'
            }`}
          aria-label="Open Navigation Slider"
        >
          <div className="relative flex flex-col items-center justify-center gap-[4px]">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </button>
      </div>

      <MaintenanceBar />

      {view === "home" && (
        <>
          {selectedCategorySlug === 'all' && (
            <>
              <HeroSection heroRef={heroRef} sideSliderSettings={sideSliderSettings} liveOrders={liveOrders} />
              <MarketplaceHeroBanner />
            </>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <CategoryFilterBar
              selectedCategory={selectedCategory}
              router={navigate}
              containerClassName="mb-6 sm:mb-8"
              categories={categories}
            />

            {/* Special Offer Promo Banner */}
            {selectedCategorySlug === 'all' && (
              <button
                onClick={() => navigate('/special-offer')}
                className="group relative w-full mb-6 sm:mb-8 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-600/20 via-amber-600/15 to-yellow-600/20 p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 2.879a3 3 0 00-4.242 0L3.04 9.718a3 3 0 00-.879 2.122v9.657a.75.75 0 00.75.75h18a.75.75 0 00.75-.75v-9.657a3 3 0 00-.879-2.122l-6.839-6.84a3 3 0 00-4.242 0zM9.75 21v-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                      Special Offers
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Check out our latest deals and limited-time discounts
                    </p>
                  </div>
                  <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold group-hover:bg-orange-500/30 transition-colors">
                    View All
                  </div>
                </div>
              </button>
            )}

            {/* Captcha Solver Api Cards */}
            {selectedCategorySlug === 'captcha-solver-api' && (
              <div className="transform transition-all duration-300 ease-out">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Our Bot Access Api Plans
                    </h2>
                  </div>
                </div>
                <CaptchaSolvesApiCards
                  lastAddedProductId={lastAddedProductId}
                  addToCart={addToCart}
                />
              </div>
            )}

            {/* Products Grid */}
            {selectedCategory !== "Trade" && selectedCategorySlug !== 'captcha-solver-api' && (
              <div
                className={`transform transition-all duration-300 ease-out ${
                  isCategorySwitching ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
              >
                <div id="products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {isCategorySwitching
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={`product-skeleton-${index}`}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
                        >
                          <div className="h-40 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer" />
                          <div className="mt-4 h-5 w-2/3 rounded bg-white/10" />
                          <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
                          <div className="mt-6 h-10 w-full rounded-xl bg-white/10" />
                        </div>
                      ))
                    : apiProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          lastAddedProductId={lastAddedProductId}
                          showStock={product.showStock}
                          addToCart={addToCart}
                        />
                      ))}
                </div>

                {!isCategorySwitching && hasMoreProducts && (
                  <div className="text-center mb-16">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-8 py-3 bg-white/5 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/10 hover:border-purple-400/50 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Loading...
                        </span>
                      ) : (
                        `See More (${Math.min(PAGE_SIZE, totalProducts - apiProducts.length)} more)`
                      )}
                    </button>
                  </div>
                )}

                {!isCategorySwitching && !apiLoading && !hasMoreProducts && apiProducts.length > 0 && (
                  <div className="text-center mb-16 text-gray-500 text-sm">
                    Showing all {totalProducts} products
                  </div>
                )}
              </div>
            )}

            {/* Get In Touch section */}
            <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl shadow-2xl p-5 sm:p-8 mb-16 border border-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-6">
                  <div className="relative inline-block">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                      Get In Touch
                    </h3>
                    <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Have questions about our services? Need help with your order? Contact
                    us and we'll get back to you within 24 hours.
                  </p>
                  <div className="space-y-4">
                    {/* WhatsApp Card */}
                    <a
                      href="https://wa.me/message/HAOATN77ES6PL1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex items-center space-x-4 p-5 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl hover:from-green-500/20 hover:to-green-600/10 transition-all duration-500 border border-white/10 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 transform hover:-translate-y-1 no-underline"
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/0 to-green-400/0 group-hover:from-green-500/10 group-hover:to-green-400/5 transition-all duration-500"></div>
                      <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/30">
                        <Phone className="w-6 h-6 text-white" />
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse">
                          <span className="absolute inset-0.5 bg-green-400 rounded-full"></span>
                        </span>
                      </div>
                      <div className="relative">
                        <div className="text-sm text-green-300 font-medium tracking-wide uppercase">Phone</div>
                        <div className="text-white font-semibold text-lg group-hover:text-green-200 transition-colors duration-300 flex items-center gap-2">
                          WhatsApp
                          <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">Online</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-green-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ml-auto" />
                    </a>

                    {/* Location Card */}
                    <div className="group relative flex items-center space-x-4 p-5 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl hover:from-red-500/20 hover:to-red-600/10 transition-all duration-500 border border-white/10 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 transform hover:-translate-y-1 cursor-pointer">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 to-red-400/0 group-hover:from-red-500/10 group-hover:to-red-400/5 transition-all duration-500"></div>
                      <div className="relative p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-red-500/30">
                        <MapPin className="w-6 h-6 text-white" />
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
                      </div>
                      <div className="relative">
                        <div className="text-sm text-red-300 font-medium tracking-wide uppercase">Location</div>
                        <div className="text-white font-semibold text-lg group-hover:text-red-200 transition-colors duration-300">
                          Dhaka, Bangladesh
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ml-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

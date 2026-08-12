import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import type { CartItem, Order, Product } from "../types";
import api from "../lib/axios";
import { devLog } from "../utils/devLogger";
import { roundCurrency } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";
import { useAppSettings } from "../store/AppSettingsContext";

interface ShopContextType {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    addToCart: (product: Product) => void;
    updateCartItemLink: (productId: string | number, link: string) => void;
    updateCartItemQuantity: (productId: string | number, quantity: number) => void;
    updateCartItemCustomData: (productId: string | number, customData: Record<string, any>) => void;
    removeFromCart: (productId: string | number) => void;
    getTotalPrice: () => number;
    getSubtotalPrice: () => number;
    getTotalPriceUSD: () => number;
    getTotalItems: () => number;
    exchangeRate: number;
    convertPrice: (amount: number, from: 'BDT' | 'USD', to: 'BDT' | 'USD') => Promise<number>;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    view: "home" | "checkout" | "orders" | "order-history" | "order-details";
    setView: React.Dispatch<React.SetStateAction<"home" | "checkout" | "orders" | "order-history" | "order-details">>;
    paymentMethod: string;
    setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
    cryptoCurrency: string;
    setCryptoCurrency: React.Dispatch<React.SetStateAction<string>>;
    paymentType: "network" | "uid";
    setPaymentType: React.Dispatch<React.SetStateAction<"network" | "uid">>;
    selectedNetwork: string;
    setSelectedNetwork: React.Dispatch<React.SetStateAction<string>>;
    selectedPlatform: string;
    setSelectedPlatform: React.Dispatch<React.SetStateAction<string>>;
    payerNumber: string;
    setPayerNumber: React.Dispatch<React.SetStateAction<string>>;
    trxId: string;
    setTrxId: React.Dispatch<React.SetStateAction<string>>;
    txHash: string;
    setTxHash: React.Dispatch<React.SetStateAction<string>>;
    lastAddedProductId: string | number | null;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    copiedAddress: boolean;
    setCopiedAddress: React.Dispatch<React.SetStateAction<boolean>>;
    selectedOrder: Order | null;
    setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    menuOpen: boolean;
    setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    theme: "light" | "dark";
    toggleTheme: () => void;
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    userEmail: string;
    setUserEmail: React.Dispatch<React.SetStateAction<string>>;
    userImage: string;
    setUserImage: React.Dispatch<React.SetStateAction<string>>;
    userRole: string;
    setUserRole: React.Dispatch<React.SetStateAction<string>>;
    isTraderMenu: boolean;
    setIsTraderMenu: React.Dispatch<React.SetStateAction<boolean>>;
    isKycVerified: boolean;
    setIsKycVerified: React.Dispatch<React.SetStateAction<boolean>>;
    checkIsTrader: (email: string) => Promise<boolean>;
    checkKycStatus: (email: string) => Promise<boolean>;
    handleSignIn: () => void;
    handleSignUp: () => void;
    handleSignOut: () => void;
    alertConfig: { isOpen: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; onConfirm?: () => void };
    setAlertConfig: React.Dispatch<React.SetStateAction<{ isOpen: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; onConfirm?: () => void }>>;
    showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => void;
    showSurprisePopup: boolean;
    setShowSurprisePopup: React.Dispatch<React.SetStateAction<boolean>>;
    paymentSettings: any;
    couponCode: string;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    discountAmount: number;
    setDiscountAmount: React.Dispatch<React.SetStateAction<number>>;
    discountType: string;
    couponError: string;
    applyingCoupon: boolean;
    applyCoupon: (code: string) => Promise<boolean>;
    removeCoupon: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
    // Sync with AuthContext — ShopProvider is nested inside AuthProvider in App.tsx
    const { isAuthenticated, user: authUser, logout: authLogout } = useAuth();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [view, setView] = useState<"home" | "checkout" | "orders" | "order-history" | "order-details">("home");
    const [paymentMethod, setPaymentMethod] = useState<string>("bkash");
    const [cryptoCurrency, setCryptoCurrency] = useState("");
    const [paymentType, setPaymentType] = useState<"network" | "uid">("network");
    const [selectedNetwork, setSelectedNetwork] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [payerNumber, setPayerNumber] = useState("");
    const [trxId, setTrxId] = useState("");
    const [txHash, setTxHash] = useState("");
    const [lastAddedProductId, setLastAddedProductId] = useState<string | number | null>(null);
    const lastAddedTimer = useRef<number | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem('token');
        }
        return false;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const getInitialTheme = (): "light" | "dark" => {
        if (typeof window !== "undefined") {
            return document.documentElement.classList.contains("dark") ? "dark" : "light";
        }
        return "light";
    };
    const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string; onConfirm?: () => void }>({
        isOpen: false, type: 'info', title: '', message: ''
    });
    const [showSurprisePopup, setShowSurprisePopup] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const { settings: appSettings } = useAppSettings();

    // Sync paymentSettings from AppSettingsContext (single source of truth)
    useEffect(() => {
        if (appSettings.paymentSettings && appSettings.paymentSettings !== paymentSettings) {
            setPaymentSettings(appSettings.paymentSettings);
            if ((appSettings.paymentSettings as any)?.exchangeRate) {
                setExchangeRate((appSettings.paymentSettings as any).exchangeRate);
            }
        }
    }, [appSettings.paymentSettings]);
    const [exchangeRate, setExchangeRate] = useState(110);
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountType, setDiscountType] = useState('');
    const [couponError, setCouponError] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [username, setUsername] = useState("ZIKRUL");
    const [userEmail, setUserEmail] = useState("");
    const [userImage, setUserImage] = useState<string>("");
    const [userRole, setUserRole] = useState<string>("");
    const [isTraderMenu, setIsTraderMenu] = useState(false);
    const [isKycVerified, setIsKycVerified] = useState(false);

    // Sync isLoggedIn with AuthContext globally (not just on Home page)
    useEffect(() => {
        setIsLoggedIn(isAuthenticated);
        if (isAuthenticated && authUser) {
            setUsername(authUser.username || authUser.name || "User");
            setUserEmail(authUser.email || "");
            setUserImage(authUser.image || "");
            setUserRole(authUser.role || "");
        } else {
            setUsername("ZIKRUL");
            setUserEmail("");
            setUserImage("");
            setUserRole("");
        }
    }, [isAuthenticated, authUser]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const isDark = document.documentElement.classList.contains("dark");
            setTheme(isDark ? "dark" : "light");
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    const checkIsTrader = useCallback(async (_email: string) => {
        try {
            const res = await api.get('/kyc/status');
            const data = res.data;
            if (data.success && data.isTrader) {
                setIsTraderMenu(true);
                setIsKycVerified(data.kycStatus === 'approved');
                return true;
            }
            setIsTraderMenu(false);
            setIsKycVerified(false);
            return false;
        } catch (error) {
            devLog('Error checking trader status:', error);
            setIsTraderMenu(false);
            setIsKycVerified(false);
            return false;
        }
    }, []);

    const checkKycStatus = useCallback(async (_email: string) => {
        try {
            const res = await api.get('/kyc/status');
            const data = res.data;
            if (data.success && data.kycStatus === 'approved') {
                setIsKycVerified(true);
                return true;
            }
            setIsKycVerified(false);
            return false;
        } catch (error) {
            devLog('Error checking KYC status:', error);
            setIsKycVerified(false);
            return false;
        }
    }, []);

    const addToCart = useCallback((product: Product, customData?: Record<string, any>) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1, customData: customData || item.customData } : item
                );
            }
            let initialQty = 1;
            if (product.smmProvider === 'oneservicebd') {
                initialQty = product.smmMin || 1;
            }
            const campaignPrice = (product as any).campaignPrice;
            const itemPriceBDT = campaignPrice != null && campaignPrice > 0
                ? campaignPrice : product.priceBDT || product.priceUSDT || product.price;
            return [...prevCart, {
                ...product, quantity: initialQty, price: itemPriceBDT,
                priceBDT: itemPriceBDT,
                campaignPrice: campaignPrice != null && campaignPrice > 0 ? campaignPrice : undefined,
                customData: customData || {},
            }];
        });
        if (lastAddedTimer.current) window.clearTimeout(lastAddedTimer.current);
        setLastAddedProductId(product.id);
        lastAddedTimer.current = window.setTimeout(() => setLastAddedProductId(null), 2000);
        setIsCartOpen(true);
    }, []);

    const removeFromCart = useCallback((productId: string | number) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === productId);
            if (existingItem && existingItem.quantity > 1) {
                return prevCart.map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
                );
            }
            return prevCart.filter((item) => item.id !== productId);
        });
    }, []);

    const updateCartItemLink = useCallback((productId: string | number, link: string) => {
        setCart((prevCart) => prevCart.map((item) => item.id === productId ? { ...item, link } : item));
    }, []);

    const updateCartItemQuantity = useCallback((productId: string | number, quantity: number) => {
        setCart((prevCart) => prevCart.map((item) => item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
    }, []);

    const updateCartItemCustomData = useCallback((productId: string | number, customData: Record<string, any>) => {
        setCart((prevCart) => prevCart.map((item) => item.id === productId ? { ...item, customData } : item));
    }, []);

    const getSubtotalPrice = useCallback(() => {
        const subtotal = cart.reduce((total, item) => {
            const isSmm = item.smmProvider === 'oneservicebd';
            const price = item.priceBDT || item.price;
            return total + price * (isSmm ? item.quantity / 1000 : item.quantity);
        }, 0);
        return roundCurrency(subtotal);
    }, [cart]);

    const getTotalPrice = useCallback(() => {
        const subtotal = getSubtotalPrice();
        // Whole-taka BDT total — normalized to an integer so the checkout,
        // the ZI-Pay invoice and the server-side order amount all agree.
        return Math.max(0, Math.round(subtotal - discountAmount));
    }, [getSubtotalPrice, discountAmount]);

    const getTotalPriceUSD = useCallback(() => {
        const subtotal = cart.reduce((total, item) => {
            const isSmm = item.smmProvider === 'oneservicebd';
            const usdPrice = item.priceUSDT || (item.price ? roundCurrency(item.price / exchangeRate) : 0);
            return total + usdPrice * (isSmm ? item.quantity / 1000 : item.quantity);
        }, 0);
        const discountUSD = roundCurrency(discountAmount / exchangeRate);
        return Math.max(0, Math.round(subtotal - discountUSD));
    }, [cart, exchangeRate, discountAmount]);

    const getTotalItems = useCallback(() => cart.length, [cart]);

    const convertPrice = useCallback(async (amount: number, from: 'BDT' | 'USD', to: 'BDT' | 'USD') => {
        try {
            const res = await api.get(`/convert-price?amount=${amount}&from=${from}&to=${to}`);
            if (res.data.success) return parseFloat(res.data.data.convertedAmount);
            return amount;
        } catch { return amount; }
    }, []);

    const applyCoupon = useCallback(async (code: string) => {
        if (!code.trim()) {
            setCouponError('Please enter a coupon code');
            return false;
        }
        setApplyingCoupon(true);
        setCouponError('');
        try {
            const cartItems = cart.map(item => ({
                productId: item.dbId || item.id, dbId: item.dbId, id: item.id,
                category: item.category || '', _id: item.dbId || item.id,
                quantity: item.quantity, name: item.name, price: item.priceBDT || item.price,
            }));
            const res = await api.post('/coupons/validate', { code: code.trim(), items: cartItems, email: userEmail || '', totalAmount: getSubtotalPrice() });
            const data = res.data;
            if (data.success) {
                setCouponCode(code.trim().toUpperCase());
                setDiscountAmount(data.data.discountAmount);
                setDiscountType(data.data.discountType);
                setCouponError('');
                // Persist the applied coupon + cart so a page refresh (or the
                // ZI-Pay round-trip) keeps the discounted price active.
                try {
                    const persisted = JSON.parse(localStorage.getItem('zi-pay-checkout-data') || 'null');
                    localStorage.setItem('zi-pay-checkout-data', JSON.stringify({
                        email: (persisted?.email) || userEmail || '',
                        username: (persisted?.username) || '',
                        paymentMethod: (persisted?.paymentMethod) || paymentMethod || 'bkash',
                        totalAmount: Math.round(getTotalPrice()),
                        cart,
                        couponCode: code.trim().toUpperCase(),
                        couponDiscount: data.data.discountAmount,
                        couponType: data.data.discountType,
                    }));
                } catch { /* Non-blocking persistence failure */ }
                return true;
            } else {
                const serverMsg: string | undefined =
                    typeof data.message === 'string' ? data.message : undefined;
                setCouponCode(''); setDiscountAmount(0); setDiscountType('');
                setCouponError(serverMsg || 'Invalid coupon');
                if (serverMsg?.toLowerCase().includes('already used this coupon')) {
                    showAlert('warning', 'Coupon Already Used', 'You have already used this coupon for a product in your cart. Please try a different coupon.');
                }
                return false;
            }
        } catch (err: any) {
            const serverMsg: string | undefined =
                typeof err?.response?.data?.message === 'string'
                    ? err.response.data.message
                    : undefined;
            setCouponError(serverMsg || 'Failed to validate coupon. Please try again.');
            if (serverMsg?.toLowerCase().includes('already used this coupon')) {
                showAlert('warning', 'Coupon Already Used', 'You have already used this coupon for a product in your cart. Please try a different coupon.');
            }
            setCouponCode(''); setDiscountAmount(0); setDiscountType('');
            return false;
        } finally { setApplyingCoupon(false); }
    }, [cart, getSubtotalPrice]);

    const removeCoupon = useCallback(() => {
        setCouponCode(''); setDiscountAmount(0); setDiscountType(''); setCouponError('');
    }, []);

    const handleSignIn = useCallback(() => setIsLoggedIn(true), []);
    const handleSignUp = useCallback(() => setIsLoggedIn(true), []);
    const handleSignOut = useCallback(() => {
        authLogout();
        setIsLoggedIn(false); setUsername("ZIKRUL"); setUserEmail(""); setUserImage("");
    }, [authLogout]);

    const showAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    }, []);

    const cartLoadedRef = useRef(false);
    useEffect(() => {
        const loadCartFromDB = async () => {
            if (cartLoadedRef.current || !isLoggedIn || !userEmail) return;
            cartLoadedRef.current = true;
            try {
                const res = await api.get(`/cart?email=${encodeURIComponent(userEmail)}`);
                const data = res.data;
                if (data.success && data.data?.items && data.data.items.length > 0) {
                    setCart(prev => {
                        if (prev.length === 0) {
                            return data.data.items.map((item: any) => ({
                                ...item, id: item.productId, price: item.priceBDT || item.price,
                                priceBDT: item.priceBDT || item.price, features: item.features || [],
                                link: item.link || '', smmProvider: item.smmProvider || '',
                                smmServiceId: item.smmServiceId || '', category: item.category || '',
                                details: item.details || '', stock: item.stock || 0,
                                customData: item.customData || {},
                            }));
                        }
                        return prev;
                    });
                }
            } catch (error) { devLog('Error loading cart from database:', error); }
        };
        loadCartFromDB();
    }, [isLoggedIn, userEmail]);

    // Restore the applied coupon + cart from the persisted ZI-Pay checkout
    // record after a page refresh or after returning from the ZI-Pay gateway.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('zi-pay-checkout-data');
            if (!raw) return;
            const persisted = JSON.parse(raw);
            if (!persisted?.cart?.length) return;

            const persistedCoupon = persisted.couponCode;
            const persistedDiscount = Number(persisted.couponDiscount || 0);
            const persistedType = persisted.couponType || '';

            if (persistedCoupon) {
                setCouponCode(persistedCoupon);
                setDiscountAmount(persistedDiscount);
                setDiscountType(persistedType);
            }

            setCart(prev => {
                // Only restore the cart if the user hasn't already started a new one.
                if (prev.length > 0) return prev;
                return persisted.cart.map((item: any) => ({
                    ...item, id: item.dbId || item.id, price: item.priceBDT || item.price,
                    priceBDT: item.priceBDT || item.price, features: item.features || [],
                    link: item.link || '', smmProvider: item.smmProvider || '',
                    smmServiceId: item.smmServiceId || '', category: item.category || '',
                    details: item.details || '', stock: item.stock || 0,
                    customData: item.customData || {},
                }));
            });
        } catch { /* Non-blocking restore failure */ }
    }, []);

    const saveTimerRef = useRef<number | null>(null);
    const lastSavedCartRef = useRef<string>('');
    useEffect(() => {
        if (!isLoggedIn || !userEmail) return;
        const currentCartJson = JSON.stringify(cart);
        if (currentCartJson === lastSavedCartRef.current) return;
        const saveCartToDB = async () => {
            try {
                if (cart.length === 0) {
                    if (lastSavedCartRef.current !== '[]') {
                        await api.delete(`/cart?email=${encodeURIComponent(userEmail)}`);
                    }
                } else {
                    await api.post('/cart', { email: userEmail, items: cart });
                }
                lastSavedCartRef.current = currentCartJson;
            } catch (error) { devLog('Error saving cart to database:', error); }
        };
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(saveCartToDB, 1000);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [cart, isLoggedIn, userEmail]);

    useEffect(() => {
        if (!isLoggedIn && cartLoadedRef.current) {
            cartLoadedRef.current = false;
            lastSavedCartRef.current = '';
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (paymentSettings?.cryptoCurrencies && Object.keys(paymentSettings.cryptoCurrencies).length > 0) {
            const firstCurrency = Object.keys(paymentSettings.cryptoCurrencies).find(k => paymentSettings.cryptoCurrencies[k]);
            if (firstCurrency && !cryptoCurrency) setCryptoCurrency(firstCurrency);
        }
        if (paymentSettings?.customNetworks && Object.keys(paymentSettings.customNetworks).length > 0) {
            const firstNetwork = Object.keys(paymentSettings.customNetworks).find(k => paymentSettings.customNetworks[k]?.enabled);
            if (firstNetwork && !selectedNetwork) setSelectedNetwork(firstNetwork);
        }
        if (paymentSettings?.customPlatforms && Object.keys(paymentSettings.customPlatforms).length > 0) {
            const firstPlatform = Object.keys(paymentSettings.customPlatforms).find(k => paymentSettings.customPlatforms[k]?.enabled);
            if (firstPlatform && !selectedPlatform) setSelectedPlatform(firstPlatform);
        }
    }, [paymentSettings]);

    return (
        <ShopContext.Provider value={{
            cart, setCart, addToCart, updateCartItemLink, updateCartItemQuantity, updateCartItemCustomData, removeFromCart,
            getTotalPrice, getSubtotalPrice, getTotalPriceUSD, getTotalItems, exchangeRate, convertPrice,
            isCartOpen, setIsCartOpen, view, setView, paymentMethod, setPaymentMethod,
            cryptoCurrency, setCryptoCurrency, paymentType, setPaymentType,
            selectedNetwork, setSelectedNetwork, selectedPlatform, setSelectedPlatform,
            payerNumber, setPayerNumber, trxId, setTrxId, txHash, setTxHash, lastAddedProductId,
            orders, setOrders, copiedAddress, setCopiedAddress, selectedOrder, setSelectedOrder,
            isLoggedIn, setIsLoggedIn, isLoading, setIsLoading, menuOpen, setMenuOpen,
            theme, toggleTheme, username, setUsername, userEmail, setUserEmail, userImage, setUserImage,
            userRole, setUserRole, isTraderMenu, setIsTraderMenu, isKycVerified, setIsKycVerified,
            checkIsTrader, checkKycStatus, handleSignIn, handleSignUp, handleSignOut,
            alertConfig, setAlertConfig, showAlert, showSurprisePopup, setShowSurprisePopup,
            paymentSettings, couponCode, setCouponCode, discountAmount, setDiscountAmount,
            discountType, couponError, applyingCoupon, applyCoupon, removeCoupon,
        }}>
            {children}
        </ShopContext.Provider>
    );
}

export function useShopContext() {
    const context = useContext(ShopContext);
    if (context === undefined) throw new Error("useShopContext must be used within a ShopProvider");
    return context;
}

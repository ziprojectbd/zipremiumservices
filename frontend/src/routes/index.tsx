import { Routes, Route } from 'react-router-dom';
import RootLayout from '../components/layout/RootLayout';
import AdminShell from '../components/layout/AdminShell';
import AdminRoute from './AdminRoute';

// Lazy load pages
import { lazy, Suspense } from 'react';
import LoadingScreen from '../components/public/LoadingScreen';

// Public pages
const Home = lazy(() => import('../pages/public/Home'));
const SignIn = lazy(() => import('../pages/public/SignIn'));
const SignUp = lazy(() => import('../pages/public/SignUp'));
const CategoryPage = lazy(() => import('../pages/public/CategoryPage'));
const ProductDetail = lazy(() => import('../pages/public/ProductDetail'));
const Checkout = lazy(() => import('../pages/public/Checkout'));
const AboutUs = lazy(() => import('../pages/public/AboutUs'));
const ContactUs = lazy(() => import('../pages/public/ContactUs'));
const PrivacyPolicy = lazy(() => import('../pages/public/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/public/TermsOfService'));
const Airdrop = lazy(() => import('../pages/public/Airdrop'));
const Trade = lazy(() => import('../pages/public/Trade'));
const SpecialOffer = lazy(() => import('../pages/public/SpecialOffer'));
const MyOrders = lazy(() => import('../pages/public/MyOrders'));
const OrderHistory = lazy(() => import('../pages/public/OrderHistory'));
const OrderDetails = lazy(() => import('../pages/public/OrderDetails'));
const OrderSuccess = lazy(() => import('../pages/public/OrderSuccess'));
const PaymentProcess = lazy(() => import('../pages/public/PaymentProcess'));
const LiveSupport = lazy(() => import('../pages/public/LiveSupport'));
const SellProduct = lazy(() => import('../pages/public/SellProduct'));
const CaptchaDashboard = lazy(() => import('../pages/public/CaptchaDashboard'));
const Marketplace = lazy(() => import('../pages/public/marketplace/Marketplace'));
const MarketplaceListings = lazy(() => import('../pages/public/marketplace/Listings'));
const MarketplaceListingDetail = lazy(() => import('../pages/public/marketplace/ListingDetail'));
const MarketplaceListItems = lazy(() => import('../pages/public/marketplace/ListItems'));
const MarketplaceEditListing = lazy(() => import('../pages/public/marketplace/EditListing'));
const MarketplaceMyListings = lazy(() => import('../pages/public/marketplace/MyListings'));
const MarketplaceMyBids = lazy(() => import('../pages/public/marketplace/MyBids'));
const MarketplaceMyChats = lazy(() => import('../pages/public/marketplace/MyChats'));
const MarketplaceTraderKyc = lazy(() => import('../pages/public/marketplace/TraderKyc'));
const MarketplaceOrderHistory = lazy(() => import('../pages/public/marketplace/MarketplaceOrderHistory'));
const CatchAllPage = lazy(() => import('../pages/public/CatchAllPage'));

// Admin pages
const AdminLogin = lazy(() => import('../pages/admin/Login'));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('../pages/admin/Orders'));
const AdminOrderDetails = lazy(() => import('../pages/admin/OrderDetails'));
const AdminTradeOrders = lazy(() => import('../pages/admin/TradeOrders'));
const AdminProducts = lazy(() => import('../pages/admin/Products'));
const AdminProductEdit = lazy(() => import('../pages/admin/ProductEdit'));
const AdminSmmProducts = lazy(() => import('../pages/admin/SmmProducts'));
const AdminCaptchaProducts = lazy(() => import('../pages/admin/CaptchaProducts'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminUserSubmissions = lazy(() => import('../pages/admin/UserSubmissions'));
const AdminCustomers = lazy(() => import('../pages/admin/Customers'));
const AdminBrokerChats = lazy(() => import('../pages/admin/BrokerChats'));
const AdminTraderKyc = lazy(() => import('../pages/admin/TraderKyc'));
const AdminCampaigns = lazy(() => import('../pages/admin/Campaigns'));
const AdminCoupons = lazy(() => import('../pages/admin/Coupons'));
const AdminPopupManagement = lazy(() => import('../pages/admin/PopupManagement'));
const AdminSpecialPromo = lazy(() => import('../pages/admin/SpecialPromo'));
const AdminAddSpecialPromo = lazy(() => import('../pages/admin/AddSpecialPromo'));
const AdminAirdrops = lazy(() => import('../pages/admin/Airdrops'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminFooterManagement = lazy(() => import('../pages/admin/FooterManagement'));
const AdminPaymentManagement = lazy(() => import('../pages/admin/PaymentManagement'));
const AdminMaintenanceManagement = lazy(() => import('../pages/admin/MaintenanceManagement'));
const AdminSideSliderManagement = lazy(() => import('../pages/admin/SideSliderManagement'));

function LazyPage({ Component }: { Component: React.LazyExoticComponent<any> }) {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <Component />
        </Suspense>
    );
}

export default function AppRoutes() {
    return (
        <Routes>
            {/* Admin Login - standalone, no RootLayout */}
            <Route path="/admin/login" element={<LazyPage Component={AdminLogin} />} />

            {/* Root layout wraps all public routes */}
            <Route element={<RootLayout />}>
                <Route path="/" element={<LazyPage Component={Home} />} />
                <Route path="/sign-in" element={<LazyPage Component={SignIn} />} />
                <Route path="/sign-up" element={<LazyPage Component={SignUp} />} />
                <Route path="/category/:slug" element={<LazyPage Component={CategoryPage} />} />
                <Route path="/product/:slug/*" element={<LazyPage Component={ProductDetail} />} />
                <Route path="/checkout" element={<LazyPage Component={Checkout} />} />
                <Route path="/about-us" element={<LazyPage Component={AboutUs} />} />
                <Route path="/contact-us" element={<LazyPage Component={ContactUs} />} />
                <Route path="/privacy-policy" element={<LazyPage Component={PrivacyPolicy} />} />
                <Route path="/terms-of-service" element={<LazyPage Component={TermsOfService} />} />
                <Route path="/airdrop" element={<LazyPage Component={Airdrop} />} />
                <Route path="/trade" element={<LazyPage Component={Trade} />} />
                <Route path="/special-offer" element={<LazyPage Component={SpecialOffer} />} />
                <Route path="/my-orders" element={<LazyPage Component={MyOrders} />} />
                <Route path="/order-history" element={<LazyPage Component={OrderHistory} />} />
                <Route path="/order-history/details/:id" element={<LazyPage Component={OrderDetails} />} />
                <Route path="/order/success" element={<LazyPage Component={OrderSuccess} />} />
                <Route path="/live-support" element={<LazyPage Component={LiveSupport} />} />
                <Route path="/sell-product" element={<LazyPage Component={SellProduct} />} />
                <Route path="/dashboard/captchamaster" element={<LazyPage Component={CaptchaDashboard} />} />

                {/* Marketplace */}
                <Route path="/marketplace" element={<LazyPage Component={Marketplace} />} />
                <Route path="/marketplace/listings" element={<LazyPage Component={MarketplaceListings} />} />
                <Route path="/marketplace/listings/:id" element={<LazyPage Component={MarketplaceListingDetail} />} />
                <Route path="/marketplace/list-items" element={<LazyPage Component={MarketplaceListItems} />} />
                <Route path="/marketplace/list-items/:id" element={<LazyPage Component={MarketplaceEditListing} />} />
                <Route path="/marketplace/my-listings" element={<LazyPage Component={MarketplaceMyListings} />} />
                <Route path="/marketplace/my-bids" element={<LazyPage Component={MarketplaceMyBids} />} />
                <Route path="/marketplace/my-chats" element={<LazyPage Component={MarketplaceMyChats} />} />
                <Route path="/marketplace/trader-kyc" element={<LazyPage Component={MarketplaceTraderKyc} />} />
                <Route path="/marketplace/order-history" element={<LazyPage Component={MarketplaceOrderHistory} />} />

                {/* Catch-all for CMS pages */}
                <Route path="/:slug" element={<LazyPage Component={CatchAllPage} />} />
            </Route>

            {/* ZI Pay callback — returns here after payment, creates the order, and redirects to /order/success */}
            <Route path="/payment/process" element={<LazyPage Component={PaymentProcess} />} />

            {/* Admin routes - protected by AdminRoute */}
            <Route element={<AdminRoute />}>
                <Route element={<AdminShell />}>
                    <Route path="/admin/dashboard" element={<LazyPage Component={AdminDashboard} />} />
                    <Route path="/admin/orders" element={<LazyPage Component={AdminOrders} />} />
                    <Route path="/admin/orders/details/:orderNumber" element={<LazyPage Component={AdminOrderDetails} />} />
                    <Route path="/admin/orders/trade" element={<LazyPage Component={AdminTradeOrders} />} />
                    <Route path="/admin/products" element={<LazyPage Component={AdminProducts} />} />
                    <Route path="/admin/products/edit/:productId" element={<LazyPage Component={AdminProductEdit} />} />
                    <Route path="/admin/products/smm" element={<LazyPage Component={AdminSmmProducts} />} />
                    <Route path="/admin/products/captchamaster" element={<LazyPage Component={AdminCaptchaProducts} />} />
                    <Route path="/admin/user/users" element={<LazyPage Component={AdminUsers} />} />
                    <Route path="/admin/user/user-submissions" element={<LazyPage Component={AdminUserSubmissions} />} />
                    <Route path="/admin/user/customers" element={<LazyPage Component={AdminCustomers} />} />
                    <Route path="/admin/user/broker-chats" element={<LazyPage Component={AdminBrokerChats} />} />
                    <Route path="/admin/user/trader-kyc" element={<LazyPage Component={AdminTraderKyc} />} />
                    <Route path="/admin/special-offer/campaigns" element={<LazyPage Component={AdminCampaigns} />} />
                    <Route path="/admin/special-offer/coupons" element={<LazyPage Component={AdminCoupons} />} />
                    <Route path="/admin/special-offer/popup-management" element={<LazyPage Component={AdminPopupManagement} />} />
                    <Route path="/admin/special-offer/special-promo" element={<LazyPage Component={AdminSpecialPromo} />} />
                    <Route path="/admin/special-offer/special-promo/new" element={<LazyPage Component={AdminAddSpecialPromo} />} />
                    <Route path="/admin/airdrops" element={<LazyPage Component={AdminAirdrops} />} />
                    <Route path="/admin/settings" element={<LazyPage Component={AdminSettings} />} />
                    <Route path="/admin/settings/footer-management" element={<LazyPage Component={AdminFooterManagement} />} />
                    <Route path="/admin/settings/payment-management" element={<LazyPage Component={AdminPaymentManagement} />} />
                    <Route path="/admin/settings/maintenance-management" element={<LazyPage Component={AdminMaintenanceManagement} />} />
                    <Route path="/admin/settings/side-slider-management" element={<LazyPage Component={AdminSideSliderManagement} />} />
                </Route>
            </Route>
        </Routes>
    );
}

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/axios";
import { formatPrice } from "../../utils/formatPrice";
import {
  Package,
  Key,
  Clock,
  DollarSign,
  Loader2,
  Search,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { useShopContext } from "../../store/ShopContext";

interface CaptchaPackageItem {
  id: string;
  planName: string;
  credits: number;
  creditsUsed: number;
  creditsRemaining: number;
  price: number;
  currency: string;
  status: string;
  expiresAt: string;
  activatedAt: string;
  captchaMasterPackageId: string;
  captchaApiKey: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  planName: string;
  credits: number;
  amount: number;
  currency: string;
  status: string;
  paymentGatewayRef: string | null;
  captchaMasterPackageId: string | null;
  createdAt: string;
  completedAt: string | null;
}

type TabType = "packages" | "orders";

export default function CustomerCaptchaMasterDashboard() {
  const navigate = useNavigate();
  const {
    setIsLoggedIn,
    setUsername,
    setUserEmail,
    setView,
    setIsCartOpen,
    getTotalItems,
    menuOpen,
    setMenuOpen,
    theme,
    toggleTheme,
    username,
    isLoggedIn,
    userEmail,
    userImage,
    userRole,
    showAlert,
  } = useShopContext();

  const [activeTab, setActiveTab] = useState<TabType>("packages");
  const [packages, setPackages] = useState<CaptchaPackageItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const limit = 10;

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/sign-in?redirect=/dashboard/captchamaster");
    }
  }, [isLoggedIn, navigate]);

  // Show toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch packages
  const fetchPackages = useCallback(async (pageNum: number, search: string) => {
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(limit),
      });
      if (search) params.set("search", search);

      const res = await api.get(`/customer/captchamaster/packages?${params}`);
      const json = res.data;
      if (json.success) {
        setPackages(json.data || []);
        setTotalPages(json.pagination?.pages || 1);
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async (pageNum: number) => {
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(limit),
      });
      const res = await api.get(`/customer/captchamaster/orders?${params}`);
      const json = res.data;
      if (json.success) {
        setOrders(json.data || []);
        setTotalPages(json.pagination?.pages || 1);
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);

    (activeTab === "packages" ? fetchPackages(page, searchQuery) : fetchOrders(page))
      .finally(() => setLoading(false));
  }, [isLoggedIn, activeTab, page, fetchPackages, fetchOrders]);

  // When search changes, reset page and refetch
  useEffect(() => {
    if (activeTab === "packages") {
      setPage(1);
      fetchPackages(1, searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setToast("Failed to copy");
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleApiKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const creditsUsedPercent = (pkg: CaptchaPackageItem) => {
    if (pkg.credits === 0) return 0;
    return Math.min(100, Math.round((pkg.creditsUsed / pkg.credits) * 100));
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSearchQuery("");
    setError(null);
    setLoading(true);
  };

  return (
    <div className="min-h-screen bg-[#0a061e]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            CaptchaMaster{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-gray-400">Manage your purchased packages and API keys</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit mb-8">
          <button
            onClick={() => switchTab("packages")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "packages"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Package className="w-4 h-4" />
            My Packages
          </button>
          <button
            onClick={() => switchTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "orders"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Order History
          </button>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-medium mb-1">Failed to load data</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PACKAGES TAB */}
        {/* ============================================ */}
        {!loading && !error && activeTab === "packages" && (
          <>
            {/* Search */}
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium mb-2">No packages found</p>
                <p className="text-gray-600 text-sm mb-6">
                  {searchQuery
                    ? "Try a different search term."
                    : "You haven't purchased any CaptchaMaster packages yet."}
                </p>
                {!searchQuery && (
                  <a
                    href="/captchamaster"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Pricing Plans
                  </a>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{pkg.planName}</h3>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              pkg.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : pkg.status === "expired"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {pkg.status}
                          </span>
                        </div>

                        {/* Credits bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">
                              Credits: {pkg.creditsRemaining.toLocaleString()} /{" "}
                              {pkg.credits.toLocaleString()}
                            </span>
                            <span className="text-gray-500">{creditsUsedPercent(pkg)}% used</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                              style={{ width: `${creditsUsedPercent(pkg)}%` }}
                            />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            ${formatPrice(pkg.price, 2)}
                          </div>
                          {pkg.expiresAt && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              Expires: {new Date(pkg.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                          {pkg.activatedAt && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Activated: {new Date(pkg.activatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* API Key */}
                        {pkg.captchaApiKey && (
                          <div className="mt-3 flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-yellow-400" />
                            <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono text-gray-300">
                              {visibleApiKeys.has(pkg.id)
                                ? pkg.captchaApiKey
                                : `${pkg.captchaApiKey.slice(0, 8)}${".".repeat(16)}`}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(pkg.id)}
                              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                              {visibleApiKeys.has(pkg.id) ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* ORDERS TAB */}
        {/* ============================================ */}
        {!loading && !error && activeTab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium mb-2">No orders yet</p>
                <p className="text-gray-600 text-sm">
                  Your CaptchaMaster purchase history will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono text-gray-300">
                              {order.orderNumber}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white text-sm font-medium">{order.planName}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-300">
                            {order.credits.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-white font-medium">
                            ${formatPrice(order.amount, 2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                order.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : order.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl text-sm text-white">
          {toast}
        </div>
      )}
    </div>
  );
}

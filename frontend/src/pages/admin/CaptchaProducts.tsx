import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  Users,
  Package,
  Key,
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import api from '../../lib/axios';

// ============================================================
// TYPES
// ============================================================

interface DashboardStats {
  credits: number;
  totalCustomers: number;
  totalPackages: number;
  totalApiKeys: number;
  totalUsed: number;
  totalSuccess: number;
  totalFailed: number;
  localOrders: number;
  localActivePackages: number;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastUsed?: string;
}

interface PackageItem {
  id: string;
  planId: string;
  planName: string;
  credits: number;
  price: number;
  customerEmail: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  key?: string;
}

interface ConfirmAction {
  type: 'delete-package' | 'delete-key' | 'regenerate-key';
  id: string;
  label: string;
}

// ============================================================
// TOAST COMPONENT
// ============================================================

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-slide-up ${
        type === 'success'
          ? 'bg-green-900/90 border-green-500/30 text-green-200'
          : 'bg-red-900/90 border-red-500/30 text-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================
// COUNTDOWN COMPONENT
// ============================================================

function CountdownTimer({ endDate }: { endDate: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const display = useMemo(() => {
    if (!endDate) return { text: '-', color: 'text-gray-400' };
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      const expired = Math.abs(diff);
      return { text: `Expired ${formatDuration(expired)} ago`, color: 'text-red-400' };
    }

    return { text: `${formatDuration(diff)} left`, color: 'text-green-400' };
  }, [endDate, now]);

  return <span className={`text-xs font-medium ${display.color}`}>{display.text}</span>;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminCaptchaMasterPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'packages' | 'api-keys'>('stats');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [packagesPage, setPackagesPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/captchamaster/stats');
      if (res.data.success) setStats(res.data.data);
      else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch stats', 'error');
    }
  }, [showToast]);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await api.get('/admin/captchamaster/packages');
      if (res.data.success) setPackages(res.data.data?.data || []);
      else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch packages', 'error');
    }
  }, [showToast]);

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await api.get('/admin/captchamaster/api-keys');
      if (res.data.success) setApiKeys(res.data.data);
      else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch API keys', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchStats(), fetchPackages(), fetchApiKeys()]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchStats, fetchPackages, fetchApiKeys]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleDeletePackage = async (id: string) => {
    setActionLoading(`delete-pkg-${id}`);
    try {
      const res = await api.delete(`/admin/captchamaster/packages/${id}`);
      if (res.data.success) {
        showToast('Package deleted successfully', 'success');
        setPackages((prev) => prev.filter((p) => p.id !== id));
      } else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete package', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setActionLoading('create-key');
    try {
      const res = await api.post('/admin/captchamaster/api-keys', { name: newKeyName.trim() });
      if (res.data.success) {
        showToast('API key created successfully', 'success');
        setApiKeys((prev) => [res.data.data, ...prev]);
        setNewKeyName('');
        setShowCreateKeyModal(false);
      } else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to create API key', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    setActionLoading(`regenerate-${id}`);
    try {
      const res = await api.put(`/admin/captchamaster/api-keys/${id}/regenerate`);
      if (res.data.success) {
        showToast('API key regenerated successfully', 'success');
        setApiKeys((prev) => prev.map((k) => (k.id === id ? res.data.data : k)));
      } else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate API key', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    setActionLoading(`delete-key-${id}`);
    try {
      const res = await api.delete(`/admin/captchamaster/api-keys/${id}`);
      if (res.data.success) {
        showToast('API key deleted successfully', 'success');
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
      } else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete API key', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  // ============================================================
  // FILTERED DATA
  // ============================================================

  const filteredPackages = packages.filter((pkg) => {
    const name = (pkg.planName || '').toLowerCase();
    const email = (pkg.customerEmail || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
  const paginatedPackages = filteredPackages.slice(
    (packagesPage - 1) * itemsPerPage,
    packagesPage * itemsPerPage
  );

  // ============================================================
  // STATS CARDS
  // ============================================================

  const statCards = stats
    ? [
        {
          title: 'Credits',
          value: stats.credits.toLocaleString(),
          icon: Wallet,
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
        },
        {
          title: 'Total Customers',
          value: stats.totalCustomers.toLocaleString(),
          icon: Users,
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
        },
        {
          title: 'Total Packages',
          value: stats.totalPackages.toLocaleString(),
          icon: Package,
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
        },
        {
          title: 'API Keys',
          value: stats.totalApiKeys.toLocaleString(),
          icon: Key,
          bg: 'bg-orange-500/10',
          text: 'text-orange-400',
        },
        {
          title: 'Used',
          value: stats.totalUsed.toLocaleString(),
          icon: TrendingUp,
          bg: 'bg-violet-500/10',
          text: 'text-violet-400',
        },
        {
          title: 'Success',
          value: stats.totalSuccess.toLocaleString(),
          icon: CheckCircle,
          bg: 'bg-green-500/10',
          text: 'text-green-400',
        },
        {
          title: 'Failed',
          value: stats.totalFailed.toLocaleString(),
          icon: XCircle,
          bg: 'bg-red-500/10',
          text: 'text-red-400',
        },
        {
          title: 'Local Orders',
          value: stats.localOrders.toLocaleString(),
          icon: BarChart3,
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
        },
      ]
    : [];

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading CaptchaMaster dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CaptchaMaster</h1>
          <p className="text-gray-400 text-sm mt-1">Manage CaptchaMaster integration</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchStats(); fetchPackages(); fetchApiKeys(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all border border-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        {[
          { id: 'stats', label: 'Stats', icon: BarChart3 },
          { id: 'packages', label: 'Packages', icon: Package },
          { id: 'api-keys', label: 'API Keys', icon: Key },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setPackagesPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* STATS TAB */}
      {/* ============================================================ */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="relative group bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
                <card.icon className="w-full h-full" />
              </div>
              <div className="relative z-10">
                <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.text}`} />
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{card.title}</p>
                <p className="text-xl font-bold text-white">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* PACKAGES TAB */}
      {/* ============================================================ */}
      {activeTab === 'packages' && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by plan name or customer email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPackagesPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Key</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Credits</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Expiry</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedPackages.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      {searchQuery ? 'No packages match your search.' : 'No packages found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium text-sm">{pkg.planName}</p>
                        <p className="text-gray-500 text-xs">ID: {pkg.id.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-sm">{pkg.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {pkg.key ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono text-gray-300">
                              {visibleKeys.has(pkg.id)
                                ? pkg.key
                                : `${pkg.key.slice(0, 12)}${'.'.repeat(20)}`}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(pkg.id)}
                              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              title={visibleKeys.has(pkg.id) ? 'Hide key' : 'Show key'}
                            >
                              {visibleKeys.has(pkg.id) ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(pkg.key!, pkg.id)}
                              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              title="Copy key"
                            >
                              {copiedKey === pkg.id ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-medium">{pkg.credits.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CountdownTimer endDate={pkg.endDate || pkg.expiresAt || ''} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            pkg.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : pkg.status === 'expired'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'delete-package',
                              id: pkg.id,
                              label: pkg.planName,
                            })
                          }
                          disabled={actionLoading === `delete-pkg-${pkg.id}`}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                          title="Delete package"
                        >
                          {actionLoading === `delete-pkg-${pkg.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Page {packagesPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPackagesPage((p) => Math.max(1, p - 1))}
                  disabled={packagesPage === 1}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPackagesPage((p) => Math.min(totalPages, p + 1))}
                  disabled={packagesPage === totalPages}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* API KEYS TAB */}
      {/* ============================================================ */}
      {activeTab === 'api-keys' && (
        <div className="space-y-4">
          {/* Create Key Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateKeyModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create API Key</span>
            </button>
          </div>

          {/* Keys List */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Key</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                        No API keys found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium text-sm">{key.name}</p>
                          <p className="text-gray-500 text-xs">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono text-gray-300">
                              {visibleKeys.has(key.id)
                                ? key.key
                                : `${key.key.slice(0, 12)}${'.'.repeat(20)}`}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              title={visibleKeys.has(key.id) ? 'Hide key' : 'Show key'}
                            >
                              {visibleKeys.has(key.id) ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(key.key, key.id)}
                              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                              title="Copy key"
                            >
                              {copiedKey === key.id ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              key.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {key.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'regenerate-key',
                                  id: key.id,
                                  label: key.name,
                                })
                              }
                              disabled={actionLoading === `regenerate-${key.id}`}
                              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-50"
                              title="Regenerate key"
                            >
                              {actionLoading === `regenerate-${key.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'delete-key',
                                  id: key.id,
                                  label: key.name,
                                })
                              }
                              disabled={actionLoading === `delete-key-${key.id}`}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                              title="Delete key"
                            >
                              {actionLoading === `delete-key-${key.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE API KEY MODAL */}
      {/* ============================================================ */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Create API Key</h2>
            <input
              type="text"
              placeholder="Enter key name..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateApiKey()}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCreateKeyModal(false); setNewKeyName(''); }}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApiKey}
                disabled={!newKeyName.trim() || actionLoading === 'create-key'}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading === 'create-key' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-500/20 rounded-full mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Confirm Action</h2>
              <p className="text-gray-400 text-sm">
                {confirmAction.type === 'delete-package'
                  ? `Are you sure you want to delete the package "${confirmAction.label}"?`
                  : confirmAction.type === 'regenerate-key'
                  ? `Regenerate API key "${confirmAction.label}"? The old key will stop working.`
                  : `Are you sure you want to delete the API key "${confirmAction.label}"?`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'delete-package') handleDeletePackage(confirmAction.id);
                  else if (confirmAction.type === 'regenerate-key') handleRegenerateKey(confirmAction.id);
                  else if (confirmAction.type === 'delete-key') handleDeleteApiKey(confirmAction.id);
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-white ${
                  confirmAction.type === 'regenerate-key'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                }`}
              >
                {confirmAction.type === 'regenerate-key' ? 'Regenerate' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

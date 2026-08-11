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
      className={`fixed bottom-6 right-6 left-6 sm:left-auto z-50 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-slide-up ${
        type === 'success'
          ? 'bg-green-900/90 border-green-500/30 text-green-200'
          : 'bg-red-900/90 border-red-500/30 text-red-200'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100">
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
    if (!endDate) return { text: '-', color: 'text-white/70' };
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
// PACKAGE CARD (mobile)
// ============================================================

function PackageCard({
  pkg,
  visibleKeys,
  copiedKey,
  onToggleKey,
  onCopy,
  onDelete,
  actionLoading,
}: {
  pkg: PackageItem;
  visibleKeys: Set<string>;
  copiedKey: string | null;
  onToggleKey: (id: string) => void;
  onCopy: (text: string, id: string) => void;
  onDelete: (pkg: PackageItem) => void;
  actionLoading: string | null;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{pkg.planName}</p>
          <p className="text-white/50 text-xs mt-0.5">ID: {pkg.id.slice(-8)}</p>
        </div>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
            pkg.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : pkg.status === 'expired'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}
        >
          {pkg.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-white/50 text-xs block">Customer</span>
          <span className="text-white truncate block">{pkg.customerEmail || '-'}</span>
        </div>
        <div>
          <span className="text-white/50 text-xs block">Credits</span>
          <span className="text-white font-medium">{pkg.credits.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-white/50 text-xs block">Expiry</span>
          <CountdownTimer endDate={pkg.endDate || pkg.expiresAt || ''} />
        </div>
      </div>

      {/* Key row */}
      {pkg.key && (
        <div className="flex items-center gap-2">
          <code className="text-[11px] bg-black/30 px-2 py-1 rounded font-mono text-white/80 truncate max-w-[180px]">
            {visibleKeys.has(pkg.id) ? pkg.key : `${pkg.key.slice(0, 12)}${'.'.repeat(14)}`}
          </code>
          <button
            onClick={() => onToggleKey(pkg.id)}
            className="p-1 text-white/50 hover:text-white/80 transition-colors"
          >
            {visibleKeys.has(pkg.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onCopy(pkg.key!, pkg.id)}
            className="p-1 text-white/50 hover:text-white/80 transition-colors"
          >
            {copiedKey === pkg.id ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Delete */}
      <div className="flex justify-end pt-1 border-t border-white/5">
        <button
          onClick={() => onDelete(pkg)}
          disabled={actionLoading === `delete-pkg-${pkg.id}`}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
        >
          {actionLoading === `delete-pkg-${pkg.id}` ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// API KEY CARD (mobile)
// ============================================================

function ApiKeyCard({
  keyItem,
  visibleKeys,
  copiedKey,
  onToggleKey,
  onCopy,
  onRegenerate,
  onDelete,
  actionLoading,
}: {
  keyItem: ApiKey;
  visibleKeys: Set<string>;
  copiedKey: string | null;
  onToggleKey: (id: string) => void;
  onCopy: (text: string, id: string) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: string | null;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{keyItem.name}</p>
          <p className="text-white/50 text-xs mt-0.5">
            Created: {new Date(keyItem.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
            keyItem.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {keyItem.status}
        </span>
      </div>

      {/* Key */}
      <div className="flex items-center gap-2">
        <code className="text-[11px] bg-black/30 px-2 py-1 rounded font-mono text-white/80 truncate max-w-[200px]">
          {visibleKeys.has(keyItem.id)
            ? keyItem.key
            : `${keyItem.key.slice(0, 12)}${'.'.repeat(14)}`}
        </code>
        <button
          onClick={() => onToggleKey(keyItem.id)}
          className="p-1 text-white/50 hover:text-white/80 transition-colors"
        >
          {visibleKeys.has(keyItem.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onCopy(keyItem.key, keyItem.id)}
          className="p-1 text-white/50 hover:text-white/80 transition-colors"
        >
          {copiedKey === keyItem.id ? (
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onRegenerate(keyItem.id)}
          disabled={actionLoading === `regenerate-${keyItem.id}`}
          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all disabled:opacity-50"
        >
          {actionLoading === `regenerate-${keyItem.id}` ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(keyItem.id)}
          disabled={actionLoading === `delete-key-${keyItem.id}`}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
        >
          {actionLoading === `delete-key-${keyItem.id}` ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminCaptchaMasterPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'packages' | 'api-keys' | 'settings'>('stats');
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
  // Discount settings state
  const [discountPercent, setDiscountPercent] = useState(20);
  const [discountEnabled, setDiscountEnabled] = useState(true);
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);

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

  // ============================================================
  // DISCOUNT SETTINGS
  // ============================================================

  const fetchCaptchaSettings = useCallback(async () => {
    setDiscountLoading(true);
    try {
      const res = await api.get('/admin/captchamaster/settings');
      if (res.data.success) {
        setDiscountPercent(res.data.data.discountPercent ?? 20);
        setDiscountEnabled(res.data.data.discountEnabled ?? true);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load discount settings', 'error');
    } finally {
      setDiscountLoading(false);
    }
  }, [showToast]);

  const saveCaptchaSettings = useCallback(async () => {
    setDiscountSaving(true);
    try {
      const res = await api.put('/admin/captchamaster/settings', {
        discountPercent,
        discountEnabled,
      });
      if (res.data.success) {
        showToast('Discount settings saved successfully', 'success');
        setDiscountPercent(res.data.data.discountPercent ?? discountPercent);
        setDiscountEnabled(res.data.data.discountEnabled ?? discountEnabled);
      } else throw new Error(res.data.error);
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setDiscountSaving(false);
    }
  }, [discountPercent, discountEnabled, showToast]);

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
    fetchCaptchaSettings();
  }, [fetchStats, fetchPackages, fetchApiKeys, fetchCaptchaSettings]);

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
          <p className="text-white/60 text-sm">Loading CaptchaMaster dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load dashboard</p>
          <p className="text-white/50 text-sm mb-4">{error}</p>
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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CaptchaMaster</h1>
          <p className="text-white/50 text-sm mt-1">Manage CaptchaMaster integration</p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchPackages(); fetchApiKeys(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-all border border-white/10 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Tabs — equal width, fits mobile & desktop */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
        {[
          { id: 'stats', label: 'Stats', icon: BarChart3 },
          { id: 'packages', label: 'Packages', icon: Package },
          { id: 'api-keys', label: 'API Keys', icon: Key },
          { id: 'settings', label: 'Settings', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setPackagesPage(1); }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-1 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-w-0 ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* STATS TAB */}
      {/* ============================================================ */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="relative group bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 p-4 sm:p-5 hover:border-white/20 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
                <card.icon className="w-full h-full" />
              </div>
              <div className="relative z-10">
                <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-2 sm:mb-3`}>
                  <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.text}`} />
                </div>
                <p className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider mb-1">{card.title}</p>
                <p className="text-lg sm:text-xl font-bold text-white">{card.value}</p>
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
          <div className="p-3 sm:p-4 border-b border-white/10">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search by plan name or customer email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPackagesPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Mobile: Card list */}
          <div className="p-3 sm:hidden">
            {paginatedPackages.length === 0 ? (
              <div className="py-12 text-center text-white/40">
                {searchQuery ? 'No packages match your search.' : 'No packages found.'}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    visibleKeys={visibleKeys}
                    copiedKey={copiedKey}
                    onToggleKey={toggleKeyVisibility}
                    onCopy={copyToClipboard}
                    onDelete={(p) =>
                      setConfirmAction({ type: 'delete-package', id: p.id, label: p.planName })
                    }
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Key</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Credits</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Expiry</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-white/40">
                      {searchQuery ? 'No packages match your search.' : 'No packages found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium text-sm">{pkg.planName}</p>
                        <p className="text-white/40 text-xs">ID: {pkg.id.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/80 text-sm">{pkg.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {pkg.key ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono text-white/80">
                              {visibleKeys.has(pkg.id)
                                ? pkg.key
                                : `${pkg.key.slice(0, 12)}${'.'.repeat(20)}`}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(pkg.id)}
                              className="p-1 text-white/40 hover:text-white/80 transition-colors"
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
                              className="p-1 text-white/40 hover:text-white/80 transition-colors"
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
                          <span className="text-white/30 text-xs">-</span>
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
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-white/10">
              <p className="text-sm text-white/40">
                Page {packagesPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPackagesPage((p) => Math.max(1, p - 1))}
                  disabled={packagesPage === 1}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPackagesPage((p) => Math.min(totalPages, p + 1))}
                  disabled={packagesPage === totalPages}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

          {/* Mobile: Card list */}
          <div className="sm:hidden">
            {apiKeys.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 p-12 text-center text-white/40">
                No API keys found. Create one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <ApiKeyCard
                    key={key.id}
                    keyItem={key}
                    visibleKeys={visibleKeys}
                    copiedKey={copiedKey}
                    onToggleKey={toggleKeyVisibility}
                    onCopy={copyToClipboard}
                    onRegenerate={(id) =>
                      setConfirmAction({ type: 'regenerate-key', id, label: key.name })
                    }
                    onDelete={(id) =>
                      setConfirmAction({ type: 'delete-key', id, label: key.name })
                    }
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Table */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 overflow-hidden hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Key</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-white/40">
                        No API keys found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium text-sm">{key.name}</p>
                          <p className="text-white/40 text-xs">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-black/30 px-2 py-1 rounded font-mono text-white/80">
                              {visibleKeys.has(key.id)
                                ? key.key
                                : `${key.key.slice(0, 12)}${'.'.repeat(20)}`}
                            </code>
                            <button
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="p-1 text-white/40 hover:text-white/80 transition-colors"
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
                              className="p-1 text-white/40 hover:text-white/80 transition-colors"
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
      {/* SETTINGS TAB — Discount Management */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <div className="max-w-lg">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-white/10 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white mb-1">Discount Settings</h2>
            <p className="text-white/50 text-sm mb-6">
              Configure the automatic discount applied to Captcha Solver Api plans. Changes apply to new cart items immediately.
            </p>

            {discountLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* Enable toggle */}
                <div className="flex items-center justify-between py-3 border-b border-white/10 mb-5">
                  <div>
                    <p className="text-white font-medium text-sm">Enable Discount</p>
                    <p className="text-white/40 text-xs mt-0.5">Turn the automatic discount on or off</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDiscountEnabled((prev) => !prev)}
                    className={`relative w-12 h-6 rounded-full transition-all ${discountEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${discountEnabled ? 'left-6' : 'left-0.5'}`}
                    />
                  </button>
                </div>

                {/* Discount percent */}
                <div className="mb-6">
                  <label className="block text-white font-medium text-sm mb-2">Discount Percentage</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      disabled={!discountEnabled}
                      className="w-24 sm:w-28 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                    />
                    <span className="text-white/40 text-sm">%</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${discountEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}
                        style={{ width: `${discountPercent}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    Product price will be reduced by {discountPercent}% for captcha packages.
                  </p>
                </div>

                {/* Save button */}
                <button
                  onClick={saveCaptchaSettings}
                  disabled={discountSaving}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {discountSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE API KEY MODAL */}
      {/* ============================================================ */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white mb-4">Create API Key</h2>
            <input
              type="text"
              placeholder="Enter key name..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateApiKey()}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 mb-4"
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
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-5 sm:p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-red-500/20 rounded-full mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Confirm Action</h2>
              <p className="text-white/60 text-sm px-2">
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

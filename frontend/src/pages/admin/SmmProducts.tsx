import { useState, useEffect, useCallback } from 'react';
import {
  Globe, RefreshCw, AlertTriangle, CheckCircle,
  XCircle, Loader2, Search, DollarSign, Filter,
  Download, Clock, Key, Save, Trash2,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import api from '../../lib/axios';

// ── Types ────────────────────────────────────────────────────────────

interface SmmSettingsData {
  markupPercent: number;
  lastSyncAt: string | null;
  lastSyncCount: number;
  syncStatus: string;
  lastErrorMessage: string;
  defaultCategory: string;
  apiKey: string;
  autoSyncEnabled: boolean;
  categoryOverrides: Record<string, string>;
  enabledCategories: string[];
  categoryOrderFields?: Record<string, any[]>;
}

interface ApiCategory {
  name: string;
  serviceCount: number;
  syncedCount: number;
  enabled: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString() : '—';

const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ── Toast ────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl transition-all animate-slide-down',
      type === 'success'
        ? 'bg-green-900/80 border-green-500/30 text-green-200'
        : 'bg-red-900/80 border-red-500/30 text-red-200',
    )}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function SmmProducts() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [settings, setSettings] = useState<SmmSettingsData | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [totalServices, setTotalServices] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fetchingPlatforms, setFetchingPlatforms] = useState(false);

  // Settings form state
  const [formMarkup, setFormMarkup] = useState(20);
  const [formApiKey, setFormApiKey] = useState('');
  const [formDefaultCategory, setFormDefaultCategory] = useState('Social Media');
  const [formOverrides, setFormOverrides] = useState<Array<{ from: string; to: string }>>([]);
  const [formEnabledCategories, setFormEnabledCategories] = useState<string[]>([]);
  const [platformImages, setPlatformImages] = useState<Record<string, string>>({});
  const [categoryOrderFields, setCategoryOrderFields] = useState<Record<string, any[]>>({});
  const [expandedOrderFields, setExpandedOrderFields] = useState<Record<string, boolean>>({});

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // ── Data Fetching ──────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [servicesRes, settingsRes] = await Promise.all([
        api.get('/admin/smm/services'),
        api.get('/admin/smm/settings'),
      ]);

      if (servicesRes.data.success) {
        setCategories(servicesRes.data.data.categories || []);
        setBalance(servicesRes.data.data.balance);
        setTotalServices(servicesRes.data.data.total || 0);
        setSyncedCount(servicesRes.data.data.synced || 0);
      } else {
        throw new Error(servicesRes.data.error);
      }

      if (settingsRes.data.success) {
        setSettings(settingsRes.data.data);
        setFormMarkup(settingsRes.data.data.markupPercent ?? 20);
        // apiKey from DB is no longer used — only env var ONESERVICEBD_API_KEY
        setFormApiKey(settingsRes.data.data.apiKey || '');
        setFormDefaultCategory(settingsRes.data.data.defaultCategory || 'Social Media');
        const ov = settingsRes.data.data.categoryOverrides || {};
        setFormOverrides(Object.entries(ov).map(([k, v]) => ({ from: k, to: v as string })));
        setFormEnabledCategories(settingsRes.data.data.enabledCategories || ['Facebook', 'YouTube', 'Free Fire', 'TikTok']);
        setPlatformImages(settingsRes.data.data.platformImages || {});
        setCategoryOrderFields(settingsRes.data.data.categoryOrderFields || {});
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Sync Action ────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/admin/smm/sync', {});
      if (res.data.success) {
        showToast(res.data.message, 'success');
        await fetchData();
      } else {
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // ── Per-Platform Sync ─────────────────────────────────────────────

  const handlePlatformSync = async (platform: string) => {
    setSyncingPlatform(platform);
    // Snapshot UI form state so fetchData() can't wipe toggles/images/orderFields
    const snapEnabled = formEnabledCategories;
    const snapImages = platformImages;
    const snapOrderFields = categoryOrderFields;
    try {
      const res = await api.post('/admin/smm/sync', { platform });
      if (res.data.success) {
        showToast(`"${platform}" synced successfully — ${res.data.data.synced} services`, 'success');
        await fetchData();
        // Restore toggles, image URLs, orderFields — fetchData() would have overwritten them
        setFormEnabledCategories(snapEnabled);
        setPlatformImages(snapImages);
        setCategoryOrderFields(snapOrderFields);
      } else {
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      showToast(err.message || `Failed to sync ${platform}`, 'error');
    } finally {
      setSyncingPlatform(null);
    }
  };

  // ── Fetch Platforms (no sync, just names) ─────────────────────────

  const handleFetchPlatforms = async () => {
    setFetchingPlatforms(true);
    try {
      const res = await api.post('/admin/smm/fetch-platforms');
      if (res.data.success) {
        showToast(res.data.message, 'success');
        // Use API response directly — don't call fetchData() which re-populates stale settings
        setCategories(res.data.data.categories || []);
        setTotalServices(res.data.data.total || 0);
        setSyncedCount(0);
      } else {
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch platforms', 'error');
    } finally {
      setFetchingPlatforms(false);
    }
  };

  // ── Settings Save ──────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const overrides: Record<string, string> = {};
      formOverrides.forEach((o) => {
        if (o.from.trim()) overrides[o.from.trim()] = o.to.trim();
      });

      const res = await api.put('/admin/smm/settings', {
        markupPercent: formMarkup,
        defaultCategory: formDefaultCategory,
        categoryOverrides: overrides,
        enabledCategories: formEnabledCategories,
        platformImages,
        categoryOrderFields,
      });
      if (res.data.success) {
        showToast('Settings saved successfully', 'success');
        await fetchData();
      } else {
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Delete All Synced Products ──────────────────────────────────────

  const handleDeleteAll = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);
    try {
      const res = await api.delete('/admin/smm/products');
      if (res.data.success) {
        // Clear form state immediately so stale data doesn't linger
        setFormEnabledCategories([]);
        setPlatformImages({});
        setFormOverrides([]);
        setCategories([]);
        setTotalServices(0);
        setSyncedCount(0);
        showToast(res.data.message || 'All SMM products deleted', 'success');
        await fetchData();
      } else {
        throw new Error(res.data.error);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete SMM products', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading SMM platforms...</p>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────

  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Failed to Load SMM Services</h3>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete All Synced Products?</h3>
                <p className="text-sm text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 transition-all text-sm font-semibold shadow-lg shadow-red-500/20"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">SMM Platforms</h2>
          <p className="text-gray-400 text-sm mt-1">
            Enable/disable SMM platforms. Enabled platforms appear as categories on the main shop with all their services.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10"
          >
            <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Stats Overview ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-blue-500 to-cyan-500" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{totalServices}</p>
            <p className="text-xs text-gray-500 mt-1">Total Services</p>
          </div>
        </div>
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-green-500 to-emerald-500" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{syncedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Synced</p>
          </div>
        </div>
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{balance !== null ? `$${balance}` : '---'}</p>
            <p className="text-xs text-gray-500 mt-1">Balance</p>
          </div>
        </div>
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-indigo-500 to-violet-500" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-bold text-white">{settings?.lastSyncAt ? formatDate(settings.lastSyncAt) : '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Last Sync</p>
          </div>
        </div>
      </div>

      {/* ── Save + Sync Buttons ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Sync All Enabled Platforms
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          {savingSettings ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Settings
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Delete All Synced
        </button>
      </div>

      {/* ── Sync Status ────────────────────────────────────────────── */}
      {settings?.syncStatus === 'syncing' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-sm">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Syncing services from oneservicebd.com...
        </div>
      )}
      {settings?.syncStatus === 'error' && settings?.lastErrorMessage && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{settings.lastErrorMessage}</span>
        </div>
      )}

      {/* ── Platform Toggles ───────────────────────────────────────── */}
      <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Platforms</h3>
            <p className="text-sm text-gray-400">Toggle ON to show a platform on the main shop</p>
          </div>
        </div>

        {categories.length === 0 ? (
          /* No platforms yet — show fetch button */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-base font-semibold text-gray-300 mb-2">No Platforms Loaded</h4>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Delete removes everything. Click below to fetch available platforms from oneservicebd.com, then sync services for each platform.
            </p>
            <button
              onClick={handleFetchPlatforms}
              disabled={fetchingPlatforms}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {fetchingPlatforms ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Fetch Platforms from API
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search platforms..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories
              .filter((cat) => {
                const q = categorySearch.toLowerCase();
                return !q || cat.name.toLowerCase().includes(q);
              })
              .sort((a, b) => {
                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((cat) => {
                const isEnabled = formEnabledCategories.includes(cat.name);
                const imgUrl = platformImages[cat.name] || '';
                return (
                  <div
                    key={cat.name}
                    className={cn(
                      'flex flex-col p-4 rounded-xl border cursor-pointer transition-all',
                      isEnabled
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
                        : 'bg-white/[0.03] border-white/5 hover:border-white/20',
                    )}
                  >
                    {/* Top row: platform name + toggle */}
                    <div
                      className="flex items-center justify-between"
                      onClick={() => {
                        setFormEnabledCategories((prev) =>
                          isEnabled
                            ? prev.filter((c) => c !== cat.name)
                            : [...prev, cat.name]
                        );
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={cat.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement)?.style.removeProperty('display');
                            }}
                          />
                        ) : null}
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all shrink-0',
                          imgUrl && 'hidden',
                          isEnabled
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-white/5 text-gray-500',
                        )}>
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className={cn(
                            'text-base font-semibold truncate block',
                            isEnabled ? 'text-white' : 'text-gray-400',
                          )}>
                            {cat.name}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cat.syncedCount}/{cat.serviceCount} services
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        'relative w-12 h-7 rounded-full transition-all duration-200 shrink-0',
                        isEnabled ? 'bg-green-500' : 'bg-white/10',
                      )}>
                        <div className={cn(
                          'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-200',
                          isEnabled ? 'left-[22px]' : 'left-0.5',
                        )} />
                      </div>
                    </div>

                    {/* Image URL input (only when enabled) */}
                    {isEnabled && (
                      <div className="mt-3 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                        <label className="text-xs text-gray-400 mb-1.5 block">Product Image URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={imgUrl}
                            onChange={(e) => {
                              setPlatformImages((prev) => ({
                                ...prev,
                                [cat.name]: e.target.value,
                              }));
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                          />
                          {imgUrl && (
                            <button
                              onClick={() => {
                                setPlatformImages((prev) => {
                                  const next = { ...prev };
                                  delete next[cat.name];
                                  return next;
                                });
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {imgUrl && (
                          <div className="flex items-center gap-2 mt-2">
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-8 h-8 rounded object-cover border border-white/10"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).classList.add('opacity-30');
                              }}
                            />
                            <span className="text-[10px] text-gray-500 truncate">Preview</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Fields Editor */}
                    {isEnabled && (
                      <div className="mt-3 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedOrderFields((prev) => ({ ...prev, [cat.name]: !prev[cat.name] }));
                          }}
                          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {expandedOrderFields[cat.name] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Custom Order Fields {categoryOrderFields[cat.name]?.length ? `(${categoryOrderFields[cat.name].length})` : ''}
                        </button>
                        {expandedOrderFields[cat.name] && (
                          <div className="mt-2">
                            <textarea
                              value={JSON.stringify(categoryOrderFields[cat.name] || [], null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  if (Array.isArray(parsed)) {
                                    setCategoryOrderFields((prev) => ({ ...prev, [cat.name]: parsed }));
                                    (e.currentTarget as HTMLImageElement).style.borderColor = 'rgba(34,197,94,0.5)';
                                  }
                                } catch {
                                  (e.currentTarget as HTMLImageElement).style.borderColor = 'rgba(239,68,68,0.5)';
                                }
                              }}
                              rows={6}
                              placeholder='[{"key":"link","label":"Target Link","type":"url","required":true}]'
                              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-gray-300 text-xs font-mono placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              Define dynamic order fields in JSON array format. Sync to apply changes to products.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sync button — always visible */}
                    <div className="mt-auto pt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlatformSync(cat.name);
                        }}
                        disabled={syncingPlatform === cat.name}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500/80 to-green-500/80 text-white rounded-lg hover:from-emerald-500 hover:to-green-500 transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/20"
                      >
                        {syncingPlatform === cat.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Sync {cat.name} Services
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>

      {/* ── Markup & API Key (collapsible) ──────────────────────────── */}
      <details className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden group">
        <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Advanced Settings</h3>
              <p className="text-sm text-gray-400">Markup, API key, and category overrides</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
        </summary>

        <div className="px-6 pb-6 space-y-6 border-t border-white/10 pt-6">
          {/* Markup */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Pricing Markup</h4>
                <p className="text-xs text-gray-400">Percentage added on top of API rates</p>
              </div>
              <span className="text-2xl font-bold text-white">{formMarkup}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              value={formMarkup}
              onChange={(e) => setFormMarkup(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-semibold text-white">API Key</h4>
            </div>
            <input
              type="text"
              value={formApiKey}
              readOnly
              placeholder="Set ONESERVICEBD_API_KEY in .env"
              title="API key is configured via ONESERVICEBD_API_KEY environment variable"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm placeholder:text-gray-500 font-mono cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              API key is read from <code className="text-purple-400 bg-white/5 px-1 rounded">ONESERVICEBD_API_KEY</code> environment variable only.
            </p>
          </div>

          {/* Default Category */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Default Category</h4>
            <input
              type="text"
              value={formDefaultCategory}
              onChange={(e) => setFormDefaultCategory(e.target.value)}
              placeholder="Social Media"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Category Overrides */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Category Overrides</h4>
            <div className="space-y-2">
              {formOverrides.map((ov, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ov.from}
                    onChange={(e) => {
                      const next = [...formOverrides];
                      next[i] = { ...next[i], from: e.target.value };
                      setFormOverrides(next);
                    }}
                    placeholder="Type|Category"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 font-mono"
                  />
                  <span className="text-gray-500 text-xs">→</span>
                  <input
                    type="text"
                    value={ov.to}
                    onChange={(e) => {
                      const next = [...formOverrides];
                      next[i] = { ...next[i], to: e.target.value };
                      setFormOverrides(next);
                    }}
                    placeholder="Local category"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => setFormOverrides(formOverrides.filter((_, j) => j !== i))}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setFormOverrides([...formOverrides, { from: '', to: '' }])}
              className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
            >
              + Add Override
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

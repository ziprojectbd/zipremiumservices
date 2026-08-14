import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const IconSave = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const IconX = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconCrypto = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);

interface CryptoPayment {
  id: string;
  currency: string;
  payType: 'network' | 'uid';
  network?: string;
  platform?: string;
  address?: string;
  uid?: string;
  exchangeUid?: string;
  notes?: string;
  enabled: boolean;
}

export default function PaymentManagement() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cryptoPayments, setCryptoPayments] = useState<CryptoPayment[]>([]);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<CryptoPayment | null>(null);
  const [cryptoFormData, setCryptoFormData] = useState<{ currency: string; payType: 'network' | 'uid'; network: string; platform: string; address: string; uid: string; exchangeUid: string; notes: string }>({ currency: 'USDT', payType: 'network', network: 'TRC20', platform: 'Binance', address: '', uid: '', exchangeUid: '', notes: '' });
  const [customCurrencies, setCustomCurrencies] = useState<string[]>([]);
  const [customNetworks, setCustomNetworks] = useState<string[]>([]);
  const [customPlatforms, setCustomPlatforms] = useState<string[]>([]);
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newCustomValue, setNewCustomValue] = useState('');
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const [settings, setSettings] = useState({
    minOrderAmount: '',
    maxOrderAmount: '',
    defaultCurrency: 'BDT',
    exchangeRate: 110,
  });

  const ensureUniqueIds = <T extends { id?: string }>(items: T[]): T[] => {
    const idCount: Record<string, number> = {};
    return items.map(item => {
      const originalId = item.id || '';
      if (!originalId) {
        return { ...item, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
      }
      idCount[originalId] = (idCount[originalId] || 0) + 1;
      if (idCount[originalId] > 1) {
        return { ...item, id: `${originalId}-${idCount[originalId]}` };
      }
      return item;
    });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/payment-settings');
        if (res.data.success && res.data.data) {
          setCryptoPayments(ensureUniqueIds(res.data.data.cryptoPayments || []));
          setCustomCurrencies(res.data.data.customCurrencies || []);
          setCustomNetworks(res.data.data.customNetworks || []);
          setCustomPlatforms(res.data.data.customPlatforms || []);
          setSettings(prev => ({
            ...prev,
            minOrderAmount: res.data.data.minOrderAmount || '',
            maxOrderAmount: res.data.data.maxOrderAmount || '',
            exchangeRate: res.data.data.exchangeRate || 110,
          }));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.post('/payment-settings', {
        minOrderAmount: settings.minOrderAmount,
        maxOrderAmount: settings.maxOrderAmount,
        exchangeRate: settings.exchangeRate,
        cryptoPayments,
        customCurrencies,
        customNetworks,
        customPlatforms,
      });
      if (res.data.success) {
        setSaved(true);
        setAlertConfig({ isOpen: true, type: 'success', title: 'Success', message: 'Settings saved successfully!' });
        setTimeout(() => setSaved(false), 2000);
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to save settings. Please try again.' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Error saving settings. Please try again.' });
    }
  };

  const handleAddCrypto = () => {
    setEditingCrypto(null);
    setCryptoFormData({ currency: 'USDT', payType: 'network', network: 'TRC20', platform: 'Binance', address: '', uid: '', exchangeUid: '', notes: '' });
    setShowCryptoModal(true);
  };

  const handleEditCrypto = (crypto: CryptoPayment) => {
    setEditingCrypto(crypto);
    setCryptoFormData({
      currency: crypto.currency,
      payType: crypto.payType,
      network: crypto.network || 'TRC20',
      platform: crypto.platform || 'Binance',
      address: crypto.address || '',
      uid: crypto.uid || '',
      exchangeUid: crypto.exchangeUid || '',
      notes: crypto.notes || ''
    });
    setShowCryptoModal(true);
  };

  const handleDeleteCrypto = (id: string) => {
    setCryptoPayments(prev => prev.filter(p => String(p.id) !== String(id)));
  };

  const handleToggleCryptoEnabled = (id: string) => {
    setCryptoPayments(prev => prev.map(p =>
      String(p.id) === String(id) ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleCryptoSubmit = () => {
    if (!cryptoFormData.currency) return;

    const isDuplicate = cryptoPayments.some(p =>
      p.currency.toLowerCase() === cryptoFormData.currency.toLowerCase() &&
      p.payType === cryptoFormData.payType &&
      (p.payType === 'network' ? p.network === cryptoFormData.network : p.platform === cryptoFormData.platform) &&
      p.id !== editingCrypto?.id
    );

    if (isDuplicate) {
      setAlertConfig({ isOpen: true, type: 'warning', title: 'Duplicate', message: 'A crypto payment with this currency, pay type, and network/platform already exists!' });
      return;
    }

    if (editingCrypto) {
      setCryptoPayments(prev => prev.map(p =>
        String(p.id) === String(editingCrypto.id)
          ? {
              ...p,
              currency: cryptoFormData.currency,
              payType: cryptoFormData.payType,
              network: cryptoFormData.payType === 'network' ? cryptoFormData.network : undefined,
              platform: cryptoFormData.payType === 'uid' ? cryptoFormData.platform : undefined,
              address: cryptoFormData.payType === 'network' ? cryptoFormData.address : undefined,
              uid: cryptoFormData.payType === 'uid' ? cryptoFormData.uid : undefined,
              exchangeUid: cryptoFormData.payType === 'uid' ? cryptoFormData.exchangeUid : undefined,
              notes: cryptoFormData.notes,
            }
          : p
      ));
    } else {
      const newCrypto: CryptoPayment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        currency: cryptoFormData.currency,
        payType: cryptoFormData.payType,
        network: cryptoFormData.payType === 'network' ? cryptoFormData.network : undefined,
        platform: cryptoFormData.payType === 'uid' ? cryptoFormData.platform : undefined,
        address: cryptoFormData.payType === 'network' ? cryptoFormData.address : undefined,
        uid: cryptoFormData.payType === 'uid' ? cryptoFormData.uid : undefined,
        exchangeUid: cryptoFormData.payType === 'uid' ? cryptoFormData.exchangeUid : undefined,
        notes: cryptoFormData.notes,
        enabled: true,
      };
      setCryptoPayments(prev => [...prev, newCrypto]);
    }
    setShowCryptoModal(false);
  };

  const handleAddCustomCurrency = () => {
    if (newCustomValue && !customCurrencies.includes(newCustomValue)) {
      setCustomCurrencies([...customCurrencies, newCustomValue]);
      setCryptoFormData(prev => ({ ...prev, currency: newCustomValue }));
    }
    setNewCustomValue('');
    setShowAddCurrency(false);
  };

  const handleAddCustomNetwork = () => {
    if (newCustomValue && !customNetworks.includes(newCustomValue)) {
      setCustomNetworks([...customNetworks, newCustomValue]);
      setCryptoFormData(prev => ({ ...prev, network: newCustomValue }));
    }
    setNewCustomValue('');
    setShowAddNetwork(false);
  };

  const handleAddCustomPlatform = () => {
    if (newCustomValue && !customPlatforms.includes(newCustomValue)) {
      setCustomPlatforms([...customPlatforms, newCustomValue]);
      setCryptoFormData(prev => ({ ...prev, platform: newCustomValue }));
    }
    setNewCustomValue('');
    setShowAddPlatform(false);
  };

  const handleDeleteCustomCurrency = (value: string) => {
    setCustomCurrencies(prev => prev.filter(c => c !== value));
  };

  const handleDeleteCustomNetwork = (value: string) => {
    setCustomNetworks(prev => prev.filter(n => n !== value));
  };

  const handleDeleteCustomPlatform = (value: string) => {
    setCustomPlatforms(prev => prev.filter(p => p !== value));
  };

  const ToggleSwitch = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`relative inline-flex h-7 w-[52px] items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${enabled ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gray-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'translate-x-[29px]' : 'translate-x-1'}`} />
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {alertConfig && <EnhancedAlert {...alertConfig} onClose={() => setAlertConfig(null)} />}
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 via-gray-900/80 to-cyan-900/40 border border-white/10 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/settings"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white hover:bg-white/20 hover:border-white/30 transition-all backdrop-blur-sm"
            >
              <IconArrowLeft />
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Checkout Management</h2>
              <p className="text-sm text-gray-400 mt-1">Configure your checkout settings and payment options</p>
            </div>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-500/20 border border-green-400/30 text-green-300 shadow-lg shadow-green-500/20 animate-fade-in">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              Changes saved
            </span>
          )}
        </div>
      </div>

      {/* Order Limits */}
      <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <h3 className="text-base font-bold text-white mb-5">Order Limits</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Minimum Order Amount</label>
            <input
              type="number"
              value={settings.minOrderAmount}
              onChange={(e) => setSettings(prev => ({ ...prev, minOrderAmount: e.target.value }))}
              placeholder="0"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Maximum Order Amount</label>
            <input
              type="number"
              value={settings.maxOrderAmount}
              onChange={(e) => setSettings(prev => ({ ...prev, maxOrderAmount: e.target.value }))}
              placeholder="No limit"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">BDT to USD Rate</label>
            <input
              type="number"
              step="0.01"
              value={settings.exchangeRate}
              onChange={(e) => setSettings(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 110 }))}
              placeholder="110"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
            />
            <p className="text-[10px] text-gray-500 mt-1">1 USD = {settings.exchangeRate} BDT</p>
          </div>
        </div>
      </div>

      {/* Pay Crypto Settings */}
      <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <IconCrypto />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pay Crypto</h3>
              <p className="text-xs text-gray-500">Configure cryptocurrency payment settings</p>
            </div>
          </div>
          <button
            onClick={handleAddCrypto}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
          >
            <IconPlus />
            Add New
          </button>
        </div>

        {/* Network Payments Table */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-white mb-3">Pay via Network</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Currency</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Network</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Wallet Address</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Notes</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cryptoPayments.filter(c => c.payType === 'network').map((crypto) => (
                  <tr key={crypto.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-4 px-4">
                      <span className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 text-sm font-medium">
                        {crypto.currency}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white text-sm">{crypto.network}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 text-sm font-mono truncate max-w-[200px] block">
                        {crypto.address}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ToggleSwitch
                        enabled={crypto.enabled}
                        onClick={() => handleToggleCryptoEnabled(crypto.id)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 text-sm">{crypto.notes || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditCrypto(crypto)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCrypto(crypto.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cryptoPayments.filter(c => c.payType === 'network').length === 0 && (
                  <tr key="empty-network">
                    <td colSpan={6} className="py-6 text-center text-gray-500 text-sm">
                      No network payments added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* UID Payments Table */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Pay via UID</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Currency</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Platform</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Exchange UID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Notes</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cryptoPayments.filter(c => c.payType === 'uid').map((crypto) => (
                  <tr key={crypto.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-4 px-4">
                      <span className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 text-sm font-medium">
                        {crypto.currency}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white text-sm">{crypto.platform}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 text-sm font-mono truncate max-w-[200px] block">
                        {crypto.exchangeUid || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ToggleSwitch
                        enabled={crypto.enabled}
                        onClick={() => handleToggleCryptoEnabled(crypto.id)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 text-sm">{crypto.notes || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditCrypto(crypto)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCrypto(crypto.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cryptoPayments.filter(c => c.payType === 'uid').length === 0 && (
                  <tr key="empty-uid">
                    <td colSpan={6} className="py-6 text-center text-gray-500 text-sm">
                      No UID payments added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200">
          Discard
        </button>
        <button
          onClick={handleSave}
          className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white overflow-hidden transition-all duration-300 shadow-lg shadow-blue-900/30 hover:shadow-blue-700/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 group-hover:from-blue-500 group-hover:to-cyan-500" />
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="relative flex items-center gap-2">
            <IconSave />
            Save Changes
          </span>
        </button>
      </div>

      {/* Crypto Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCryptoModal(false)} />
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingCrypto ? 'Edit Crypto Payment' : 'Add Crypto Payment'}
              </h3>
              <button
                onClick={() => setShowCryptoModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <IconX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Currency
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCurrency(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    + Add New
                  </button>
                </div>
                {showAddCurrency ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomValue}
                      onChange={(e) => setNewCustomValue(e.target.value.toUpperCase())}
                      placeholder="Enter currency"
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCurrency}
                      className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm hover:bg-blue-500/30"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCurrency(false); setNewCustomValue(''); }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={cryptoFormData.currency}
                      onChange={(e) => setCryptoFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm appearance-none cursor-pointer"
                    >
                      {customCurrencies.length > 0 ? (
                        customCurrencies.map(c => (
                          <option key={c} value={c} className="bg-[#0d0d0d]">{c}</option>
                        ))
                      ) : (
                        <option value="" className="bg-[#0d0d0d]">No currencies added</option>
                      )}
                    </select>
                    {customCurrencies.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCurrency(cryptoFormData.currency)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1"
                        title="Delete currency"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Pay Via
                </label>
                <select
                  value={cryptoFormData.payType}
                  onChange={(e) => setCryptoFormData(prev => ({ ...prev, payType: e.target.value as 'network' | 'uid' }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm appearance-none cursor-pointer"
                >
                  <option value="network" className="bg-[#0d0d0d]">Network</option>
                  <option value="uid" className="bg-[#0d0d0d]">UID</option>
                </select>
              </div>

              {cryptoFormData.payType === 'network' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Network
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddNetwork(true)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add New
                    </button>
                  </div>
                  {showAddNetwork ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomValue}
                        onChange={(e) => setNewCustomValue(e.target.value.toUpperCase())}
                        placeholder="Enter network"
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomNetwork}
                        className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm hover:bg-blue-500/30"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddNetwork(false); setNewCustomValue(''); }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={cryptoFormData.network}
                        onChange={(e) => setCryptoFormData(prev => ({ ...prev, network: e.target.value }))}
                        className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm appearance-none cursor-pointer"
                      >
                        {customNetworks.length > 0 ? (
                          customNetworks.map(n => (
                            <option key={n} value={n} className="bg-[#0d0d0d]">{n}</option>
                          ))
                        ) : (
                          <option value="" className="bg-[#0d0d0d]">No networks added</option>
                        )}
                      </select>
                      {customNetworks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomNetwork(cryptoFormData.network)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1"
                          title="Delete network"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Platform
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddPlatform(true)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add New
                    </button>
                  </div>
                  {showAddPlatform ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomValue}
                        onChange={(e) => setNewCustomValue(e.target.value)}
                        placeholder="Enter platform"
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomPlatform}
                        className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm hover:bg-blue-500/30"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddPlatform(false); setNewCustomValue(''); }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={cryptoFormData.platform}
                        onChange={(e) => setCryptoFormData(prev => ({ ...prev, platform: e.target.value }))}
                        className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm appearance-none cursor-pointer"
                      >
                        {customPlatforms.length > 0 ? (
                          customPlatforms.map(p => (
                            <option key={p} value={p} className="bg-[#0d0d0d]">{p}</option>
                          ))
                        ) : (
                          <option value="" className="bg-[#0d0d0d]">No platforms added</option>
                        )}
                      </select>
                      {customPlatforms.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomPlatform(cryptoFormData.platform)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 p-1"
                          title="Delete platform"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {cryptoFormData.payType === 'network' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={cryptoFormData.address}
                    onChange={(e) => setCryptoFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter wallet address"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    UID
                  </label>
                  <input
                    type="text"
                    value={cryptoFormData.uid}
                    onChange={(e) => setCryptoFormData(prev => ({ ...prev, uid: e.target.value }))}
                    placeholder="Enter platform UID"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm font-mono"
                  />
                </div>
              )}

              {cryptoFormData.payType === 'uid' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Exchange UID
                  </label>
                  <input
                    type="text"
                    value={cryptoFormData.exchangeUid}
                    onChange={(e) => setCryptoFormData(prev => ({ ...prev, exchangeUid: e.target.value }))}
                    placeholder="Enter exchange UID (optional)"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={cryptoFormData.notes}
                  onChange={(e) => setCryptoFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes (optional)"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/50 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCryptoModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCryptoSubmit}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all"
              >
                {editingCrypto ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

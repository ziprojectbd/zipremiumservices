import { useState, useEffect } from "react";
import {
  Save,
  ToggleLeft,
  ToggleRight,
  Settings,
  DollarSign,
  Clock,
  Shield,
  Zap,
  Loader2
} from "lucide-react";
import api from '../../lib/axios';

interface TradeSettings {
  enabled: boolean;
  minimumAmount: number;
  maximumAmount: number;
  processingTime: string;
  supportedTokens: string[];
  autoProcess: boolean;
  requireVerification: boolean;
}

const defaultTradeSettings: TradeSettings = {
  enabled: true,
  minimumAmount: 0.10,
  maximumAmount: 10000,
  processingTime: "Instant",
  supportedTokens: ["USDT", "USDC", "BTC", "ETH"],
  autoProcess: true,
  requireVerification: false,
};

export default function TradeOrders() {
  const [settings, setSettings] = useState<TradeSettings>(defaultTradeSettings);
  const [newToken, setNewToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load settings from API on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/trade/settings');
        if (res.data.success && res.data.data) {
          setSettings(res.data.data);
        }
      } catch {
        // ignore — use defaults
      } finally {
        setLoadingSettings(false);
      }
    })();
  }, []);

  // Save settings to API
  const saveSettings = async (newSettings: TradeSettings) => {
    setSettings(newSettings);
    try {
      await api.put('/admin/trade/settings', newSettings);
    } catch {
      // ignore
    }
  };

  // Toggle trade enabled/disabled
  const toggleTrade = () => {
    saveSettings({
      ...settings,
      enabled: !settings.enabled
    });
  };

  // Add new token
  const addToken = () => {
    if (!newToken.trim()) return;
    if (settings.supportedTokens.includes(newToken.toUpperCase())) return;

    saveSettings({
      ...settings,
      supportedTokens: [...settings.supportedTokens, newToken.toUpperCase()]
    });

    setNewToken('');
  };

  // Remove token
  const removeToken = (token: string) => {
    saveSettings({
      ...settings,
      supportedTokens: settings.supportedTokens.filter(t => t !== token)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/trade/settings', settings);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-gray-400 text-sm">Loading trade settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Trade / P2P Settings
              </h1>
            </div>
            <button
              onClick={toggleTrade}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all ${
                settings.enabled
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {settings.enabled ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  Trade Enabled
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  Trade Disabled
                </>
              )}
            </button>
          </div>
        </div>

        {/* Amount Settings */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Amount Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Amount (USD)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={settings.minimumAmount}
                onChange={(e) => saveSettings({
                  ...settings,
                  minimumAmount: parseFloat(e.target.value) || 0.10
                })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Amount (USD)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={settings.maximumAmount}
                onChange={(e) => saveSettings({
                  ...settings,
                  maximumAmount: parseFloat(e.target.value) || 10000
                })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Processing Settings */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Processing Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Processing Time
              </label>
              <select
                value={settings.processingTime}
                onChange={(e) => saveSettings({
                  ...settings,
                  processingTime: e.target.value
                })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="Instant" className="bg-slate-800">Instant</option>
                <option value="1-5 minutes" className="bg-slate-800">1-5 minutes</option>
                <option value="5-15 minutes" className="bg-slate-800">5-15 minutes</option>
                <option value="15-30 minutes" className="bg-slate-800">15-30 minutes</option>
                <option value="30-60 minutes" className="bg-slate-800">30-60 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Auto Process Requests
                </label>
                <p className="text-xs text-gray-500">
                  Automatically process P2P fee requests
                </p>
              </div>
              <button
                onClick={() => saveSettings({
                  ...settings,
                  autoProcess: !settings.autoProcess
                })}
                className={`p-2 rounded-lg transition-colors ${
                  settings.autoProcess
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {settings.autoProcess ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </h2>

          <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Require Wallet Verification
              </label>
              <p className="text-xs text-gray-500">
                Require users to verify wallet address before processing
              </p>
            </div>
            <button
              onClick={() => saveSettings({
                ...settings,
                requireVerification: !settings.requireVerification
              })}
              className={`p-2 rounded-lg transition-colors ${
                settings.requireVerification
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {settings.requireVerification ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Supported Tokens */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Supported Tokens
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value.toUpperCase())}
              placeholder="Add token (e.g., USDT)"
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={addToken}
              disabled={!newToken.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 transition-all"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.supportedTokens.map((token) => (
              <div
                key={token}
                className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 text-blue-300 rounded-lg border border-blue-500/20"
              >
                <span className="font-semibold">{token}</span>
                <button
                  onClick={() => removeToken(token)}
                  className="text-blue-400 hover:text-blue-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 transition-all shadow-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

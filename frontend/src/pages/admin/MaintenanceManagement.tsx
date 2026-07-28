import { useEffect, useState } from 'react';
import {
  Power,
  Megaphone,
  Layout,
  Sparkles,
  Settings2,
  ChevronLeft,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';

export default function MaintenanceManagement() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState<'marquee' | 'fullscreen'>('marquee');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMaintenanceSettings();
  }, []);

  const fetchMaintenanceSettings = async () => {
    try {
      const res = await api.get(`/public/maintenance?t=${Date.now()}`);
      if (res.data.success) {
        setMaintenanceMode(res.data.data.enabled);
        setMaintenanceType(res.data.data.type || 'marquee');
        setMaintenanceMessage(res.data.data.message || '');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const next = !maintenanceMode;
    await updateMaintenanceSettings(next, maintenanceMessage, maintenanceType);
  };

  const handleTypeChange = async (type: 'marquee' | 'fullscreen') => {
    setMaintenanceType(type);
    await updateMaintenanceSettings(maintenanceMode, maintenanceMessage, type);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const message = e.target.value;
    setMaintenanceMessage(message);
  };

  const saveMessage = async () => {
    await updateMaintenanceSettings(maintenanceMode, maintenanceMessage, maintenanceType);
  };

  const updateMaintenanceSettings = async (enabled: boolean, message: string, type: 'marquee' | 'fullscreen') => {
    try {
      const res = await api.put('/admin/settings/maintenance', { enabled, message, type });
      if (res.data.success) {
        setMaintenanceMode(enabled);
        setMaintenanceType(res.data.data.type);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        await fetchMaintenanceSettings();
      }
    } catch {
      await fetchMaintenanceSettings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/admin/settings"
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
              <Power className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${maintenanceMode ? 'text-red-500' : 'text-emerald-500'}`} />
              Maintenance
            </h1>
            <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">Configure access control</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
          {saved && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-semibold bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 animate-fade-in">
              <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              Synced
            </span>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-8 sm:h-10 w-16 sm:w-20 items-center rounded-full transition-all duration-500 focus:outline-none cursor-pointer shrink-0 ${
              maintenanceMode
                ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <span className={`inline-block h-6 sm:h-8 w-6 sm:w-8 transform rounded-full bg-white shadow-xl transition-all duration-500 ${maintenanceMode ? 'translate-x-[36px] sm:translate-x-[44px]' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Mode Selection */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl space-y-3 sm:space-y-4">
            <h3 className="text-[10px] sm:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-4">Select Mode</h3>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('marquee')}
                disabled={maintenanceMode}
                className={`w-full relative overflow-hidden group p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left ${
                  maintenanceType === 'marquee'
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                } ${maintenanceMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${maintenanceType === 'marquee' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-500'}`}>
                    <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-sm sm:text-base font-bold truncate ${maintenanceType === 'marquee' ? 'text-white' : 'text-gray-400'}`}>Marquee</span>
                    <span className="text-[8px] sm:text-[10px] text-blue-400 font-bold uppercase tracking-widest">Partial Access</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                  Show a scrolling banner at the top. The site remains fully functional.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('fullscreen')}
                disabled={maintenanceMode}
                className={`w-full relative overflow-hidden group p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left ${
                  maintenanceType === 'fullscreen'
                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                } ${maintenanceMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${maintenanceType === 'fullscreen' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-gray-500'}`}>
                    <Layout className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-sm sm:text-base font-bold truncate ${maintenanceType === 'fullscreen' ? 'text-white' : 'text-gray-400'}`}>Full Page</span>
                    <span className="text-[8px] sm:text-[10px] text-purple-400 font-bold uppercase tracking-widest">Global Lockdown</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                  Hides the entire site behind a high-end notice. Only admins can bypass.
                </p>
              </button>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">Admin Bypass</span>
            </div>
            <p className="text-[9px] sm:text-[11px] text-gray-500 leading-relaxed italic">
              When Full Page Mode is active, authenticated administrators still see the actual site content.
            </p>
          </div>
        </div>

        {/* Right Column: Configuration */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-slate-900/50 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

            <div className="relative space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Display Message</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">This text will be shown to your visitors</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/5 border border-white/10 shrink-0">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Live Feed</span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={maintenanceMessage}
                  onChange={handleMessageChange}
                  rows={4}
                  placeholder={maintenanceType === 'marquee'
                    ? "Enter announcement..."
                    : "Enter screen notice..."
                  }
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-black/40 border-2 border-white/5 rounded-xl sm:rounded-[1.5rem] text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all duration-300 resize-none min-h-[120px]"
                />
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 opacity-30 pointer-events-none">
                  <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 max-w-full sm:max-w-sm">
                  <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-[9px] sm:text-[10px] text-gray-500 leading-relaxed font-medium">
                    {maintenanceType === 'marquee'
                      ? 'Tip: The marquee scrolls at the top. Leave empty for default.'
                      : 'Tip: This message becomes hero text on your landing page.'}
                  </p>
                </div>
                <button
                  onClick={saveMessage}
                  disabled={maintenanceMode}
                  className={`px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all duration-300 w-full sm:w-auto text-center ${
                    maintenanceMode
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] border border-white/10'
                  }`}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl relative group">
             <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3 sm:mb-4 flex items-center gap-2">
               <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
               Visual Preview
             </h3>
             <div className="aspect-[16/10] sm:aspect-video w-full rounded-xl sm:rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden">
                {maintenanceType === 'marquee' ? (
                  <div className="absolute top-4 left-0 w-full py-1.5 sm:py-2 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border-y border-purple-500/30 overflow-hidden">
                    <div className="flex whitespace-nowrap animate-marquee px-2 sm:px-4">
                      <span className="text-[8px] sm:text-[10px] font-bold text-white tracking-wider uppercase">{maintenanceMessage || '⚡ SYSTEM MAINTENANCE IN PROGRESS'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-4 sm:p-6 space-y-2 sm:space-y-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 animate-spin" />
                    </div>
                    <h4 className="text-[10px] sm:text-sm font-bold text-white uppercase tracking-tighter">Maintenance Mode</h4>
                    <p className="text-[8px] sm:text-[9px] text-gray-500 max-w-[120px] sm:max-w-[150px] line-clamp-2">{maintenanceMessage || "We'll be back shortly!"}</p>
                  </div>
                )}
                <div className="text-[8px] sm:text-[10px] text-gray-600 font-bold uppercase absolute bottom-2 sm:bottom-4">Simulation</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  CreditCard,
  PanelLeft,
  Layout,
  Power,
  Megaphone,
  ChevronRight,
  Settings2,
  Sparkles,
  Info,
} from 'lucide-react';
import api from '../../lib/axios';

// ── card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 overflow-hidden ${className}`}>
      {/* subtle top-glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      {children}
    </div>
  );
}

// ── section heading ───────────────────────────────────────────────────────────
function SectionHeading({ icon, title, subtitle, info }: { icon: React.ReactNode; title: string; subtitle?: string; info?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-md leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {info && (
        <div className="group relative">
          <Info className="w-5 h-5 text-gray-600 hover:text-blue-400 cursor-help transition-colors" />
          <div className="absolute right-0 top-8 w-64 p-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-gray-400 leading-relaxed">
            <div className="font-bold text-blue-400 mb-1 uppercase tracking-wider">Technical Logic</div>
            {info}
          </div>
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function Settings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState<'marquee' | 'fullscreen'>('marquee');
  const [saved, setSaved] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoMarqueeEnabled, setPromoMarqueeEnabled] = useState(true);
  const [promoMarqueeMessage, setPromoMarqueeMessage] = useState('');

  useEffect(() => {
    fetchMaintenanceSettings();
    fetchPromoMarqueeSettings();
  }, []);

  const fetchMaintenanceSettings = async () => {
    try {
      const res = await api.get('/admin/settings/maintenance');
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

  const fetchPromoMarqueeSettings = async () => {
    try {
      const res = await api.get('/admin/settings/promo-marquee');
      if (res.data.success) {
        setPromoMarqueeEnabled(res.data.data.enabled);
        setPromoMarqueeMessage(res.data.data.message || '');
      }
    } catch {
      // ignore
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

  const handleMessageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = e.target.value;
    setMaintenanceMessage(message);
    await updateMaintenanceSettings(maintenanceMode, message, maintenanceType);
  };

  const updateMaintenanceSettings = async (enabled: boolean, message: string, type: string) => {
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

  const handlePromoMarqueeToggle = async () => {
    const next = !promoMarqueeEnabled;
    await updatePromoMarqueeSettings(next, promoMarqueeMessage);
  };

  const handlePromoMarqueeMessageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = e.target.value;
    setPromoMarqueeMessage(message);
    await updatePromoMarqueeSettings(promoMarqueeEnabled, message);
  };

  const updatePromoMarqueeSettings = async (enabled: boolean, message: string) => {
    try {
      const res = await api.put('/admin/settings/promo-marquee', { enabled, message });
      if (res.data.success) {
        setPromoMarqueeEnabled(enabled);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        await fetchPromoMarqueeSettings();
      }
    } catch {
      await fetchPromoMarqueeSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your site preferences</p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/15 border border-green-400/30 text-green-300 animate-fade-in">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            Changes saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
        {/* Checkout Management */}
        <Card className="h-full flex flex-col">
          <SectionHeading
            icon={<CreditCard className="w-6 h-6" />}
            title="Checkout Management"
            subtitle="Manage user payments. Add or remove methods like bKash, Nagad, or Crypto."
            info="Communicates with PaymentSettings model. The frontend checkout page fetches these settings."
          />

          <div className="mt-auto">
            <a
              href="/admin/settings/payment-management"
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Payment Methods</span>
                  <p className="text-xs text-gray-500 mt-0.5">Configure gateway options</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </Card>

        {/* Left Panel Settings */}
        <Card className="h-full flex flex-col">
          <SectionHeading
            icon={<PanelLeft className="w-6 h-6" />}
            title="Left Panel Settings"
            subtitle="Control sidebar navigation. Manage icons, colors, and descriptions for all devices."
            info="Uses /api/admin/left-panel. Changes are pushed to SideSliderSettings state."
          />

          <div className="mt-auto">
            <a
              href="/admin/settings/side-slider-management"
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Navigation Config</span>
                  <p className="text-xs text-gray-500 mt-0.5">Manage items and quick links</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </Card>

        {/* Footer Management */}
        <Card className="h-full flex flex-col">
          <SectionHeading
            icon={<Layout className="w-6 h-6" />}
            title="Footer Management"
            subtitle="Build footer dynamically. Create sections, add links, and choose accent colors."
            info="Uses SSE. The Footer component receives updates instantly via /api/footer/stream."
          />

          <div className="mt-auto">
            <a
              href="/admin/settings/footer-management"
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Footer Builder</span>
                  <p className="text-xs text-gray-500 mt-0.5">Edit sections and colors</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card className="h-full flex flex-col">
          <SectionHeading
            icon={<Power className="w-6 h-6" />}
            title="Maintenance Mode"
            subtitle="Site 'kill switch'. Enable this to show a maintenance bar or a full-page notice."
            info="Fetches from /api/admin/maintenance. Frontend checks this on every load."
          />

          <div className="mt-auto">
            <a
              href="/admin/settings/maintenance-management"
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-red-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">Maintenance Config</span>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle and edit messages</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </Card>

        {/* Promo Marquee */}
        <Card className="md:col-span-2">
          <SectionHeading
            icon={<Megaphone className="w-6 h-6" />}
            title="Promo Marquee"
            subtitle="Control scrolling text at the bottom. Announce big sales or news."
            info="Uses PromoMarquee.tsx. Updates in real-time on the frontend."
          />

          <div className={`relative rounded-xl border p-5 transition-all duration-500 ${promoMarqueeEnabled
              ? 'bg-blue-950/20 border-blue-500/30 shadow-lg shadow-blue-950/40'
              : 'bg-white/[0.02] border-white/10'
            }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 w-full">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${promoMarqueeEnabled ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-400'
                  }`}>
                  <Megaphone className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <span className="text-base font-bold text-white">Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border transition-all duration-300 ${promoMarqueeEnabled
                        ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                        : 'bg-gray-800/60 border-gray-600/40 text-gray-500'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${promoMarqueeEnabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'
                        }`} />
                      {promoMarqueeEnabled ? 'MARQUEE ACTIVE' : 'MARQUEE HIDDEN'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="w-full">
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom Promo Text</label>
                      <input
                        type="text"
                        value={promoMarqueeMessage}
                        onChange={handlePromoMarqueeMessageChange}
                        placeholder="e.g., Get 20% OFF! Use code: ZI20"
                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-white/20 transition-all duration-200"
                      />
                      <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Tip: If empty, system shows active offers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePromoMarqueeToggle}
                className={`relative flex-shrink-0 inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 focus:outline-none cursor-pointer ${promoMarqueeEnabled
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/40'
                    : 'bg-slate-700 hover:bg-slate-600'
                  }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-xl transition-all duration-500 ${promoMarqueeEnabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

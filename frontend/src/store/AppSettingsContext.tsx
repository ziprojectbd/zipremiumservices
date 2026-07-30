import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import api from '../lib/axios';
import { devLog } from '../utils/devLogger';

// ─── Types ────────────────────────────────────────────────────────────────
interface FooterData {
  sections: Array<{ title: string; color: string; hoverColor: string; links: Array<{ name: string; href: string }> }>;
}

interface PromoMarqueeData {
  enabled?: boolean;
  message?: string;
}

interface AppSettings {
  footer: FooterData | null;
  promoMarquee: PromoMarqueeData | null;
  sideSlider: unknown | null;
  paymentSettings: unknown | null;
  maintenance: { enabled: boolean; type: 'marquee' | 'fullscreen'; message: string } | null;
}

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
}

const defaults: AppSettings = {
  footer: null,
  promoMarquee: null,
  sideSlider: null,
  paymentSettings: null,
  maintenance: null,
};

const AppSettingsContext = createContext<AppSettingsContextType>({ settings: defaults, loading: true });

// ─── Provider ─────────────────────────────────────────────────────────────
export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      // Use combined settings endpoint (single request instead of 4+)
      const res = await api.get('/public/settings').catch(() => null);
      if (!res?.data?.success) {
        // Fallback to individual calls if combined endpoint fails
        const [footerRes, promoRes, sliderRes, paymentRes] = await Promise.all([
          api.get('/public/footer').catch(() => null),
          api.get('/public/promo-marquee').catch(() => null),
          api.get('/public/side-slider').catch(() => null),
          api.get('/public/payment-settings').catch(() => null),
        ]);

        if (!mountedRef.current) return;
        setSettings({
          footer: footerRes?.data?.data || footerRes?.data || null,
          promoMarquee: promoRes?.data?.data || promoRes?.data || null,
          sideSlider: sliderRes?.data?.data || sliderRes?.data || null,
          paymentSettings: paymentRes?.data?.data || paymentRes?.data || null,
          maintenance: null,
        });
        return;
      }

      if (!mountedRef.current) return;
      const data = res.data.data;
      setSettings({
        footer: data.footer || null,
        promoMarquee: data.promoMarquee || null,
        sideSlider: data.sideSlider || null,
        paymentSettings: data.paymentSettings || null,
        maintenance: null, // handled separately in App.tsx
      });
    } catch (e) {
      devLog('AppSettings fetch error:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    // Poll every 60s instead of each component polling every 3-5s
    intervalRef.current = setInterval(fetchAll, 60_000);
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  return (
    <AppSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useAppSettings() {
  return useContext(AppSettingsContext);
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { devLog } from '../utils/devLogger';
import api from '../lib/axios';

interface UseRealtimeOptions {
  endpoint: string;
  autoRefresh?: boolean;
  pollInterval?: number;
  enabled?: boolean;
}

interface UseRealtimeReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  connected: boolean;
  refresh: () => void;
}

export function useRealtimeData<T = any>({
  endpoint,
  autoRefresh = true,
  pollInterval = 3000,
  enabled = true
}: UseRealtimeOptions): UseRealtimeReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get(endpoint.replace('/api/', '/'));
      const result = response.data;

      if (result.success) {
        if (mountedRef.current) {
          setData(result.data || result);
          setError(null);
        }
      } else {
        if (mountedRef.current) {
          setError(new Error(result.error || 'Failed to fetch data'));
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setConnected(true);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    fetchData();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, pollInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endpoint, pollInterval, enabled, fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, connected, refresh };
}

// Pre-configured hooks
export const useRealtimeProducts = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/products', ...options });

export const useRealtimeCategories = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/categories', ...options });

export const useRealtimeSideSlider = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/public/side-slider', ...options });

export const useRealtimePaymentSettings = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/public/payment-settings', ...options });

export const useRealtimeMaintenance = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/public/maintenance', ...options });

export const useRealtimePromoMarquee = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/public/promo-marquee', ...options });

export const useRealtimePopupImages = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/public/popup-images', ...options });

export const useRealtimeFooter = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/public/footer', ...options });

export async function fetchRealtimeListings() {
  const res = await api.get('/digital-assets?limit=50&status=active');
  return res.data;
}

export async function fetchRealtimeCategoryCounts() {
  const res = await api.get('/digital-assets/category-counts');
  return res.data;
}

export const useRealtimeMarketplaceOrders = (options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({ endpoint: '/api/marketplace-orders', ...options });

export const useRealtimeTraderBids = (listingId?: string, options?: Partial<UseRealtimeOptions>) =>
  useRealtimeData({
    endpoint: listingId ? `/api/trader-bids?listingId=${listingId}` : '/api/trader-bids',
    ...options
  });

import { useState, useEffect } from "react";
import type { CampaignData } from "../../../types";
import api from "../../../lib/axios";

interface UseCampaignsResult {
  campaigns: CampaignData[];
  banners: any[];
  loading: boolean;
  error: string | null;
}

export function useActiveCampaigns(): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCampaigns() {
      try {
        const res = await api.get("/campaigns/active?includeBanners=true");
        const json = res.data;
        if (!cancelled && json.success) {
          setCampaigns(json.data || []);
          setBanners(json.banners || []);
        } else if (!cancelled) {
          setError(json.error || "Failed to fetch campaigns");
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCampaigns();
    return () => { cancelled = true; };
  }, []);

  return { campaigns, banners, loading, error };
}

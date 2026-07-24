import { devLog } from "../../utils/devLogger";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Search, ShieldCheck, TrendingUp, Zap, ChevronRight, CheckCircle2, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";

export default function MarketplaceHeroBanner() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [listingsData, setListingsData] = useState<any>(null);
  const [countsData, setCountsData] = useState<any>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const [listingsRes] = await Promise.all([
          api.get('/marketplace?limit=50&status=active'),
        ]);
        const listings = listingsRes.data;
        setListingsData(listings.data || listings);
        setCountsData({ total: listings.pagination?.total || 0 });
      } catch (error) {
        devLog('Error loading marketplace data:', error);
      }
    };
    loadData();
  }, []);

  const totalListings = countsData?.total || 0;

  return (
    <section className="relative py-12 overflow-hidden bg-gradient-to-b from-slate-900 via-purple-950/30 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px]" />
        <div className="absolute top-10 right-1/4 w-[250px] h-[250px] bg-pink-500/15 rounded-full blur-[60px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-green-400">✓ Verified</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Bangladesh's #1 Marketplace</span>
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Buy & Sell{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
                Digital Assets
              </span>
            </h2>
            <p className="text-slate-300 mt-2">
              YouTube channels, Facebook pages, Instagram, PUBG, Free Fire & more.{' '}
              <span className="text-purple-400 font-semibold">Escrow protection</span> included.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/marketplace')}
              className="group px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-1 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Browse Marketplace
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/marketplace/list-items');
                } else {
                  navigate('/sign-in');
                }
              }}
              className="group px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 shadow-lg shadow-green-600/30"
            >
              <Zap className="w-5 h-5" />
              Sell Now — Free
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-white font-bold">{totalListings > 1000 ? `${(totalListings / 1000).toFixed(1)}K+` : totalListings}</span>
              <span className="text-slate-400 text-sm">Active Listings</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white font-bold">5K+</span>
              <span className="text-slate-400 text-sm">Happy Customers</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-white font-bold">99%</span>
              <span className="text-slate-400 text-sm">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

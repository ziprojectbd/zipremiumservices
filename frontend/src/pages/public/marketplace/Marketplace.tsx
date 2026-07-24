import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Facebook, Youtube, Instagram, Gamepad2, ShieldCheck, CreditCard, Lock, CheckCircle2, ChevronRight, Filter, Star, Clock, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { useShopContext } from '../../../store/ShopContext';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import api from '../../../lib/axios';

const CATEGORY_INFO = [
  { id: 'youtube', name: 'YouTube Channel', icon: <Youtube className="w-5 h-5 text-red-500" /> },
  { id: 'facebook-page', name: 'Facebook Page', icon: <Facebook className="w-5 h-5 text-blue-600" /> },
  { id: 'facebook-group', name: 'Facebook Group', icon: <Facebook className="w-5 h-5 text-blue-700" /> },
  { id: 'instagram', name: 'Instagram Account', icon: <Instagram className="w-5 h-5 text-pink-500" /> },
  { id: 'gaming', name: 'Gaming Account', icon: <Gamepad2 className="w-5 h-5 text-purple-500" /> },
];

const getImageSrc = (src: string) => src || '';
const getUserInitials = (name?: string, email?: string) => {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
};

export default function Marketplace() {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, showAlert } = useShopContext();
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalListings, setTotalListings] = useState(0);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadMarketplaceData = async () => {
    if (fetchedRef.current && !realtimeLoading) return;

    try {
      setRealtimeLoading(true);

      const [listingsRes, countsRes] = await Promise.all([
        api.get('/digital-assets?limit=50&status=active'),
        api.get('/digital-assets/category-counts'),
      ]);

      const listingsData = listingsRes.data;
      const countsData = countsRes.data;

      if (countsData?.counts) {
        setCategoryCounts(countsData.counts || {});
        setTotalListings(countsData.total || 0);
      }

      if (listingsData?.listings) {
        const listingsWithImages = await Promise.all(
          (listingsData.listings || []).map(async (listing: any) => {
            try {
              const traderRes = await api.get(`/traders/check-user?email=${encodeURIComponent(listing.traderEmail)}`);
              let sellerImage = traderRes.data.trader?.image || '';
              if (!sellerImage) {
                const userRes = await api.get(`/auth/user?email=${encodeURIComponent(listing.traderEmail)}`);
                sellerImage = userRes.data.data?.image || '';
              }
              return { ...listing, sellerImage };
            } catch {
              return { ...listing, sellerImage: '' };
            }
          })
        );
        setListings(listingsWithImages);
      }
    } catch {
      // ignore
    } finally {
      setListingsLoading(false);
      setRealtimeLoading(false);
      fetchedRef.current = true;
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const refreshListings = () => {
    fetchedRef.current = false;
    setListings([]);
    setListingsLoading(true);
    loadMarketplaceData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 font-sans selection:bg-purple-500/30">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-slate-950" />
          <div className="absolute inset-0 opacity-40">
            <DotLottieReact src="/lottie/Business team.lottie" loop autoplay />
          </div>
        </div>

        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950/30 to-slate-900" />
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-pink-500/25 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-[450px] h-[450px] bg-blue-500/20 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-500/10 to-transparent rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold backdrop-blur-sm animate-fade-in-up shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-green-400">✓ Verified</span>
              <span className="text-slate-400">|</span>
              Bangladesh's #1 Marketplace
              <TrendingUp className="w-4 h-4 text-pink-400" />
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Buy & Sell{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 animate-gradient-text">
                Digital Assets
              </span>
              <br />
              <span className="text-4xl md:text-5xl mt-2 block">
                <span className="text-slate-400">with</span> <span className="text-green-400">Escrow Protection</span>
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              YouTube channels, Facebook pages & groups, Instagram, PUBG, Free Fire accounts and more.{' '}
              <span className="text-purple-400 font-semibold">Escrow payment protection</span> included.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button onClick={() => navigate('/marketplace/listings')} className="group px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-2 hover:scale-105 flex items-center gap-3 text-lg">
                <Search className="w-5 h-5" />
                Browse Listings
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => {
                if (isLoggedIn) {
                  navigate('/marketplace/list-items');
                } else {
                  navigate('/sign-in');
                }
              }} className="group px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 flex items-center gap-3 text-lg shadow-lg shadow-green-600/30">
                <Zap className="w-5 h-5" />
                Sell Now — Free
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search for channels, pages, accounts..."
                className="w-full pl-12 pr-32 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
              />
              <button
                onClick={() => navigate('/marketplace/listings')}
                className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-600/30"
              >
                Search
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">{totalListings > 1000 ? `${(totalListings / 1000).toFixed(1)}K+` : totalListings}</div>
                  <div className="text-xs text-slate-400">Active Listings</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">5K+</div>
                  <div className="text-xs text-slate-400">Happy Customers</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">99%</div>
                  <div className="text-xs text-slate-400">Success Rate</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={refreshListings}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${realtimeLoading ? 'animate-spin' : ''}`} />
                {realtimeLoading ? 'Updating...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Filter className="w-7 h-7 text-purple-500" />
              Browse by Category
            </h2>
            <p className="text-slate-400 mt-2">Find the perfect digital asset for your needs</p>
          </div>
          <button
            onClick={() => navigate('/marketplace/listings')}
            className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {CATEGORY_INFO.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/marketplace/listings?category=${cat.id}`)}
              className="group p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/30 group-hover:border-pink-500/50">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{cat.name}</h3>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{(categoryCounts[cat.id] || 0).toLocaleString()} listings</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-20 bg-gradient-to-b from-slate-900/30 to-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Clock className="w-7 h-7 text-purple-500" />
                Latest Listings
              </h2>
              <p className="text-slate-400 mt-2">Fresh digital assets just added</p>
            </div>
            <button
              onClick={() => navigate('/marketplace/listings')}
              className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listingsLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-slate-800" />
                  <div className="p-5">
                    <div className="h-4 bg-slate-800 rounded w-1/2 mb-3" />
                    <div className="h-5 bg-slate-800 rounded w-full mb-2" />
                    <div className="h-4 bg-slate-800 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : listings.length > 0 ? (
              listings.map((listing: any) => (
                <div
                  key={listing._id}
                  className="group flex flex-col rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="text-4xl opacity-30">
                          {listing.assetType === 'youtube' && '📺'}
                          {listing.assetType === 'facebook-page' && '📄'}
                          {listing.assetType === 'facebook-group' && '👥'}
                          {listing.assetType === 'instagram' && '📷'}
                          {(listing.assetType === 'pubg' || listing.assetType === 'freefire') && '🎮'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {listing.monetized === 'Yes' && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg">
                        Monetized
                      </div>
                    )}
                    <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                      <Star className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                        {listing.assetType === 'youtube' ? 'YouTube' :
                         listing.assetType === 'facebook-page' ? 'Facebook Page' :
                         listing.assetType === 'facebook-group' ? 'Facebook Group' :
                         listing.assetType === 'instagram' ? 'Instagram' :
                         listing.assetType === 'pubg' ? 'PUBG' :
                         listing.assetType === 'freefire' ? 'Free Fire' : listing.assetType}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[10px] text-slate-500 font-medium">{new Date(listing.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {listing.assetType === 'youtube' && listing.subscribers && `${(listing.subscribers).toLocaleString()} Subscribers`}
                      {listing.assetType === 'facebook-page' && (
                        <>
                          {listing.pageFollowers && `${(listing.pageFollowers).toLocaleString()} Followers`}
                          {listing.pageFollowers && listing.pageLikes && ' • '}
                          {listing.pageLikes && `${(listing.pageLikes).toLocaleString()} Likes`}
                        </>
                      )}
                      {listing.assetType === 'facebook-group' && listing.groupMembers && `${(listing.groupMembers).toLocaleString()} Members`}
                      {listing.assetType === 'instagram' && listing.instagramFollowers && `${(listing.instagramFollowers).toLocaleString()} Followers`}
                      {(listing.assetType === 'pubg' || listing.assetType === 'freefire') && `Level ${listing.accountLevel} • ${(listing.accountUC).toLocaleString()} ${listing.assetType === 'pubg' ? 'UC' : 'Diamonds'}`}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium mb-1">Price</p>
                        <p className="text-lg font-bold text-white">৳{listing.price?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/marketplace/listings/${listing._id}`)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-white/5 flex items-center justify-between border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {listing.sellerImage ? (
                          <img
                            src={getImageSrc(listing.sellerImage)}
                            alt={listing.traderName || 'Seller'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-white">
                            {getUserInitials(listing.traderName, listing.traderEmail)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{listing.traderName || 'Seller'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{listing.views || 0} views</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-slate-400">No listings found</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-950/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Why Choose</span> Us?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We're the most trusted platform for buying and selling digital assets in Bangladesh</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Escrow Protection</h3>
              <p className="text-slate-400">Your money is safe with us. We hold payment until the buyer receives the asset.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Transactions</h3>
              <p className="text-slate-400">All transactions are encrypted and protected. Your data and payments are safe.</p>
            </div>

            <div className="group p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Transfers</h3>
              <p className="text-slate-400">Get your digital assets transferred immediately after payment confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold text-white">How It Works</h2>
            <p className="text-lg text-slate-400">Buying and selling digital assets has never been easier or more secure.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
            {[
              { icon: <Search className="w-6 h-6" />, title: 'Find a Listing', desc: 'Browse verified digital assets across all categories.' },
              { icon: <CreditCard className="w-6 h-6" />, title: 'Pay Your Way', desc: 'bKash, Nagad, Rocket, Card or Bank Transfer — all accepted.' },
              { icon: <Lock className="w-6 h-6" />, title: 'Escrow Holds Funds', desc: 'We hold your money safely for 72 hours until delivery.' },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: 'Confirm & Release', desc: 'Happy? Confirm delivery and funds go to seller.' },
            ].map((step, i) => (
              <div key={i} className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 text-center space-y-4 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  {step.icon}
                </div>
                <h3 className="font-bold text-white text-lg">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="lg:hidden flex justify-center gap-2 mt-4">
            {[0, 1, 2].map(i => (
              <ChevronRight key={i} className="w-5 h-5 text-purple-500/50" />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Trusted Payment Methods</h3>
            <p className="text-slate-400">Secure transactions with your preferred payment options</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <span className="text-xl font-black text-white italic tracking-tighter">bKash</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <span className="text-xl font-black text-white italic tracking-tighter">Nagad</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <span className="text-xl font-black text-white italic tracking-tighter">ROCKET</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <span className="text-xl font-black text-white italic tracking-tighter">VISA</span>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
              <span className="text-xl font-black text-white italic tracking-tighter">MasterCard</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

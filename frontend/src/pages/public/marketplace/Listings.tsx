import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopContext } from '../../../store/ShopContext';
import { Search, Filter, Star, Clock, SlidersHorizontal, X, Check } from 'lucide-react';
import api from '../../../lib/axios';

const formatCount = (num: number | string | undefined) => {
  if (!num) return '0';
  const value = typeof num === 'string' ? parseInt(num) : num;
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return value.toLocaleString();
};

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌟' },
  { id: 'youtube', name: 'YouTube Channel', icon: '📺' },
  { id: 'facebook-page', name: 'Facebook Page', icon: '📄' },
  { id: 'facebook-group', name: 'Facebook Group', icon: '👥' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'pubg', name: 'PUBG Account', icon: '🎮' },
  { id: 'freefire', name: 'Free Fire Account', icon: '🔥' },
];

const CATEGORY_NAMES: Record<string, string> = {
  'youtube': 'YouTube Channel',
  'facebook-page': 'Facebook Page',
  'facebook-group': 'Facebook Group',
  'instagram': 'Instagram',
  'pubg': 'PUBG Account',
  'freefire': 'Free Fire Account',
};

const getImageSrc = (src: string) => src || '';
const getUserInitials = (name?: string, email?: string) => {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
};

export default function Listings() {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, showAlert } = useShopContext();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedAge, setSelectedAge] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [hasReviews, setHasReviews] = useState('all');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('category', selectedCategory);
      params.set('search', searchQuery);
      params.set('limit', '100');

      const res = await api.get(`/digital-assets?${params}`);

      if (res.data.success) {
        const listingsWithImages = await Promise.all(
          res.data.listings.map(async (listing: any) => {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const interval = setInterval(() => {
      setListings(prev => prev.map(listing => {
        if (listing.images && listing.images.length > 1) {
          const currentIndex = listing._slideIndex || 0;
          const nextIndex = (currentIndex + 1) % listing.images.length;
          return { ...listing, _slideIndex: nextIndex };
        }
        return listing;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sortedListings = [...listings].sort((a, b) => {
    switch(sortBy) {
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 font-sans">
      {/* Search and Filter Bar */}
      <div className="sticky top-16 z-30 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 backdrop-blur-sm transition-all"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <SlidersHorizontal className="w-5 h-5 text-slate-300" />
                <span className="text-slate-300">Filters</span>
                {(priceRange.min || priceRange.max || selectedAge !== 'all' || sortBy !== 'newest' || hasReviews !== 'all') && (
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => navigate('/marketplace/listings/order-history')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all text-slate-300 group"
              >
                <Clock className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                <span>Order History</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-purple-500/30'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedListings.map((listing) => (
            <div
              key={listing._id}
              className="group bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={listing.images[listing._slideIndex || 0]}
                      alt={listing.title}
                      className="w-full h-full object-contain"
                    />
                    {listing.images.length > 1 && (
                      <>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {listing.images.map((_: any, idx: number) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                listing._slideIndex = idx;
                                setListings([...listings]);
                              }}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                (listing._slideIndex || 0) === idx ? 'bg-white w-3' : 'bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <span className="text-4xl opacity-30">
                      {listing.assetType === 'youtube' && '📺'}
                      {listing.assetType === 'facebook-page' && '📄'}
                      {listing.assetType === 'facebook-group' && '👥'}
                      {listing.assetType === 'instagram' && '📷'}
                      {listing.assetType === 'pubg' && '🎮'}
                      {listing.assetType === 'freefire' && '🔥'}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/70 backdrop-blur-sm rounded-md">
                  <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wide">{CATEGORY_NAMES[listing.assetType] || listing.assetType}</span>
                </div>

                {listing.monetized === 'Yes' && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-500/80 backdrop-blur-sm rounded-md">
                    <span className="text-[10px] font-bold text-white">MONETIZED</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {listing.title}
                </h3>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                    {listing.assetType === 'youtube' && `${formatCount(listing.subscribers)} Subscribers`}
                    {listing.assetType === 'facebook-page' && (
                      <>
                        {listing.pageFollowers && `${formatCount(listing.pageFollowers)} Followers`}
                        {listing.pageFollowers && listing.pageLikes && ' • '}
                        {listing.pageLikes && `${formatCount(listing.pageLikes)} Likes`}
                      </>
                    )}
                    {listing.assetType === 'facebook-group' && `${formatCount(listing.groupMembers)} Members`}
                    {listing.assetType === 'instagram' && `${formatCount(listing.instagramFollowers)} Followers`}
                    {listing.assetType === 'pubg' && `${listing.accountRank} • ${formatCount(listing.accountUC)} UC • ${listing.accountSkins} Skins`}
                    {listing.assetType === 'freefire' && `${listing.accountRank} • ${formatCount(listing.accountUC)} Diamonds • ${listing.accountSkins} Skins`}
                  </span>
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Asking Price</p>
                    <p className="text-xl font-bold text-white">৳{listing.price?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500">{listing.views || 0} views</p>
                    {listing.negotiable && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Negotiable</span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                      {listing.sellerImage ? (
                        <img
                          src={getImageSrc(listing.sellerImage)}
                          alt={listing.traderName || 'Seller'}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {getUserInitials(listing.traderName, listing.traderEmail)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-300 font-medium">{listing.traderName || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500">{new Date(listing.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/marketplace/listings/${listing._id}`)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-all"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading listings...</p>
          </div>
        )}

        {!loading && sortedListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
            <p className="text-slate-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Filter Sidebar Overlay */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />

          <div className="relative w-full max-w-md bg-slate-900 border-r border-white/10 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Filters</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Price Range (৳)</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Account Age</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Ages' },
                    { value: '0-6', label: '0-6 months' },
                    { value: '6-12', label: '6-12 months' },
                    { value: '12-24', label: '1-2 years' },
                    { value: '24+', label: '2+ years' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedAge(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                        selectedAge === option.value
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                      {selectedAge === option.value && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Sort By</h3>
                <div className="space-y-2">
                  {[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'reviews', label: 'Most Reviews' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                        sortBy === option.value
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                      {sortBy === option.value && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Reviews</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Items' },
                    { value: 'yes', label: 'Has Reviews' },
                    { value: 'no', label: 'No Reviews' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setHasReviews(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                        hasReviews === option.value
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm">{option.label}</span>
                      {hasReviews === option.value && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setPriceRange({ min: '', max: '' });
                    setSelectedAge('all');
                    setSortBy('newest');
                    setHasReviews('all');
                  }}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-all"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

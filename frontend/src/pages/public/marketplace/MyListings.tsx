import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopContext } from '../../../store/ShopContext';
import { Search, Edit, Trash2, Eye, Heart, MessageCircle, AlertCircle } from 'lucide-react';
import api from '../../../lib/axios';

const CATEGORY_NAMES: Record<string, string> = {
  'youtube': 'YouTube Channel',
  'facebook-page': 'Facebook Page',
  'facebook-group': 'Facebook Group',
  'instagram': 'Instagram',
  'pubg': 'PUBG Account',
  'freefire': 'Free Fire Account',
};

export default function MyListings() {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, showAlert } = useShopContext();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'orders'>('listings');

  const fetchUserListings = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/digital-assets/user/${encodeURIComponent(userEmail)}/listings`);
      if (res.data.success) {
        setListings(res.data.listings || []);
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to fetch your listings');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to fetch your listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!userEmail) return;
    try {
      const res = await api.get('/trader-orders', { params: { email: userEmail, role: 'seller' } });
      setOrders(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }
    if (userEmail) {
      fetchUserListings();
      fetchOrders();
    }
  }, [isLoggedIn, userEmail]);

  const filteredListings = listings.filter(listing => {
    const matchesCategory = selectedCategory === 'all' || listing.assetType === selectedCategory;
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEdit = (listingId: string) => {
    navigate(`/marketplace/list-items/${listingId}`);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'approved' | 'rejected' | 'paid' | 'completed') => {
    try {
      const res = await api.patch('/trader-orders', { orderId, status });
      if (res.status >= 200 && res.status < 300) {
        fetchOrders();
        showAlert('success', 'Success', `Order ${status} successfully`);
      } else {
        showAlert('error', 'Error', 'Failed to update order status');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to update order status');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const res = await api.delete(`/digital-assets/${listingId}`);
      if (res.data.success) {
        setListings(prev => prev.filter(l => l._id !== listingId));
        showAlert('success', 'Deleted', 'Listing deleted successfully');
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to delete listing');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to delete listing');
    }
  };

  const getListingStats = (listing: any) => {
    if (listing.assetType === 'youtube') return `${listing.subscribers?.toLocaleString() || 0} Subscribers`;
    if (listing.assetType === 'facebook-page') return `${listing.pageFollowers?.toLocaleString() || 0} Followers`;
    if (listing.assetType === 'facebook-group') return `${listing.groupMembers?.toLocaleString() || 0} Members`;
    if (listing.assetType === 'instagram') return `${listing.instagramFollowers?.toLocaleString() || 0} Followers`;
    if (listing.assetType === 'pubg' || listing.assetType === 'freefire') return `${listing.accountSkins} Skins • ${listing.accountUC} ${listing.assetType === 'pubg' ? 'UC' : 'Diamonds'}`;
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to view your listings</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">My Listings & Orders</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'listings'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Orders ({orders.length})
            </button>
          </div>

          {/* Search and Filters - only show for listings tab */}
          {activeTab === 'listings' && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your listings..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {activeTab === 'listings' && (
          <>
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Listings Yet</h3>
                <p className="text-slate-400">You haven't created any listings yet. Start selling your digital assets!</p>
                <button
                  onClick={() => navigate('/marketplace/list-items')}
                  className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="group bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
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

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md ${
                          listing.status === 'active' ? 'bg-green-500/80 text-white' :
                          listing.status === 'sold' ? 'bg-blue-500/80 text-white' :
                          'bg-red-500/80 text-white'
                        }`}>
                          {listing.status || 'Active'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(listing._id); }}
                          className="p-2 bg-slate-900/70 hover:bg-slate-800 rounded-lg transition-colors text-white"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(listing._id); }}
                          className="p-2 bg-red-500/70 hover:bg-red-500 rounded-lg transition-colors text-white"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/70 backdrop-blur-sm rounded-md">
                        <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wide">{CATEGORY_NAMES[listing.assetType] || listing.assetType}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {listing.title}
                      </h3>

                      {/* Stats */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
                          {getListingStats(listing)}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Asking Price</p>
                          <p className="text-xl font-bold text-white">৳{listing.price?.toLocaleString()}</p>
                        </div>
                        {listing.negotiable && (
                          <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">Negotiable</span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-3" />

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {listing.views?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" />
                            {listing.saves?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            {listing.questions?.length || 0}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/marketplace/listings/${listing._id}`)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-all"
                        >
                          View
                        </button>
                      </div>
                    </div>

                    {/* Q&A Preview */}
                    {listing.questions && listing.questions.length > 0 && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 bg-slate-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-purple-300">
                            {listing.questions.length} Question{listing.questions.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {listing.questions.filter((q: any) => !q.answer).length} pending
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {listing.questions.slice(0, 2).map((q: any, idx: number) => (
                            <div key={q._id || idx} className="flex items-start gap-2">
                              <span className="text-[10px] text-slate-500 mt-0.5">Q:</span>
                              <p className="text-[11px] text-slate-300 line-clamp-1">{q.question}</p>
                              {!q.answer && (
                                <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">New</span>
                              )}
                            </div>
                          ))}
                          {listing.questions.length > 2 && (
                            <p className="text-[10px] text-purple-400">
                              +{listing.questions.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Orders Grid */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Orders Yet</h3>
                <p className="text-slate-400">You haven't received any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div key={order._id} className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">Order #{order._id.slice(-6)}</h3>
                        <p className="text-sm text-slate-400">Buyer: {order.buyerName} ({order.buyerEmail})</p>
                        <p className="text-sm text-slate-400">Amount: ৳{order.amount?.toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    {order.status === 'pending' && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleUpdateOrderStatus(order._id, 'approved')}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order._id, 'rejected')}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

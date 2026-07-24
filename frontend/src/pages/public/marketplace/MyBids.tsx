import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopContext } from '../../../store/ShopContext';
import { Check, X, Clock, DollarSign } from 'lucide-react';
import api from '../../../lib/axios';

export default function MyBids() {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, showAlert } = useShopContext();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }
    if (userEmail) {
      fetchListings();
    }
  }, [isLoggedIn, userEmail]);

  const fetchListings = async () => {
    try {
      const res = await api.get('/digital-assets', { params: { traderEmail: userEmail } });
      if (res.data.success) {
        setListings(res.data.listings || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async (listingId: string) => {
    setBidsLoading(true);
    try {
      const res = await api.get(`/digital-assets/${listingId}/bids`);
      if (res.data.success) {
        setBids(res.data.bids || []);
      }
    } catch {
      // ignore
    } finally {
      setBidsLoading(false);
    }
  };

  const handleSelectListing = (listing: any) => {
    setSelectedListing(listing);
    fetchBids(listing._id);
  };

  const updateBidStatus = async (orderId: string, status: string) => {
    try {
      const res = await api.post('/marketplace-orders/update-status', { orderId, status });
      if (res.data.success) {
        showAlert('success', 'Success', `Bid ${status} successfully`);
        if (selectedListing) {
          fetchBids(selectedListing._id);
        }
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to update bid');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to update bid');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="text-slate-400 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Manage Bids</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listings Sidebar */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white mb-4">Your Listings</h2>
            <div className="space-y-2">
              {listings.length > 0 ? (
                listings.map((listing) => (
                  <button
                    key={listing._id}
                    onClick={() => handleSelectListing(listing)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedListing?._id === listing._id
                        ? 'bg-purple-600/20 border border-purple-500/50'
                        : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-white font-medium truncate">{listing.title}</p>
                    <p className="text-sm text-slate-400">৳{listing.price?.toLocaleString()}</p>
                  </button>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">No listings found</p>
              )}
            </div>
          </div>

          {/* Bids Panel */}
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              {selectedListing ? `Bids for "${selectedListing.title}"` : 'Select a listing to view bids'}
            </h2>

            {!selectedListing ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a listing from the left to view its bids</p>
              </div>
            ) : bidsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : bids.length > 0 ? (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.orderId} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                          {(bid.bidderName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{bid.bidderName || 'Anonymous'}</p>
                          <p className="text-sm text-slate-400">{bid.bidderEmail}</p>
                          <p className="text-xs text-slate-500">{new Date(bid.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-400">৳{bid.amount?.toLocaleString()}</p>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-lg mt-1 ${
                          bid.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          bid.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {bid.status === 'pending' ? 'Pending' : bid.status === 'accepted' ? 'Accepted' : 'Rejected'}
                        </span>
                      </div>
                    </div>

                    {bid.status === 'pending' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                        <button
                          onClick={() => updateBidStatus(bid.orderId, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Accept Bid
                        </button>
                        <button
                          onClick={() => updateBidStatus(bid.orderId, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Reject Bid
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No bids yet for this listing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

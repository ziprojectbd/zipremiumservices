import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, ChevronLeft, Shield, Check, MessageCircle, Phone, Building, AlertCircle, Eye, Heart, Share2, ExternalLink, X } from 'lucide-react';
import { useShopContext } from '../../../store/ShopContext';
import api from '../../../lib/axios';

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

export default function ListingDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userEmail, username, userImage, showAlert, isKycVerified } = useShopContext();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sellerKycVerified, setSellerKycVerified] = useState(false);
  const [sellerImage, setSellerImage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [offerAmount, setOfferAmount] = useState('');
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const res = await api.get(`/digital-assets/${id}`);
        if (res.data.success) {
          setListing(res.data.listing);
          setSaveCount(res.data.listing.saves || 0);
          setIsSaved(false);

          if (res.data.listing.traderEmail) {
            try {
              const traderRes = await api.get('/traders/check-user', { params: { email: res.data.listing.traderEmail } });
              if (traderRes.data.success && traderRes.data.trader) {
                if (traderRes.data.trader.status === 'approved' && traderRes.data.trader.isVerified) {
                  setSellerKycVerified(true);
                }
                const userRes = await api.get('/auth/user', { params: { email: res.data.listing.traderEmail } });
                setSellerImage(traderRes.data.trader?.image || userRes.data.data?.image || '');
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id]);

  const fetchBids = async () => {
    if (!id) return;
    try {
      const res = await api.get('/trader-bids', { params: { listingId: id } });
      const bidsData = res.data || [];
      const bidsWithImages = await Promise.all(
        (bidsData || []).map(async (bid: any) => {
          try {
            const traderRes = await api.get('/traders/check-user', { params: { email: bid.bidderEmail } });
            let profileImage = traderRes.data.trader?.image || '';
            if (!profileImage) {
              const userRes = await api.get('/auth/user', { params: { email: bid.bidderEmail } });
              profileImage = userRes.data.data?.image || '';
            }
            return { ...bid, profileImage };
          } catch {
            return { ...bid, profileImage: '' };
          }
        })
      );
      setBids(bidsWithImages);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (id) fetchBids();
  }, [id]);

  const handleBidSubmit = async () => {
    if (!userEmail || !bidAmount) return;
    setBidLoading(true);
    try {
      const res = await api.post('/trader-bids', {
        listingId: id,
        bidderEmail: userEmail,
        bidderName: username || 'User',
        amount: parseFloat(bidAmount),
        message: bidMessage,
      });
      if (res.data) {
        setShowBidModal(false);
        setBidAmount('');
        setBidMessage('');
        fetchBids();
      }
    } catch {
      // ignore
    } finally {
      setBidLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/digital-assets/${id}/questions`);
      if (res.data.success) {
        const questionsWithImages = await Promise.all(
          res.data.questions.map(async (q: any) => {
            try {
              const askerRes = await api.get('/traders/check-user', { params: { email: q.askedByEmail } });
              let profileImage = askerRes.data.trader?.image || '';
              if (!profileImage) {
                const userRes = await api.get('/auth/user', { params: { email: q.askedByEmail } });
                profileImage = userRes.data.data?.image || '';
              }
              let answerProfileImage = '';
              if (q.answeredByEmail) {
                try {
                  const answererRes = await api.get('/traders/check-user', { params: { email: q.answeredByEmail } });
                  answerProfileImage = answererRes.data.trader?.image || '';
                  if (!answerProfileImage) {
                    const ansUserRes = await api.get('/auth/user', { params: { email: q.answeredByEmail } });
                    answerProfileImage = ansUserRes.data.data?.image || '';
                  }
                } catch {}
              }
              return { ...q, profileImage, answerProfileImage };
            } catch {
              return { ...q, profileImage: '', answerProfileImage: '' };
            }
          })
        );
        setQuestions(questionsWithImages);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (id) fetchQuestions();
  }, [id]);

  const getPageAge = () => {
    if (!listing) return '';
    const years = listing.channelAgeYears || listing.accountLevel || 0;
    const months = listing.channelAgeMonths || 0;
    if (years > 0 && months > 0) return `${years} years ${months} months`;
    if (years > 0) return `${years} years`;
    if (months > 0) return `${months} months`;
    return 'N/A';
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      const res = await api.post(`/digital-assets/${id}/save`, { isSaved: !isSaved });
      if (res.data.success) {
        setIsSaved(res.data.isSaved);
        setSaveCount(res.data.saves);
        showAlert('success', res.data.isSaved ? 'Saved!' : 'Unsaved', res.data.isSaved ? 'Listing saved to your collection' : 'Listing removed from your collection');
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to update save status');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to save listing');
    }
  };

  const handleBuyNow = async () => {
    if (!userEmail) {
      showAlert('error', 'Sign In Required', 'Please sign in to purchase');
      return;
    }
    if (!isKycVerified) {
      showAlert('warning', 'KYC Required', 'Please verify your identity before purchasing from the marketplace.');
      setTimeout(() => navigate('/marketplace/trader-kyc'), 2000);
      return;
    }
    if (!listing) return;
    setOrderLoading(true);
    try {
      const res = await api.post('/trader-orders', {
        listingId: listing._id,
        buyerEmail: userEmail,
        buyerName: username || 'Buyer',
        sellerEmail: listing.traderEmail,
        sellerName: listing.traderName,
        amount: listing.price,
        paymentMethod: 'bkash',
      });
      if (res.data) {
        setOrderData(res.data);
        setOrderSuccess(true);
        setShowOrderModal(true);
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to create order');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to create order');
    } finally {
      setOrderLoading(false);
    }
  };

  const getFollowerInfo = () => {
    if (!listing) return '';
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

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Listing Not Found</h2>
          <button
            onClick={() => navigate('/marketplace/listings')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-video bg-slate-800">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[activeImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => setShowFullImage(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-30">
                      {listing.assetType === 'youtube' && '📺'}
                      {listing.assetType === 'facebook-page' && '📄'}
                      {listing.assetType === 'facebook-group' && '👥'}
                      {listing.assetType === 'instagram' && '📷'}
                      {listing.assetType === 'pubg' && '🎮'}
                      {listing.assetType === 'freefire' && '🔥'}
                    </span>
                  </div>
                )}

                {/* Image Navigation */}
                {listing.images && listing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((activeImageIndex - 1 + listing.images.length) % listing.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((activeImageIndex + 1) % listing.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-white rotate-180" />
                    </button>

                    {/* Thumbnails */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {listing.images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                            activeImageIndex === idx ? 'border-white' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={handleSave}
                    className={`p-2 rounded-lg transition-colors ${isSaved ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Title & Meta */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                      {CATEGORY_NAMES[listing.assetType] || listing.assetType}
                    </span>
                    {listing.monetized === 'Yes' && (
                      <span className="px-3 py-1 bg-green-600/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                        Monetized ✓
                      </span>
                    )}
                    {listing.negotiable && (
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                        Negotiable
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
                </div>
              </div>

              {/* Follower Info from Database */}
              <div className="mb-4 p-4 bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-400">
                  <span className="text-purple-300 font-medium">{CATEGORY_NAMES[listing.assetType]} - </span>
                  {getFollowerInfo()}
                </p>
              </div>

              {/* Channel/Page Link Button */}
              {listing.channelLink && (
                <a
                  href={listing.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-center block transition-colors flex items-center justify-center gap-2"
                >
                  <span>View {CATEGORY_NAMES[listing.assetType]}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {listing.views?.toLocaleString() || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {saveCount.toLocaleString() || 0} saves
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Posted {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-sm text-slate-400">
                  <span className="text-purple-300 font-medium">SKU:</span> {listing._id?.slice(-12).toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>

            {/* Asset Details */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Asset Details</h2>

              <div className="grid grid-cols-2 gap-4">
                {listing.assetType === 'youtube' && (
                  <>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Subscribers</p>
                      <p className="text-lg font-semibold text-white">{listing.subscribers?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Channel Age</p>
                      <p className="text-lg font-semibold text-white">{getPageAge()}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Monetized</p>
                      <p className="text-lg font-semibold text-white">{listing.monetized || 'No'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Sub-Category</p>
                      <p className="text-lg font-semibold text-white capitalize">{listing.channelSubCategory || 'N/A'}</p>
                    </div>
                  </>
                )}

                {listing.assetType === 'facebook-page' && (
                  <>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Page Followers</p>
                      <p className="text-lg font-semibold text-white">{listing.pageFollowers?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Page Likes</p>
                      <p className="text-lg font-semibold text-white">{listing.pageLikes?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Page Age</p>
                      <p className="text-lg font-semibold text-white">{getPageAge()}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Monetized</p>
                      <p className="text-lg font-semibold text-white">{listing.monetized || 'No'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Category</p>
                      <p className="text-lg font-semibold text-white capitalize">{listing.pageCategory?.replace('-', ' ') || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Verified</p>
                      <p className="text-lg font-semibold text-white">{listing.pageVerified || 'No'}</p>
                    </div>
                  </>
                )}

                {listing.assetType === 'facebook-group' && (
                  <>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Group Members</p>
                      <p className="text-lg font-semibold text-white">{listing.groupMembers?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Privacy</p>
                      <p className="text-lg font-semibold text-white">{listing.groupPrivacy || 'Public'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Monetized</p>
                      <p className="text-lg font-semibold text-white">{listing.monetized || 'No'}</p>
                    </div>
                  </>
                )}

                {listing.assetType === 'instagram' && (
                  <>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Followers</p>
                      <p className="text-lg font-semibold text-white">{listing.instagramFollowers?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Category</p>
                      <p className="text-lg font-semibold text-white capitalize">{listing.instagramCategory || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Verified</p>
                      <p className="text-lg font-semibold text-white">{listing.instagramVerified || 'No'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Monetized</p>
                      <p className="text-lg font-semibold text-white">{listing.monetized || 'No'}</p>
                    </div>
                  </>
                )}

                {(listing.assetType === 'pubg' || listing.assetType === 'freefire') && (
                  <>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Rank</p>
                      <p className="text-lg font-semibold text-white capitalize">{listing.accountRank?.replace('-', ' ') || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Level</p>
                      <p className="text-lg font-semibold text-white">{listing.accountLevel || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">{listing.assetType === 'pubg' ? 'UC Balance' : 'Diamonds'}</p>
                      <p className="text-lg font-semibold text-white">{listing.accountUC?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Skins</p>
                      <p className="text-lg font-semibold text-white">{listing.accountSkins || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Description</h2>
              <p className="text-slate-300 whitespace-pre-wrap">
                {listing.description || 'No description provided.'}
              </p>
            </div>

            {/* Q&A */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Questions & Answers ({questions.length})</h2>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q: any, idx: number) => (
                    <div key={q._id || idx} className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {q.profileImage ? (
                            <img
                              src={getImageSrc(q.profileImage)}
                              alt={q.askedBy || 'Questioner'}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {getUserInitials(q.askedBy, q.askedByEmail)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-300">Q:</p>
                            <p className="text-xs text-slate-400">{q.askedBy || 'Anonymous'}</p>
                            <span className="text-xs text-slate-500">
                              {new Date(q.askedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-white">{q.question}</p>
                        </div>
                      </div>
                      {q.answer ? (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {q.answerProfileImage ? (
                                <img
                                  src={getImageSrc(q.answerProfileImage)}
                                  alt={q.answeredBy || 'Answerer'}
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {getUserInitials(q.answeredBy)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-green-400">A:</p>
                                <p className="text-xs text-slate-400">{q.answeredBy || 'Seller'}</p>
                                <span className="text-xs text-slate-500">
                                  {q.answeredAt && new Date(q.answeredAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300">{q.answer}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Seller Answer Section */
                        userEmail === listing?.traderEmail && (
                          <div className="mt-3">
                            {answeringQuestion === q._id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={answerText}
                                  onChange={(e) => setAnswerText(e.target.value)}
                                  placeholder="Write your answer..."
                                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      if (!answerText.trim()) {
                                        showAlert('error', 'Error', 'Please write an answer');
                                        return;
                                      }
                                      try {
                                        const res = await api.post(`/digital-assets/${id}/questions/${q._id}/answer`, {
                                          answer: answerText.trim(),
                                          answeredBy: userEmail || listing?.traderName,
                                        });
                                        if (res.data.success) {
                                          setAnswerText('');
                                          setAnsweringQuestion(null);
                                          fetchQuestions();
                                          showAlert('success', 'Answer Posted', 'Your answer has been posted');
                                        } else {
                                          showAlert('error', 'Error', res.data.error || 'Failed to post answer');
                                        }
                                      } catch {
                                        showAlert('error', 'Error', 'Failed to post answer');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Submit Answer
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAnsweringQuestion(null);
                                      setAnswerText('');
                                    }}
                                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAnsweringQuestion(q._id)}
                                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                              >
                                + Answer this question
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this listing..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  rows={3}
                />
                <button
                  onClick={async () => {
                    if (!question.trim() || !userEmail || !id) {
                      showAlert('error', 'Error', 'Please sign in to ask a question');
                      return;
                    }
                    try {
                      const res = await api.post(`/digital-assets/${id}/questions`, {
                        question: question.trim(),
                        askedBy: userEmail || username || 'Anonymous',
                      });
                      if (res.data.success) {
                        setQuestion('');
                        fetchQuestions();
                        showAlert('success', 'Question Posted', 'Your question has been posted');
                      } else {
                        showAlert('error', 'Error', res.data.error || 'Failed to post question');
                      }
                    } catch {
                      showAlert('error', 'Error', 'Failed to post question');
                    }
                  }}
                  className="mt-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                >
                  Ask Question
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Price & Seller */}
          <div className="space-y-6">
            {/* Price Card */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sticky top-24">
              <div className="mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Asking Price</p>
                <p className="text-3xl font-bold text-white">৳{listing.price?.toLocaleString()}</p>
                {listing.negotiable && (
                  <span className="inline-block mt-2 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    Negotiable
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  disabled={orderLoading}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/30 disabled:opacity-50"
                >
                  {orderLoading ? 'Processing...' : 'Buy Now'}
                </button>
                <button
                  onClick={() => setShowBidModal(true)}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors border border-slate-600"
                >
                  Make Bid
                </button>
              </div>

              {/* Escrow Protection */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">Buyer Protection</span>
                </div>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• 72-hour escrow protection</li>
                  <li>• Payment held securely</li>
                  <li>• Dispute protection available</li>
                </ul>
              </div>

              {/* Recent Bids Section */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Bids</h3>
                <div className="space-y-2">
                  {bids.length > 0 ? (
                    bids.slice(0, 3).map((bid: any, index: number) => (
                      <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                              {bid.profileImage ? (
                                <img
                                  src={getImageSrc(bid.profileImage)}
                                  alt={bid.bidderName || 'Bidder'}
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {getUserInitials(bid.bidderName, bid.bidderEmail)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{bid.bidderName || 'Anonymous'}</p>
                              <p className="text-xs text-slate-500">{new Date(bid.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-400">৳{bid.amount?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-500">No bids yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Seller Information</h3>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                  {sellerImage ? (
                    <img
                      src={getImageSrc(sellerImage)}
                      alt={listing.traderName || 'Seller'}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {getUserInitials(listing.traderName, listing.traderEmail)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{listing.traderName || 'Unknown'}</p>
                  <p className={`text-sm font-medium ${sellerKycVerified ? 'text-green-400' : 'text-slate-400'}`}>
                    {sellerKycVerified ? 'KYC Verified ✓' : 'New Seller'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rating</span>
                  <span className="text-yellow-400">★★★★☆ (0)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trades</span>
                  <span className="text-white">0 completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined</span>
                  <span className="text-white">{new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!userEmail) {
                    showAlert('error', 'Sign In Required', 'Please sign in to contact the seller');
                    return;
                  }
                  if (userEmail === listing?.traderEmail) {
                    showAlert('error', 'Cannot Contact Yourself', 'You cannot contact yourself');
                    return;
                  }
                  navigate(`/marketplace/chat?seller=${listing?.traderEmail}&listing=${listing?._id}`);
                }}
                className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
              >
                Contact Seller
              </button>
            </div>

            {/* Payment Methods */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Payment Methods</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  bKash
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  Nagad
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-purple-400" />
                  Rocket
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Building className="w-4 h-4 text-purple-400" />
                  Bank Transfer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && listing.images && listing.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {listing.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex((activeImageIndex - 1 + listing.images.length) % listing.images.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          <img
            src={listing.images[activeImageIndex]}
            alt={listing.title}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {listing.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex((activeImageIndex + 1) % listing.images.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white rotate-180" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
            {activeImageIndex + 1} / {listing.images.length}
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showOrderModal && orderData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            {orderSuccess ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
                  <p className="text-slate-400">Order #{orderData.orderNumber}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Item</span>
                      <span className="text-white font-medium">{orderData.listingTitle}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Amount</span>
                      <span className="text-green-400 font-bold">৳{orderData.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Seller</span>
                      <span className="text-white">{orderData.sellerName}</span>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-400 mb-1">Payment Instructions</h4>
                        <p className="text-sm text-slate-300">
                          Our team will contact you within 24 hours with payment details.
                          Payment will be held in escrow until you receive the account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setShowOrderModal(false); navigate('/marketplace'); }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                >
                  Continue Shopping
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Order Failed</h2>
                  <p className="text-slate-400">Something went wrong. Please try again.</p>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Make Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Make a Bid</h2>
              <button
                onClick={() => { setShowBidModal(false); setOfferAmount(''); }}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-slate-800 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Listing</span>
                  <span className="text-white font-medium">{listing?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Asking Price</span>
                  <span className="text-white font-bold">৳{listing?.price?.toLocaleString()}</span>
                </div>
              </div>

              <label className="block text-sm text-slate-400 mb-2">Your Bid (BDT)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                  className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              {listing?.negotiable && (
                <p className="text-xs text-slate-500 mt-2">💡 Seller accepts negotiations</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowBidModal(false); setOfferAmount(''); }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!offerAmount || Number(offerAmount) <= 0) {
                    showAlert('error', 'Invalid Amount', 'Please enter a valid offer amount');
                    return;
                  }
                  if (!userEmail) {
                    showAlert('error', 'Sign In Required', 'Please sign in to make an offer');
                    return;
                  }
                  setBidLoading(true);
                  try {
                    const res = await api.post('/trader-bids', {
                      listingId: listing?._id,
                      bidderEmail: userEmail,
                      bidderName: username || 'User',
                      amount: Number(offerAmount),
                      message: 'Bid placed via Make Bid button',
                    });
                    if (res.data) {
                      setShowBidModal(false);
                      setOfferAmount('');
                      fetchBids();
                      alert('Bid submitted successfully!');
                    } else {
                      showAlert('error', 'Error', res.data.error || 'Failed to submit offer');
                    }
                  } catch {
                    showAlert('error', 'Error', 'Failed to submit offer');
                  } finally {
                    setBidLoading(false);
                  }
                }}
                disabled={bidLoading}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {bidLoading ? 'Submitting...' : 'Submit Bid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Place Your Bid</h3>
              <button
                onClick={() => setShowBidModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bid Amount (৳)
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Add a message to the seller..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBidModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBidSubmit}
                  disabled={!bidAmount || bidLoading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bidLoading ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

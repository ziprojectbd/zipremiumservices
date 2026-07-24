import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Shield, ArrowRight, ArrowLeft, DollarSign, FileText, Tag, Upload, X, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { useShopContext } from '../../../store/ShopContext';
import api from '../../../lib/axios';

const ASSET_TYPES = [
  { id: 'youtube', name: 'YouTube Channel', icon: '📺', desc: 'Monetized channels, subscriber packages' },
  { id: 'facebook-page', name: 'Facebook Page', icon: '📄', desc: 'Fan pages, professional pages' },
  { id: 'facebook-group', name: 'Facebook Group', icon: '👥', desc: 'Private groups, public groups' },
  { id: 'instagram', name: 'Instagram Account', icon: '📷', desc: 'Business accounts, personal accounts' },
  { id: 'pubg', name: 'PUBG Account', icon: '🎮', desc: 'Global elite, ranked accounts' },
  { id: 'freefire', name: 'Free Fire Account', icon: '🔥', desc: 'Diamond accounts, legend rank' },
];

const formatCount = (num: number | string | undefined, unit?: string) => {
  if (!num) return '0';
  let value = typeof num === 'string' ? parseInt(num) : num;
  if (unit === 'K') value = value * 1000;
  if (unit === 'M') value = value * 1000000;
  if (value >= 1000000) return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return value.toLocaleString();
};

const displayValue = (value: string, unit: string) => {
  if (!value) return '';
  if (unit === 'K') return `${value}K`;
  if (unit === 'M') return `${value}M`;
  const num = parseFloat(value);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return value;
};

const STEPS = [
  { id: 1, name: 'Category', icon: Tag },
  { id: 2, name: 'Details', icon: FileText },
  { id: 3, name: 'Media', icon: Tag },
  { id: 4, name: 'Review', icon: CheckCircle2 },
];

const KYC_STATUS = { NONE: 'none', PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' } as const;
type KycStatus = typeof KYC_STATUS[keyof typeof KYC_STATUS] | null | undefined;

const shouldShowUnderReviewBadge = (s: KycStatus) => Boolean(s && s !== KYC_STATUS.APPROVED);
const getKycStatusLabel = (s: KycStatus) => {
  if (s === KYC_STATUS.NONE) return 'No KYC';
  if (s === KYC_STATUS.PENDING) return 'Pending Review';
  if (s === KYC_STATUS.REJECTED) return 'KYC Rejected';
  if (s === KYC_STATUS.APPROVED) return 'KYC Approved';
  return 'Unknown';
};
const getKycStatusMessage = (s: KycStatus) => {
  if (s === KYC_STATUS.NONE) return 'Complete your trader KYC verification to publish listings.';
  if (s === KYC_STATUS.PENDING) return 'Your KYC verification is under review. You will be notified once approved.';
  if (s === KYC_STATUS.REJECTED) return 'Your KYC verification was rejected. Please resubmit to continue.';
  return '';
};

export default function ListItems() {
  const navigate = useNavigate();
  const { userEmail, username, showAlert, isLoggedIn } = useShopContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    assetType: '',
    title: '',
    description: '',
    price: '',
    negotiable: true,
    images: [] as string[],
    channelSubCategory: '',
    subscribers: '',
    subscribersUnit: '',
    monetized: 'No',
    channelAgeYears: '0',
    channelAgeMonths: '0',
    channelLink: '',
    pageFollowers: '',
    pageFollowersUnit: '',
    pageLikes: '',
    pageLikesUnit: '',
    pageCategory: '',
    pageVerified: 'No',
    pageLink: '',
    groupMembers: '',
    groupMembersUnit: '',
    groupPrivacy: 'Public',
    instagramFollowers: '',
    instagramFollowersUnit: '',
    instagramCategory: '',
    instagramVerified: 'No',
    accountRank: '',
    accountLevel: '',
    accountUC: '',
    accountUCUnit: '',
    accountSkins: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }
    fetchKycStatus();
  }, [isLoggedIn]);

  const fetchKycStatus = async () => {
    setKycLoading(true);
    try {
      const res = await api.get('/kyc/status');
      if (res.data.success) {
        setKycStatus(res.data.kycStatus);
      } else {
        setKycStatus(undefined);
      }
    } catch {
      setKycStatus(undefined);
    } finally {
      setKycLoading(false);
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.assetType) newErrors.assetType = 'Please select an asset type';
    }
    if (step === 2) {
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.price) newErrors.price = 'Price is required';
      if (formData.assetType === 'youtube') {
        if (!formData.channelSubCategory) newErrors.channelSubCategory = 'Channel sub-category is required';
        if (!formData.subscribers) newErrors.subscribers = 'Subscribers is required';
        if (!formData.channelLink) newErrors.channelLink = 'Channel link is required';
      }
      if (formData.assetType === 'facebook-page') {
        if (!formData.pageFollowers) newErrors.pageFollowers = 'Page followers is required';
        if (!formData.pageLikes) newErrors.pageLikes = 'Page likes is required';
        if (!formData.pageCategory) newErrors.pageCategory = 'Page category is required';
        if (!formData.pageLink) newErrors.pageLink = 'Page link is required';
      }
      if (formData.assetType === 'facebook-group') {
        if (!formData.groupMembers) newErrors.groupMembers = 'Group members is required';
      }
      if (formData.assetType === 'instagram') {
        if (!formData.instagramFollowers) newErrors.instagramFollowers = 'Followers is required';
        if (!formData.instagramCategory) newErrors.instagramCategory = 'Category is required';
      }
      if (formData.assetType === 'pubg') {
        if (!formData.accountRank) newErrors.accountRank = 'Rank is required';
        if (!formData.accountLevel) newErrors.accountLevel = 'Account level is required';
        if (!formData.accountUC) newErrors.accountUC = 'UC balance is required';
        if (!formData.accountSkins) newErrors.accountSkins = 'Number of skins is required';
      }
      if (formData.assetType === 'freefire') {
        if (!formData.accountRank) newErrors.accountRank = 'Rank is required';
        if (!formData.accountLevel) newErrors.accountLevel = 'Account level is required';
        if (!formData.accountUC) newErrors.accountUC = 'Diamond balance is required';
        if (!formData.accountSkins) newErrors.accountSkins = 'Number of skins is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 1) {
      try {
        const res = await api.get('/kyc/status');
        if (!res.data.success) {
          showAlert('error', 'Error', res.data.error || 'Failed to verify trader status');
          return;
        }
        const { role, isTrader, kycStatus: status } = res.data;
        if (role !== 'trader' || !isTrader || status !== KYC_STATUS.APPROVED) {
          if (status === 'none') {
            showAlert('warning', 'KYC Required', 'Please complete your trader KYC verification to list assets.');
          } else if (status === 'pending') {
            showAlert('warning', 'KYC Pending', 'Your KYC verification is still under review. You will be notified once approved.');
          } else {
            showAlert('warning', 'KYC Required', 'Your KYC verification must be approved to list assets.');
          }
          return;
        }
        setKycStatus(status);
      } catch {
        showAlert('error', 'Error', 'Failed to verify KYC status. Please try again.');
        return;
      }
    }
    setCurrentStep(Math.min(4, currentStep + 1));
  };

  const handlePrev = () => setCurrentStep(Math.max(1, currentStep - 1));

  const handleSubmit = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const convertValue = (value: string, unit: string) => {
        if (!value) return value;
        const num = parseFloat(value);
        if (unit === 'K') return (num * 1000).toString();
        if (unit === 'M') return (num * 1000000).toString();
        return value;
      };
      const submissionData = {
        assetType: formData.assetType,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        negotiable: formData.negotiable,
        images: formData.images,
        channelSubCategory: formData.channelSubCategory,
        subscribers: convertValue(formData.subscribers, formData.subscribersUnit),
        monetized: formData.monetized,
        channelAgeYears: Number(formData.channelAgeYears),
        channelAgeMonths: Number(formData.channelAgeMonths),
        channelLink: formData.channelLink,
        pageFollowers: convertValue(formData.pageFollowers, formData.pageFollowersUnit),
        pageLikes: convertValue(formData.pageLikes, formData.pageLikesUnit),
        pageCategory: formData.pageCategory,
        pageVerified: formData.pageVerified,
        pageLink: formData.pageLink,
        groupMembers: convertValue(formData.groupMembers, formData.groupMembersUnit),
        groupPrivacy: formData.groupPrivacy,
        instagramFollowers: convertValue(formData.instagramFollowers, formData.instagramFollowersUnit),
        instagramCategory: formData.instagramCategory,
        instagramVerified: formData.instagramVerified,
        accountRank: formData.accountRank,
        accountLevel: Number(formData.accountLevel),
        accountUC: convertValue(formData.accountUC, formData.accountUCUnit),
        accountSkins: Number(formData.accountSkins),
      };
      const res = await api.post('/digital-assets', submissionData);
      if (res.data.success) {
        setIsSubmitted(true);
        showAlert('success', 'Listing Created!', 'Your listing has been submitted. Buyers will contact you soon.');
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to create listing');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to create listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/upload', fd);
      if (res.data.success && res.data.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, res.data.url] }));
      }
    } catch {
      showAlert('error', 'Upload Failed', 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  if (kycLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 font-sans">
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-4">Listing Published!</h1>
          <p className="text-lg text-slate-300 mb-8">Your digital asset is now live on the marketplace.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                setIsSubmitted(false);
                setCurrentStep(1);
                setFormData({
                  assetType: '', title: '', description: '', price: '', negotiable: true, images: [],
                  channelSubCategory: '', subscribers: '', subscribersUnit: '', monetized: 'No',
                  channelAgeYears: '0', channelAgeMonths: '0', channelLink: '',
                  pageFollowers: '', pageFollowersUnit: '', pageLikes: '', pageLikesUnit: '',
                  pageCategory: '', pageVerified: 'No', pageLink: '',
                  groupMembers: '', groupMembersUnit: '', groupPrivacy: 'Public',
                  instagramFollowers: '', instagramFollowersUnit: '', instagramCategory: '', instagramVerified: 'No',
                  accountRank: '', accountLevel: '', accountUC: '', accountUCUnit: '', accountSkins: '',
                });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all"
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/marketplace/listings')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30"
            >
              View Listings
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showUnderReview = shouldShowUnderReviewBadge(kycStatus);
  const kycMessage = getKycStatusMessage(kycStatus);
  const kycLabel = getKycStatusLabel(kycStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Under Review Badge */}
        {showUnderReview && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
              {kycStatus === KYC_STATUS.REJECTED ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-amber-400 font-semibold text-sm">Under Review</span>
                <span className="text-slate-400 text-xs px-2 py-0.5 bg-white/5 rounded-full border border-white/10">{kycLabel}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{kycMessage}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep > step.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : currentStep === step.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/10 border border-white/20 text-slate-400'
                }`}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-2 font-medium ${currentStep >= step.id ? 'text-white' : 'text-slate-500'}`}>{step.name}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                  currentStep > step.id ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">

          {/* Step 1: Category */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Select Category</h2>
              <p className="text-slate-400 mb-6">Choose the type of digital asset you're selling</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ASSET_TYPES.map((asset) => (
                  <button
                    type="button"
                    key={asset.id}
                    onClick={() => setFormData({ ...formData, assetType: asset.id })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      formData.assetType === asset.id
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10'
                        : 'bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{asset.icon}</span>
                    <p className="font-medium text-white text-sm">{asset.name}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{asset.desc}</p>
                  </button>
                ))}
              </div>
              {errors.assetType && <p className="text-red-400 text-sm mt-4">{errors.assetType}</p>}
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Listing Details</h2>
                <p className="text-slate-400 mb-6">Enter your {formData.assetType === 'youtube' ? 'YouTube channel' : formData.assetType === 'facebook-page' ? 'Facebook page' : formData.assetType === 'facebook-group' ? 'Facebook group' : formData.assetType === 'instagram' ? 'Instagram account' : formData.assetType === 'pubg' ? 'PUBG account' : formData.assetType === 'freefire' ? 'Free Fire account' : 'digital asset'} details.</p>

                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-slate-300 mb-2">
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Title *</span>
                      <span className="text-slate-500 text-xs">{formData.title.length} / 80</span>
                    </label>
                    <input type="text" maxLength={80} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder=""
                      className={`w-full px-4 py-4 bg-white/5 border ${errors.title ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all`} />
                    <p className="text-slate-500 text-xs mt-1">Be specific and include key stats in the title.</p>
                    {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                  </div>

                  {/* YouTube Sub-Category */}
                  {formData.assetType === 'youtube' && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Channel Sub-Category</label>
                      <select value={formData.channelSubCategory} onChange={e => setFormData({ ...formData, channelSubCategory: e.target.value })}
                        className={`w-full px-4 py-4 bg-white/5 border ${errors.channelSubCategory ? 'border-red-500' : 'border-white/10'} rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all`}>
                        <option value="" className="bg-slate-800">Select sub-category...</option>
                        <option value="tech" className="bg-slate-800">Tech</option>
                        <option value="gaming" className="bg-slate-800">Gaming</option>
                        <option value="entertainment" className="bg-slate-800">Entertainment</option>
                        <option value="education" className="bg-slate-800">Education</option>
                        <option value="lifestyle" className="bg-slate-800">Lifestyle</option>
                        <option value="music" className="bg-slate-800">Music</option>
                        <option value="news" className="bg-slate-800">News & Politics</option>
                        <option value="sports" className="bg-slate-800">Sports</option>
                        <option value="business" className="bg-slate-800">Business</option>
                        <option value="other" className="bg-slate-800">Other</option>
                      </select>
                      {errors.channelSubCategory && <p className="text-red-400 text-sm mt-1">{errors.channelSubCategory}</p>}
                    </div>
                  )}

                  {/* Price */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><DollarSign className="w-4 h-4" /> Asking Price (৳) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">৳</span>
                      <input type="number" step="1" min="0" autoComplete="off" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Enter price"
                        className={`w-full pl-8 pr-4 py-4 bg-white/5 border ${errors.price ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all text-lg`} />
                    </div>
                    {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
                  </div>

                  {/* YouTube: Monetized */}
                  {formData.assetType === 'youtube' && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Monetized?</label>
                      <select value={formData.monetized} onChange={e => setFormData({ ...formData, monetized: e.target.value })}
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all">
                        <option value="No" className="bg-slate-800">No — Not monetized</option>
                        <option value="Yes" className="bg-slate-800">Yes — Monetized</option>
                      </select>
                    </div>
                  )}

                  {/* YouTube: Channel Age + Subscribers + Link */}
                  {formData.assetType === 'youtube' && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Channel Age</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input type="number" value={formData.channelAgeYears} onChange={e => setFormData({ ...formData, channelAgeYears: e.target.value })} placeholder="0"
                              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
                            <p className="text-slate-500 text-xs mt-1">Years</p>
                          </div>
                          <div>
                            <input type="number" value={formData.channelAgeMonths} onChange={e => setFormData({ ...formData, channelAgeMonths: e.target.value })} placeholder="0"
                              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
                            <p className="text-slate-500 text-xs mt-1">Months</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Subscribers</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="number" value={formData.subscribers} onChange={e => {
                            const val = e.target.value;
                            let unit = '';
                            if (val && parseFloat(val) >= 1000) unit = 'K';
                            setFormData({ ...formData, subscribers: val, subscribersUnit: unit || formData.subscribersUnit });
                          }} placeholder="10"
                            className={`flex-1 px-4 py-4 bg-white/5 border ${errors.subscribers ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          <select value={formData.subscribersUnit} onChange={e => setFormData({ ...formData, subscribersUnit: e.target.value })}
                            className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value="" className="bg-slate-800">Normal</option>
                            <option value="K" className="bg-slate-800">K</option>
                            <option value="M" className="bg-slate-800">M</option>
                          </select>
                        </div>
                        <p className="text-purple-400 text-xs mt-1 font-bold">Subscribers ({formData.subscribers}{formData.subscribersUnit || ''})</p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Channel Link *</label>
                        <input type="url" value={formData.channelLink} onChange={e => setFormData({ ...formData, channelLink: e.target.value })} placeholder="https://youtube.com/@yourchannel"
                          className={`w-full px-4 py-4 bg-white/5 border ${errors.channelLink ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                        {errors.channelLink && <p className="text-red-400 text-sm mt-1">{errors.channelLink}</p>}
                      </div>
                    </>
                  )}

                  {/* Facebook Page Fields */}
                  {formData.assetType === 'facebook-page' && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Followers</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="number" value={formData.pageFollowers} onChange={e => {
                            const val = e.target.value;
                            let unit = '';
                            if (val && parseFloat(val) >= 1000) unit = 'K';
                            setFormData({ ...formData, pageFollowers: val, pageFollowersUnit: unit || formData.pageFollowersUnit });
                          }} placeholder="10"
                            className={`flex-1 px-4 py-4 bg-white/5 border ${errors.pageFollowers ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          <select value={formData.pageFollowersUnit} onChange={e => setFormData({ ...formData, pageFollowersUnit: e.target.value })}
                            className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value="" className="bg-slate-800">Normal</option>
                            <option value="K" className="bg-slate-800">K</option>
                            <option value="M" className="bg-slate-800">M</option>
                          </select>
                        </div>
                        <p className="text-purple-400 text-xs mt-1 font-bold">Followers ({formData.pageFollowers}{formData.pageFollowersUnit || ''})</p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Likes</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="number" value={formData.pageLikes} onChange={e => {
                            const val = e.target.value;
                            let unit = '';
                            if (val && parseFloat(val) >= 1000) unit = 'K';
                            setFormData({ ...formData, pageLikes: val, pageLikesUnit: unit || formData.pageLikesUnit });
                          }} placeholder="10"
                            className={`flex-1 px-4 py-4 bg-white/5 border ${errors.pageLikes ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          <select value={formData.pageLikesUnit} onChange={e => setFormData({ ...formData, pageLikesUnit: e.target.value })}
                            className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value="" className="bg-slate-800">Normal</option>
                            <option value="K" className="bg-slate-800">K</option>
                            <option value="M" className="bg-slate-800">M</option>
                          </select>
                        </div>
                        <p className="text-purple-400 text-xs mt-1 font-bold">Likes ({formData.pageLikes}{formData.pageLikesUnit || ''})</p>
                        {errors.pageLikes && <p className="text-red-400 text-sm mt-1">{errors.pageLikes}</p>}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Monetized?</label>
                        <select value={formData.monetized} onChange={e => setFormData({ ...formData, monetized: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                          <option value="No" className="bg-slate-800">No — Not monetized</option>
                          <option value="Yes" className="bg-slate-800">Yes — Monetized</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Page Category</label>
                        <select value={formData.pageCategory} onChange={e => setFormData({ ...formData, pageCategory: e.target.value })}
                          className={`w-full px-4 py-4 bg-white/5 border ${errors.pageCategory ? 'border-red-500' : 'border-white/10'} rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}>
                          <option value="" className="bg-slate-800">Select category...</option>
                          <option value="business" className="bg-slate-800">Business</option>
                          <option value="brand" className="bg-slate-800">Brand</option>
                          <option value="artist" className="bg-slate-800">Artist</option>
                          <option value="public-figure" className="bg-slate-800">Public Figure</option>
                          <option value="entertainment" className="bg-slate-800">Entertainment</option>
                          <option value="news" className="bg-slate-800">News & Media</option>
                          <option value="other" className="bg-slate-800">Other</option>
                        </select>
                        {errors.pageCategory && <p className="text-red-400 text-sm mt-1">{errors.pageCategory}</p>}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Verified?</label>
                        <select value={formData.pageVerified} onChange={e => setFormData({ ...formData, pageVerified: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                          <option value="No" className="bg-slate-800">No</option>
                          <option value="Yes" className="bg-slate-800">Yes — Blue Tick</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Page Link *</label>
                        <input type="url" value={formData.pageLink} onChange={e => setFormData({ ...formData, pageLink: e.target.value })} placeholder="https://facebook.com/yourpage"
                          className={`w-full px-4 py-4 bg-white/5 border ${errors.pageLink ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                        {errors.pageLink && <p className="text-red-400 text-sm mt-1">{errors.pageLink}</p>}
                      </div>
                    </>
                  )}

                  {/* Facebook Group Fields */}
                  {formData.assetType === 'facebook-group' && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Group Members</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="number" value={formData.groupMembers} onChange={e => {
                            const val = e.target.value;
                            let unit = '';
                            if (val && parseFloat(val) >= 1000) unit = 'K';
                            setFormData({ ...formData, groupMembers: val, groupMembersUnit: unit || formData.groupMembersUnit });
                          }} placeholder="10"
                            className={`flex-1 px-4 py-4 bg-white/5 border ${errors.groupMembers ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          <select value={formData.groupMembersUnit} onChange={e => setFormData({ ...formData, groupMembersUnit: e.target.value })}
                            className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value="" className="bg-slate-800">Normal</option>
                            <option value="K" className="bg-slate-800">K</option>
                            <option value="M" className="bg-slate-800">M</option>
                          </select>
                        </div>
                        <p className="text-purple-400 text-xs mt-1 font-bold">Members ({formData.groupMembers}{formData.groupMembersUnit || ''})</p>
                        {errors.groupMembers && <p className="text-red-400 text-sm mt-1">{errors.groupMembers}</p>}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Monetized?</label>
                        <select value={formData.monetized} onChange={e => setFormData({ ...formData, monetized: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                          <option value="No" className="bg-slate-800">No</option>
                          <option value="Yes" className="bg-slate-800">Yes — Monetized</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Privacy</label>
                        <select value={formData.groupPrivacy} onChange={e => setFormData({ ...formData, groupPrivacy: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                          <option value="Public" className="bg-slate-800">Public</option>
                          <option value="Private" className="bg-slate-800">Private</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Instagram Fields */}
                  {formData.assetType === 'instagram' && (
                    <>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Followers</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="number" value={formData.instagramFollowers} onChange={e => {
                            const val = e.target.value;
                            let unit = '';
                            if (val && parseFloat(val) >= 1000) unit = 'K';
                            setFormData({ ...formData, instagramFollowers: val, instagramFollowersUnit: unit || formData.instagramFollowersUnit });
                          }} placeholder="10"
                            className={`flex-1 px-4 py-4 bg-white/5 border ${errors.instagramFollowers ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          <select value={formData.instagramFollowersUnit} onChange={e => setFormData({ ...formData, instagramFollowersUnit: e.target.value })}
                            className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value="" className="bg-slate-800">Normal</option>
                            <option value="K" className="bg-slate-800">K</option>
                            <option value="M" className="bg-slate-800">M</option>
                          </select>
                        </div>
                        <p className="text-purple-400 text-xs mt-1 font-bold">Followers ({formData.instagramFollowers}{formData.instagramFollowersUnit || ''})</p>
                        {errors.instagramFollowers && <p className="text-red-400 text-sm mt-1">{errors.instagramFollowers}</p>}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Monetized?</label>
                        <select value={formData.monetized} onChange={e => setFormData({ ...formData, monetized: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                          <option value="No" className="bg-slate-800">No</option>
                          <option value="Yes" className="bg-slate-800">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Category</label>
                        <select value={formData.instagramCategory} onChange={e => setFormData({ ...formData, instagramCategory: e.target.value })}
                          className={`w-full px-4 py-4 bg-white/5 border ${errors.instagramCategory ? 'border-red-500' : 'border-white/10'} rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}>
                          <option value="" className="bg-slate-800">Select category...</option>
                          <option value="business" className="bg-slate-800">Business</option>
                          <option value="personal" className="bg-slate-800">Personal</option>
                          <option value="creator" className="bg-slate-800">Creator</option>
                        </select>
                        {errors.instagramCategory && <p className="text-red-400 text-sm mt-1">{errors.instagramCategory}</p>}
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Verified?</label>
                        <select value={formData.instagramVerified} onChange={e => setFormData({ ...formData, instagramVerified: e.target.value })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all">
                          <option value="No" className="bg-slate-800">No</option>
                          <option value="Yes" className="bg-slate-800">Yes — Blue Tick</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* PUBG Fields */}
                  {formData.assetType === 'pubg' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Rank</label>
                          <select value={formData.accountRank} onChange={e => setFormData({ ...formData, accountRank: e.target.value })}
                            className={`w-full px-4 py-4 bg-white/5 border ${errors.accountRank ? 'border-red-500' : 'border-white/10'} rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}>
                            <option value="" className="bg-slate-800">Select rank...</option>
                            <option value="bronze" className="bg-slate-800">Bronze</option>
                            <option value="silver" className="bg-slate-800">Silver</option>
                            <option value="gold" className="bg-slate-800">Gold</option>
                            <option value="platinum" className="bg-slate-800">Platinum</option>
                            <option value="diamond" className="bg-slate-800">Diamond</option>
                            <option value="crown" className="bg-slate-800">Crown</option>
                            <option value="ace" className="bg-slate-800">Ace</option>
                            <option value="conqueror" className="bg-slate-800">Conqueror</option>
                            <option value="global" className="bg-slate-800">Global Elite</option>
                          </select>
                          {errors.accountRank && <p className="text-red-400 text-sm mt-1">{errors.accountRank}</p>}
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Level</label>
                          <input type="number" value={formData.accountLevel} onChange={e => setFormData({ ...formData, accountLevel: e.target.value })} placeholder=""
                            className={`w-full px-4 py-4 bg-white/5 border ${errors.accountLevel ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          {errors.accountLevel && <p className="text-red-400 text-sm mt-1">{errors.accountLevel}</p>}
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> UC</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input type="number" value={formData.accountUC} onChange={e => {
                              const val = e.target.value;
                              let unit = '';
                              if (val && parseFloat(val) >= 1000) unit = 'K';
                              setFormData({ ...formData, accountUC: val, accountUCUnit: unit || formData.accountUCUnit });
                            }} placeholder="1000"
                              className={`flex-1 px-4 py-4 bg-white/5 border ${errors.accountUC ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                            <select value={formData.accountUCUnit} onChange={e => setFormData({ ...formData, accountUCUnit: e.target.value })}
                              className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                              <option value="" className="bg-slate-800">Normal</option>
                              <option value="K" className="bg-slate-800">K</option>
                              <option value="M" className="bg-slate-800">M</option>
                            </select>
                          </div>
                          <p className="text-purple-400 text-xs mt-1 font-bold">UC ({formData.accountUC}{formData.accountUCUnit || ''})</p>
                          {errors.accountUC && <p className="text-red-400 text-sm mt-1">{errors.accountUC}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Number of Skins</label>
                        <input type="number" value={formData.accountSkins} onChange={e => setFormData({ ...formData, accountSkins: e.target.value })} placeholder=""
                          className={`w-full px-4 py-4 bg-white/5 border ${errors.accountSkins ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                        {errors.accountSkins && <p className="text-red-400 text-sm mt-1">{errors.accountSkins}</p>}
                      </div>
                    </>
                  )}

                  {/* Free Fire Fields */}
                  {formData.assetType === 'freefire' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Rank</label>
                          <select value={formData.accountRank} onChange={e => setFormData({ ...formData, accountRank: e.target.value })}
                            className={`w-full px-4 py-4 bg-white/5 border ${errors.accountRank ? 'border-red-500' : 'border-white/10'} rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}>
                            <option value="" className="bg-slate-800">Select rank...</option>
                            <option value="warrior" className="bg-slate-800">Warrior</option>
                            <option value="elite" className="bg-slate-800">Elite</option>
                            <option value="master" className="bg-slate-800">Master</option>
                            <option value="grandmaster" className="bg-slate-800">Grandmaster</option>
                            <option value="legend" className="bg-slate-800">Legend</option>
                            <option value="mythic" className="bg-slate-800">Mythic</option>
                            <option value="grandmaster-legend" className="bg-slate-800">Grandmaster Legend</option>
                          </select>
                          {errors.accountRank && <p className="text-red-400 text-sm mt-1">{errors.accountRank}</p>}
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Level</label>
                          <input type="number" value={formData.accountLevel} onChange={e => setFormData({ ...formData, accountLevel: e.target.value })} placeholder=""
                            className={`w-full px-4 py-4 bg-white/5 border ${errors.accountLevel ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                          {errors.accountLevel && <p className="text-red-400 text-sm mt-1">{errors.accountLevel}</p>}
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Diamonds</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input type="number" value={formData.accountUC} onChange={e => {
                              const val = e.target.value;
                              let unit = '';
                              if (val && parseFloat(val) >= 1000) unit = 'K';
                              setFormData({ ...formData, accountUC: val, accountUCUnit: unit || formData.accountUCUnit });
                            }} placeholder="1000"
                              className={`flex-1 sm:w-1/2 px-4 py-4 bg-white/5 border ${errors.accountUC ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                            <select value={formData.accountUCUnit} onChange={e => setFormData({ ...formData, accountUCUnit: e.target.value })}
                              className="px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                              <option value="" className="bg-slate-800">Normal</option>
                              <option value="K" className="bg-slate-800">K</option>
                              <option value="M" className="bg-slate-800">M</option>
                            </select>
                          </div>
                          <p className="text-purple-400 text-xs mt-1 font-bold">Diamonds ({formData.accountUC}{formData.accountUCUnit || ''})</p>
                          {errors.accountUC && <p className="text-red-400 text-sm mt-1">{errors.accountUC}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><Tag className="w-4 h-4" /> Number of Skins</label>
                        <input type="number" value={formData.accountSkins} onChange={e => setFormData({ ...formData, accountSkins: e.target.value })} placeholder=""
                          className={`w-full px-4 py-4 bg-white/5 border ${errors.accountSkins ? 'border-red-500' : 'border-white/10'} rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`} />
                        {errors.accountSkins && <p className="text-red-400 text-sm mt-1">{errors.accountSkins}</p>}
                      </div>
                    </>
                  )}

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"><FileText className="w-4 h-4" /> Description</label>
                    <div>
                      <span className="text-slate-500 text-xs">{formData.description.length} / 1500</span>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Content type, niche, audience demographics, monthly income, why you're selling, any restrictions..."
                        rows={4} maxLength={1500}
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all resize-none" />
                      <p className="text-slate-500 text-xs mt-1">Maximum 1500 characters.</p>
                    </div>
                  </div>

                  {/* Negotiable */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="relative self-start sm:self-center">
                      <input type="checkbox" id="negotiable" checked={formData.negotiable}
                        onChange={e => setFormData({ ...formData, negotiable: e.target.checked })} className="sr-only peer" />
                      <label htmlFor="negotiable" className="w-12 h-6 bg-slate-600 rounded-full peer-checked:bg-green-500 transition-colors relative block cursor-pointer">
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.negotiable ? 'translate-x-6' : ''}`} />
                      </label>
                    </div>
                    <div>
                      <label htmlFor="negotiable" className="text-white font-medium">Price is negotiable</label>
                      <p className="text-xs text-slate-500">Allow buyers to negotiate the price</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Add Media</h2>
              <p className="text-slate-400 mb-6">Upload images of your digital asset (optional)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden group bg-slate-800/50">
                    <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <label className="aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span className="text-sm text-slate-400">Upload Image</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4">You can add up to 5 images. Recommended size: 800x600px</p>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Review Listing</h2>
              <p className="text-slate-400 mb-6">Review your listing before publishing</p>
              <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white font-medium">{ASSET_TYPES.find(a => a.id === formData.assetType)?.name}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="text-slate-400">Title</span>
                  <span className="text-white font-medium">{formData.title}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="text-slate-400">Description</span>
                  <span className="text-white font-medium">{formData.description || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="text-slate-400">Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-400">৳{formData.price}</span>
                    {formData.negotiable && <p className="text-xs text-slate-400">Negotiable</p>}
                  </div>
                </div>

                {formData.assetType === 'youtube' && (
                  <>
                    {formData.channelSubCategory && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                        <div><span className="text-slate-400 text-sm">Channel Sub-Category</span><p className="text-white font-medium capitalize">{formData.channelSubCategory}</p></div>
                        {formData.subscribers && <div><span className="text-slate-400 text-sm">Subscribers</span><p className="text-white font-medium">{displayValue(formData.subscribers, formData.subscribersUnit)}</p></div>}
                        <div><span className="text-slate-400 text-sm">Monetized</span><p className="text-white font-medium">{formData.monetized}</p></div>
                      </div>
                    )}
                    {(formData.channelAgeYears !== '0' || formData.channelAgeMonths !== '0') && (
                      <div className="flex items-center justify-between pb-4 border-b border-white/10">
                        <span className="text-slate-400">Channel Age</span>
                        <span className="text-white font-medium">{formData.channelAgeYears}y {formData.channelAgeMonths}m</span>
                      </div>
                    )}
                    {formData.channelLink && (
                      <div className="flex items-center justify-between pb-4 border-b border-white/10">
                        <span className="text-slate-400">Channel Link</span>
                        <a href={formData.channelLink} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">View Channel</a>
                      </div>
                    )}
                  </>
                )}

                {formData.assetType === 'facebook-page' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                      {formData.pageFollowers && <div><span className="text-slate-400 text-sm">Followers</span><p className="text-white font-medium">{displayValue(formData.pageFollowers, formData.pageFollowersUnit)}</p></div>}
                      {formData.pageLikes && <div><span className="text-slate-400 text-sm">Likes</span><p className="text-white font-medium">{displayValue(formData.pageLikes, formData.pageLikesUnit)}</p></div>}
                      <div><span className="text-slate-400 text-sm">Monetized</span><p className="text-white font-medium">{formData.monetized}</p></div>
                    </div>
                    {formData.pageCategory && <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Page Category</span><span className="text-white font-medium capitalize">{formData.pageCategory.replace('-', ' ')}</span></div>}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Verified</span><span className="text-white font-medium">{formData.pageVerified}</span></div>
                  </>
                )}

                {formData.assetType === 'facebook-group' && (
                  <>
                    {formData.groupMembers && <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Group Members</span><span className="text-white font-medium">{displayValue(formData.groupMembers, formData.groupMembersUnit)}</span></div>}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Monetized</span><span className="text-white font-medium">{formData.monetized}</span></div>
                    <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Privacy</span><span className="text-white font-medium">{formData.groupPrivacy}</span></div>
                  </>
                )}

                {formData.assetType === 'instagram' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                      {formData.instagramFollowers && <div><span className="text-slate-400 text-sm">Followers</span><p className="text-white font-medium">{displayValue(formData.instagramFollowers, formData.instagramFollowersUnit)}</p></div>}
                      <div><span className="text-slate-400 text-sm">Monetized</span><p className="text-white font-medium">{formData.monetized}</p></div>
                      {formData.instagramCategory && <div><span className="text-slate-400 text-sm">Category</span><p className="text-white font-medium capitalize">{formData.instagramCategory}</p></div>}
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Verified</span><span className="text-white font-medium">{formData.instagramVerified}</span></div>
                  </>
                )}

                {formData.assetType === 'pubg' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                      {formData.accountRank && <div><span className="text-slate-400 text-sm">Rank</span><p className="text-white font-medium capitalize">{formData.accountRank}</p></div>}
                      {formData.accountLevel && <div><span className="text-slate-400 text-sm">Level</span><p className="text-white font-medium">{formData.accountLevel}</p></div>}
                      {formData.accountUC && <div><span className="text-slate-400 text-sm">UC Balance</span><p className="text-white font-medium">{displayValue(formData.accountUC, formData.accountUCUnit)} UC</p></div>}
                    </div>
                    {formData.accountSkins && <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Skins</span><span className="text-white font-medium">{formData.accountSkins}</span></div>}
                  </>
                )}

                {formData.assetType === 'freefire' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                      {formData.accountRank && <div><span className="text-slate-400 text-sm">Rank</span><p className="text-white font-medium capitalize">{formData.accountRank.replace('-', ' ')}</p></div>}
                      {formData.accountLevel && <div><span className="text-slate-400 text-sm">Level</span><p className="text-white font-medium">{formData.accountLevel}</p></div>}
                      {formData.accountUC && <div><span className="text-slate-400 text-sm">Diamond Balance</span><p className="text-white font-medium">{displayValue(formData.accountUC, formData.accountUCUnit)} Diamonds</p></div>}
                    </div>
                    {formData.accountSkins && <div className="flex items-center justify-between pb-4 border-b border-white/10"><span className="text-slate-400">Skins</span><span className="text-white font-medium">{formData.accountSkins}</span></div>}
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Images</span>
                  <span className="text-white font-medium">{formData.images.length} uploaded</span>
                </div>
              </div>

              {formData.images.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Image Preview</h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-slate-800/50">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mt-6">
                <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
                <p className="text-sm text-slate-300">Your payment is protected by escrow until delivery is confirmed</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            {currentStep > 1 ? (
              <button type="button" onClick={handlePrev}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all">
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/marketplace')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all">
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} disabled={showUnderReview}
                className={`flex items-center gap-2 px-8 py-3 font-bold rounded-xl transition-all ${
                  showUnderReview
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30'
                }`}>
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isPublishing}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/30 disabled:opacity-60 disabled:cursor-not-allowed">
                {isPublishing ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing...</>
                ) : (
                  <>Publish Listing <CheckCircle2 className="w-5 h-5" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

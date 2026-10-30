import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, DollarSign, FileText, Tag, ArrowRight, ArrowLeft, X, Plus } from 'lucide-react';
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

const STEPS = [
  { id: 1, name: 'Category', icon: Tag },
  { id: 2, name: 'Details', icon: FileText },
  { id: 3, name: 'Media', icon: Tag },
  { id: 4, name: 'Review', icon: CheckCircle2 },
];

export default function EditListing() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { isLoggedIn, userEmail, showAlert } = useShopContext();
  const [loading, setLoading] = useState(true);
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
    monetized: 'No',
    channelAgeYears: '0',
    channelAgeMonths: '0',
    channelLink: '',
    pageFollowers: '',
    pageLikes: '',
    pageCategory: '',
    pageVerified: 'No',
    groupMembers: '',
    groupPrivacy: 'Public',
    instagramFollowers: '',
    instagramCategory: '',
    instagramVerified: 'No',
    accountRank: '',
    accountLevel: '',
    accountUC: '',
    accountSkins: '',
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }
    if (userEmail && params?.id) {
      fetchListing();
    }
  }, [isLoggedIn, userEmail, params?.id]);

  const fetchListing = async () => {
    if (!params?.id) return;

    try {
      const res = await api.get(`/digital-assets/${params.id}`);
      if (res.data.success && res.data.listing) {
        const listing = res.data.listing;
        setFormData({
          assetType: listing.assetType || '',
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price?.toString() || '',
          negotiable: listing.negotiable ?? true,
          images: listing.images || [],
          channelSubCategory: listing.channelSubCategory || '',
          subscribers: listing.subscribers?.toString() || '',
          monetized: listing.monetized || 'No',
          channelAgeYears: listing.channelAgeYears?.toString() || '0',
          channelAgeMonths: listing.channelAgeMonths?.toString() || '0',
          channelLink: listing.channelLink || '',
          pageFollowers: listing.pageFollowers?.toString() || '',
          pageLikes: listing.pageLikes?.toString() || '',
          pageCategory: listing.pageCategory || '',
          pageVerified: listing.pageVerified || 'No',
          groupMembers: listing.groupMembers?.toString() || '',
          groupPrivacy: listing.groupPrivacy || 'Public',
          instagramFollowers: listing.instagramFollowers?.toString() || '',
          instagramCategory: listing.instagramCategory || '',
          instagramVerified: listing.instagramVerified || 'No',
          accountRank: listing.accountRank || '',
          accountLevel: listing.accountLevel?.toString() || '',
          accountUC: listing.accountUC?.toString() || '',
          accountSkins: listing.accountSkins?.toString() || '',
        });
        if (listing.assetType) setCurrentStep(2);
      }
    } catch {
      showAlert('error', 'Error', 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userEmail) {
      showAlert('error', 'Error', 'Please sign in to update listing');
      return;
    }

    if (!params?.id) {
      showAlert('error', 'Error', 'Invalid listing ID');
      return;
    }

    try {
      const res = await api.put(`/digital-assets/${params.id}`, {
        ...formData,
        price: Number(formData.price),
        subscribers: formData.subscribers ? Number(formData.subscribers) : null,
        pageFollowers: formData.pageFollowers ? Number(formData.pageFollowers) : null,
        pageLikes: formData.pageLikes ? Number(formData.pageLikes) : null,
        groupMembers: formData.groupMembers ? Number(formData.groupMembers) : null,
        instagramFollowers: formData.instagramFollowers ? Number(formData.instagramFollowers) : null,
        channelAgeYears: Number(formData.channelAgeYears),
        channelAgeMonths: Number(formData.channelAgeMonths),
        accountLevel: formData.accountLevel ? Number(formData.accountLevel) : null,
        accountUC: formData.accountUC ? Number(formData.accountUC) : null,
        accountSkins: formData.accountSkins ? Number(formData.accountSkins) : null,
        traderEmail: userEmail,
      });

      if (res.data.success) {
        showAlert('success', 'Success', 'Listing updated successfully!');
        navigate('/marketplace/my-listings');
      } else {
        showAlert('error', 'Error', res.data.error || 'Failed to update listing');
      }
    } catch {
      showAlert('error', 'Error', 'Failed to update listing');
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setFormData({ ...formData, images: [...formData.images, url] });
    }
  };

  const handleImageRemove = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-2 ${currentStep >= step.id ? 'text-white' : 'text-slate-500'}`}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-purple-600' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-900/80 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Select Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ASSET_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, assetType: type.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.assetType === type.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-3xl block mb-2">{type.icon}</span>
                    <span className="text-white font-medium block">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Listing Details</h2>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="Enter listing title"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  rows={4}
                  placeholder="Describe your listing"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Price (BDT)</label>
                <input
                  type="number"
                  value={formData.price}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                  placeholder="Enter price"
                />
                <p className="text-xs text-slate-500 mt-1">Contact support to change price</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="relative self-start sm:self-center">
                  <input
                    type="checkbox"
                    id="negotiable"
                    checked={formData.negotiable}
                    disabled
                    className="sr-only peer"
                  />
                  <label
                    htmlFor="negotiable"
                    className="w-12 h-6 bg-slate-600 rounded-full peer-checked:bg-green-500 cursor-not-allowed transition-colors relative block"
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.negotiable ? 'translate-x-6' : ''}`} />
                  </label>
                </div>
                <div>
                  <label htmlFor="negotiable" className="text-white font-medium">Price is negotiable</label>
                  <p className="text-xs text-slate-500">Contact support to change</p>
                </div>
              </div>

              {formData.assetType === 'youtube' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Subscribers</label>
                      <input
                        type="number"
                        value={formData.subscribers}
                        onChange={(e) => setFormData({ ...formData, subscribers: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Channel Age (Years)</label>
                      <input
                        type="number"
                        value={formData.channelAgeYears}
                        onChange={(e) => setFormData({ ...formData, channelAgeYears: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Channel Link</label>
                    <input
                      type="text"
                      value={formData.channelLink}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Contact support to change link</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="relative self-start sm:self-center">
                      <input
                        type="checkbox"
                        id="monetized"
                        checked={formData.monetized === 'Yes'}
                        onChange={(e) => setFormData({ ...formData, monetized: e.target.checked ? 'Yes' : 'No' })}
                        className="sr-only peer"
                      />
                      <label
                        htmlFor="monetized"
                        className="w-12 h-6 bg-slate-600 rounded-full peer-checked:bg-green-500 transition-colors relative block cursor-pointer"
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.monetized === 'Yes' ? 'translate-x-6' : ''}`} />
                      </label>
                    </div>
                    <div>
                      <label htmlFor="monetized" className="text-white font-medium">Monetized</label>
                      <p className="text-xs text-slate-500">Channel is monetized</p>
                    </div>
                  </div>
                </>
              )}

              {(formData.assetType === 'pubg' || formData.assetType === 'freefire') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Account Level</label>
                    <input
                      type="number"
                      value={formData.accountLevel}
                      onChange={(e) => setFormData({ ...formData, accountLevel: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">{formData.assetType === 'pubg' ? 'UC Balance' : 'Diamonds'}</label>
                    <input
                      type="number"
                      value={formData.accountUC}
                      onChange={(e) => setFormData({ ...formData, accountUC: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Skins</label>
                    <input
                      type="number"
                      value={formData.accountSkins}
                      onChange={(e) => setFormData({ ...formData, accountSkins: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Rank</label>
                    <select
                      value={formData.accountRank}
                      onChange={(e) => setFormData({ ...formData, accountRank: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="">Select Rank</option>
                      {formData.assetType === 'pubg' ? (
                        <>
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                          <option value="diamond">Diamond</option>
                          <option value="crown">Crown</option>
                          <option value="ace">Ace</option>
                          <option value="conqueror">Conqueror</option>
                        </>
                      ) : (
                        <>
                          <option value="heroic">Heroic</option>
                          <option value="master">Master</option>
                          <option value="grandmaster">Grandmaster</option>
                          <option value="legend">Legend</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Media</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleImageRemove(idx)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleImageUrlAdd}
                  className="aspect-video bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-colors"
                >
                  <Plus className="w-8 h-8" />
                  <span className="text-sm mt-1">Add Image</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Review & Submit</h2>
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white">{ASSET_TYPES.find(t => t.id === formData.assetType)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Title</span>
                  <span className="text-white">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price</span>
                  <span className="text-green-400 font-bold">৳{Number(formData.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Negotiable</span>
                  <span className="text-white">{formData.negotiable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Images</span>
                  <span className="text-white">{formData.images.length} uploaded</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <button
              onClick={handlePrev}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          ) : (
            <button
              onClick={() => navigate('/marketplace/my-listings')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl"
          >
            {currentStep === 4 ? 'Update Listing' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

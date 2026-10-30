import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Loader2, ChevronRight, ArrowRight, Upload, User, MapPin, X } from 'lucide-react';
import api from '../../../lib/axios';
import { useShopContext } from '../../../store/ShopContext';

export default function TraderKyc() {
  const navigate = useNavigate();
  const { isLoggedIn, showAlert } = useShopContext();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [kycData, setKycData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nidNumber: '',
    dateOfBirth: '',
    district: '',
    upazila: '',
    city: '',
    postCode: '',
    country: 'Bangladesh',
    address: '',
    nidFront: '',
    nidBack: '',
    selfieImage: '',
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/sign-in');
      return;
    }
    fetchKYCStatus();
  }, [isLoggedIn]);

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get('/kyc/status');
      if (res.data.success) {
        setKycStatus(res.data.kycStatus || 'none');
        setKycData(res.data.kyc);
        if (res.data.kyc) {
          setFormData(prev => ({
            ...prev,
            fullName: res.data.kyc.fullName || '',
            phone: res.data.kyc.phone || '',
            nidNumber: res.data.kyc.nidNumber || '',
            dateOfBirth: res.data.kyc.dateOfBirth || '',
            district: res.data.kyc.district || '',
            upazila: res.data.kyc.upazila || '',
            city: res.data.kyc.city || '',
            postCode: res.data.kyc.postCode || '',
            country: res.data.kyc.country || 'Bangladesh',
            address: res.data.kyc.address || '',
            nidFront: res.data.kyc.nidFront || '',
            nidBack: res.data.kyc.nidBack || '',
            selfieImage: res.data.kyc.selfieImage || '',
          }));
        }
        if (res.data.kycStatus === 'none' || res.data.kycStatus === 'rejected') {
          setShowForm(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'nidFront' | 'nidBack' | 'selfieImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'File Too Large', 'Image must be less than 5MB.');
      return;
    }

    try {
      const formDataImg = new FormData();
      formDataImg.append('file', file);
      const res = await api.post('/upload', formDataImg, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.url) {
        setFormData(prev => ({ ...prev, [field]: res.data.url }));
        const label = field === 'nidFront' ? 'NID Front' : field === 'nidBack' ? 'NID Back' : 'Selfie';
        showAlert('success', 'Image Uploaded', `${label} uploaded successfully`);
      }
    } catch {
      showAlert('error', 'Upload Failed', 'Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nidFront || !formData.nidBack || !formData.selfieImage) {
      showAlert('error', 'Missing Images', 'Please upload all three images: NID Front, NID Back, and Selfie with NID.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/kyc/submit', formData);
      if (res.data.success) {
        setKycStatus('pending');
        setShowForm(false);
        showAlert('success', 'KYC Submitted', res.data.message || 'Your KYC has been submitted. Please wait for admin review.');
      } else {
        showAlert('error', 'Submission Failed', res.data.error || 'Failed to submit KYC.');
      }
    } catch {
      showAlert('error', 'Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Become A Trader</h1>
          <p className="text-slate-400">Complete KYC verification to publish listings on the marketplace</p>
        </div>

        {kycStatus === 'approved' && (
          <div className="bg-green-900/30 backdrop-blur-lg border border-green-500/30 rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Verified Trader</h2>
            <p className="text-green-300 mb-6">Your identity has been verified. You can now publish listings on the marketplace.</p>
            <button onClick={() => navigate('/marketplace/list-items')} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all">
              Create Listing <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {kycStatus === 'pending' && !showForm && (
          <div className="bg-yellow-900/30 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Under Review</h2>
            <p className="text-yellow-300 mb-4">Your KYC application is being reviewed by our admin team.</p>
            <p className="text-yellow-400/60 text-sm">Submitted on {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}

        {kycStatus === 'rejected' && !showForm && (
          <div className="bg-red-900/30 backdrop-blur-lg border border-red-500/30 rounded-2xl p-8 text-center">
            <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Application Rejected</h2>
            {kycData?.rejectionReason && (
              <div className="bg-red-900/50 rounded-xl p-4 mb-6 max-w-lg mx-auto">
                <p className="text-red-300 text-sm font-medium mb-1">Reason:</p>
                <p className="text-red-200">{kycData.rejectionReason}</p>
              </div>
            )}
            <p className="text-red-300/60 text-sm mb-6">You can update your information and resubmit your application.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all">
              Resubmit Application <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">NID Number *</label>
                <input type="text" name="nidNumber" value={formData.nidNumber} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter NID number" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white flex items-center gap-2 pt-4">
              <MapPin className="w-5 h-5 text-purple-500" />
              Address Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Address *</label>
                <textarea name="address" value={formData.address} onChange={handleChange} required rows={2}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  placeholder="Enter your full address" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">District *</label>
                <input type="text" name="district" value={formData.district} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter district" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Upazila *</label>
                <input type="text" name="upazila" value={formData.upazila} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter upazila" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">City *</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter city" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Post Code *</label>
                <input type="text" name="postCode" value={formData.postCode} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter post code" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Country *</label>
                <select name="country" value={formData.country} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="India">India</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Nepal">Nepal</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-white flex items-center gap-2 pt-4">
              <Upload className="w-5 h-5 text-purple-500" />
              Verification Images
            </h2>
            <p className="text-slate-400 text-sm">Upload clear images of your NID card and a selfie holding your NID.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['nidFront', 'nidBack', 'selfieImage'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm text-slate-400 mb-2">
                    {field === 'nidFront' ? 'NID Front' : field === 'nidBack' ? 'NID Back' : 'Selfie with NID'} *
                  </label>
                  <div className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center hover:border-purple-500 transition-colors">
                    {formData[field] ? (
                      <div className="relative">
                        <img src={formData[field]} alt={field} className="w-full h-32 object-contain rounded-lg" />
                        <button type="button" onClick={() => setFormData({ ...formData, [field]: '' })}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">✕</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Upload</p>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, field)} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {kycStatus === 'rejected' ? 'Resubmitting...' : 'Submitting...'}</>
              ) : (
                <>{kycStatus === 'rejected' ? 'Resubmit Application' : 'Submit for Verification'} <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

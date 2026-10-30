import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, CheckCircle, AlertCircle, Package, DollarSign,
  MapPin, Phone, Mail, Tag, Clock, History, ChevronRight,
  RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import { useShopContext } from '../../store/ShopContext';
import api from '../../lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
type SubmissionStatus = 'pending' | 'approved' | 'rejected';

interface Submission {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  condition: string;
  count: number;
  paymentMethod: string;
  paymentDetails: string;
  images: string[];
  contactEmail: string;
  contactPhone: string;
  location: string;
  status: SubmissionStatus;
  submittedAt: string;
  userName?: string;
  adminNotice?: string;
  statusUpdatedAt?: string;
}

// Color mapping for dynamic Tailwind classes (JIT-safe)
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  purple: { bg: 'rgba(168,85,247,0.2)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  green: { bg: 'rgba(34,197,94,0.2)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  yellow: { bg: 'rgba(234,179,8,0.2)', text: '#eab308', border: 'rgba(234,179,8,0.3)' },
  red: { bg: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

// ─── Progress Tracker Component ───────────────────────────────────────────────
function SellProgressTracker({ status }: { status: SubmissionStatus }) {
  const steps = [
    { label: 'Submitted', icon: Package, desc: 'Product received' },
    { label: 'Under Review', icon: Clock, desc: 'Admin reviewing' },
    { label: 'Decision', icon: CheckCircle, desc: status === 'approved' ? 'Approved!' : status === 'rejected' ? 'Rejected' : 'Awaiting...' },
  ];

  const activeStep = status === 'pending' ? 1 : 2;
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <div className="flex items-center gap-0 w-full mt-3">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isComplete = idx < activeStep || (idx === 2 && (isApproved || isRejected));
        const isActive = idx === activeStep && status === 'pending';
        const isFinal = idx === 2;

        let circleClass = 'bg-white/10 border-white/20 text-gray-500';
        if (isFinal && isApproved) circleClass = 'bg-green-500/20 border-green-500 text-green-400';
        else if (isFinal && isRejected) circleClass = 'bg-red-500/20 border-red-500 text-red-400';
        else if (isComplete) circleClass = 'bg-blue-500/20 border-blue-500 text-blue-400';
        else if (isActive) circleClass = 'bg-yellow-500/20 border-yellow-500 text-yellow-400 animate-pulse';

        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${circleClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                isFinal && isApproved ? 'text-green-400'
                : isFinal && isRejected ? 'text-red-400'
                : isComplete || isActive ? 'text-white'
                : 'text-gray-500'
              }`}>{step.label}</span>
              <span className="text-[10px] text-gray-500 whitespace-nowrap">{step.desc}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${
                idx < activeStep ? 'bg-blue-500' : 'bg-white/10'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Submission Progress Component ───────────────────────────────────────────
function SubmissionProgress({ progress }: { progress: number }) {
  const steps = [
    { label: 'Validating', desc: 'Checking form data', progress: 20 },
    { label: 'Uploading', desc: 'Processing images', progress: 40 },
    { label: 'Submitting', desc: 'Sending to server', progress: 60 },
    { label: 'Processing', desc: 'Server processing', progress: 80 },
    { label: 'Complete', desc: 'Submission successful', progress: 100 },
  ];

  const currentStep = Math.floor(progress / 20);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Submitting Product</h3>
        <span className="text-blue-400 text-sm font-medium">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isComplete = idx < currentStep;
          const isPending = idx > currentStep;

          return (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isComplete ? 'bg-green-500/20 border-green-500' :
                isActive ? 'bg-blue-500/20 border-blue-500' :
                'bg-white/10 border-white/20'
              } border-2`}>
                {isComplete ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : isActive ? (
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isComplete ? 'text-green-400' :
                  isActive ? 'text-white' :
                  'text-gray-500'
                }`}>{step.label}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SubmissionStatus }) {
  const map = {
    pending: { label: 'Pending', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    approved: { label: 'Approved', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    rejected: { label: 'Rejected', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const { label, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'approved' && <CheckCircle className="w-3 h-3" />}
      {status === 'rejected' && <AlertCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ─── Submission Card ──────────────────────────────────────────────────────────
function SubmissionCard({ sub }: { sub: Submission }) {
  const [expanded, setExpanded] = useState(false);
  const currencySymbol = sub.currency === 'BDT' ? '৳' : sub.currency === 'USD' ? '$' : '₮';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      {/* Header row */}
      <div className="p-4 flex items-start gap-4">
        {/* Thumbnail */}
        {sub.images && sub.images.length > 0 ? (
          <img src={sub.images[0]} alt={sub.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-7 h-7 text-gray-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h4 className="text-white font-semibold truncate">{sub.name}</h4>
              <p className="text-gray-400 text-sm mt-0.5">
                {currencySymbol}{sub.price.toLocaleString()} · Qty: {sub.count} · {sub.condition}
              </p>
            </div>
            <StatusBadge status={sub.status} />
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Submitted: {new Date(sub.submittedAt).toLocaleDateString('en-BD', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="px-4 pb-2">
        <SellProgressTracker status={sub.status} />
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-400 hover:text-white border-t border-white/10 transition-colors"
      >
        {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        {expanded ? 'Hide Details' : 'View Details'}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2 text-sm">
          <p className="text-gray-300"><span className="text-gray-500">Description:</span> {sub.description}</p>
          <p className="text-gray-300"><span className="text-gray-500">Payment:</span> {sub.paymentMethod} — {sub.paymentDetails}</p>
          {sub.location && <p className="text-gray-300"><span className="text-gray-500">Location:</span> {sub.location}</p>}
          {sub.images && sub.images.length > 1 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {sub.images.map((img, i) => (
                <img key={i} src={img} alt={`img-${i}`} className="w-14 h-14 object-cover rounded-lg" />
              ))}
            </div>
          )}
          {/* Status message */}
          {sub.status === 'approved' && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">
              🎉 Your product has been approved! Admin will contact you via {sub.contactPhone} or {sub.contactEmail} to finalize the purchase.
              {sub.adminNotice && (
                <div className="mt-2 pt-2 border-t border-green-500/20">
                  <p className="font-bold text-yellow-400">Admin Message:</p>
                  <p className="text-white">{sub.adminNotice}</p>
                </div>
              )}
              {sub.statusUpdatedAt && (
                <p className="mt-2 text-green-300/70 text-[10px]">
                  Updated: {new Date(sub.statusUpdatedAt).toLocaleDateString('en-BD', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          )}
          {sub.status === 'rejected' && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
              ❌ Unfortunately, this submission was not accepted. You may submit a revised product listing.
              {sub.adminNotice && (
                <div className="mt-2 pt-2 border-t border-red-500/20">
                  <p className="font-bold text-yellow-400">Admin Message:</p>
                  <p className="text-white">{sub.adminNotice}</p>
                </div>
              )}
              {sub.statusUpdatedAt && (
                <p className="mt-2 text-red-300/70 text-[10px]">
                  Updated: {new Date(sub.statusUpdatedAt).toLocaleDateString('en-BD', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          )}
          {sub.status === 'pending' && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-xs">
              ⏳ Your submission is under review. Admin will contact you within 24–48 hours if interested.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SellYourProductPage() {
  const navigate = useNavigate();
  const {
    getTotalItems, setIsCartOpen, view, setView, menuOpen, setMenuOpen,
    theme, toggleTheme, username, isLoggedIn, userEmail,
    setUserEmail, setUsername, userImage, setUserImage, alertConfig,
    setAlertConfig, showAlert,
  } = useShopContext();

  const menuRef = useRef<HTMLDivElement>(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // ── Form state ──
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', currency: 'BDT',
    condition: 'new', count: '1', paymentMethod: '', paymentDetails: '',
    images: [] as string[], contactEmail: '', contactPhone: '',
    location: '', userName: '',
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionProgress, setSubmissionProgress] = useState(0);

  // ── History state ──
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Fetch history
  const fetchHistory = useCallback(async () => {
    const email = userEmail;
    if (!email) {
      setHistoryError('Please sign in to view your submission history.');
      return;
    }
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await api.get(`/user-products?email=${encodeURIComponent(email)}`);
      const data = res.data;
      if (data.success) {
        setSubmissions(data.data);
      } else {
        setHistoryError('Failed to load submissions.');
      }
    } catch {
      setHistoryError('Network error. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  }, [userEmail]);

  // Load history when tab switches
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const conditions = [
    { value: 'new', label: 'New', description: 'Brand new, never used' },
    { value: 'used', label: 'Used', description: 'Pre-owned, good condition' },
    { value: 'refurbished', label: 'Refurbished', description: 'Restored to working condition' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImageUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const response = await api.post('/admin/upload', fd);
        const result = response.data;
        if (result.success) return result.url;
        throw new Error(result.error || 'Upload failed');
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      alert('Failed to upload images. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];

    // Try to delete from Cloudinary if it's a Cloudinary URL
    if (imageUrl.includes('cloudinary.com')) {
      try {
        await api.post('/admin/delete-image', { imageUrl });
      } catch (error) {
        // silently fail
      }
    }

    // Remove from form state
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setSubmissionProgress(0);

    if (!formData.name || !formData.description || !formData.price ||
      !formData.count || !formData.paymentMethod || !formData.paymentDetails ||
      !formData.contactEmail || !formData.contactPhone) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitStatus('error');
      setSubmitting(false);
      setSubmissionProgress(0);
      return;
    }

    try {
      // Step 1: Validating form data
      setSubmissionProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Processing images (if any)
      setSubmissionProgress(40);
      if (formData.images.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Step 3: Submitting to server
      setSubmissionProgress(60);
      const response = await api.post('/user-products', { ...formData, price: parseFloat(formData.price) });

      // Step 4: Server processing
      setSubmissionProgress(80);
      const data = response.data;

      // Step 5: Complete
      setSubmissionProgress(100);

      if (data.success) {
        setSubmitStatus('success');
        setFormData({
          name: '', description: '', price: '', currency: 'BDT',
          condition: 'new', count: '1', paymentMethod: '', paymentDetails: '',
          images: [], contactEmail: userEmail || '',
          contactPhone: '', location: '', userName: '',
        });
        // Reset progress after a delay
        setTimeout(() => setSubmissionProgress(0), 2000);
      } else {
        setErrorMessage(data.error || 'Failed to submit product. Please try again.');
        setSubmitStatus('error');
        setSubmissionProgress(0);
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      setSubmitStatus('error');
      setSubmissionProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats for history tab
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a061e] via-[#0f0a1e] to-[#0a061e]">
      {/* Page Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sell Your Product</h1>
              <p className="text-gray-400 mt-1">Submit your product for direct sale to admin</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'submit'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Package className="w-4 h-4" />
              Submit Product
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              My Submissions
              {stats.total > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{stats.total}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── SUBMIT TAB ── */}
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                {submitting && submissionProgress > 0 && (
                  <div className="mb-6">
                    <SubmissionProgress progress={submissionProgress} />
                  </div>
                )}
                {submitStatus === 'success' ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Product Submitted Successfully!</h2>
                    <p className="text-gray-400 mb-6">Your product has been submitted. Admin will review and contact you if interested in purchasing.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setSubmitStatus('idle')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                      >
                        Submit Another Product
                      </button>
                      <button
                        onClick={() => { setSubmitStatus('idle'); setActiveTab('history'); }}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 justify-center"
                      >
                        <History className="w-4 h-4" />
                        View My Submissions
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <Tag className="w-4 h-4 text-blue-400" />
                        Product Name *
                      </label>
                      <input
                        type="text" name="name" value={formData.name} onChange={handleInputChange}
                        placeholder="Enter the name of the product you want to sell"
                        className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <Package className="w-4 h-4 text-green-400" />
                        Description *
                      </label>
                      <textarea
                        name="description" value={formData.description} onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe your product in detail. Include features, specifications, and any other relevant information..."
                        className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                        required
                      />
                    </div>

                    {/* Price & Currency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          Price *
                        </label>
                        <input
                          type="number" name="price" value={formData.price} onChange={handleInputChange}
                          placeholder="0.00" step="0.01"
                          className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-white mb-2 block">Currency</label>
                        <select
                          name="currency" value={formData.currency} onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        >
                          <option value="BDT" className="bg-slate-900">BDT (৳)</option>
                          <option value="USD" className="bg-slate-900">USD ($)</option>
                          <option value="USDT" className="bg-slate-900">USDT (₮)</option>
                        </select>
                      </div>
                    </div>

                    {/* Count */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        Quantity *
                      </label>
                      <input
                        type="number" name="count" value={formData.count} onChange={handleInputChange}
                        placeholder="1" min="1"
                        className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <Tag className="w-4 h-4 text-purple-400" />
                        Preferred Payment Method *
                      </label>
                      <select
                        name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        required
                      >
                        <option value="" className="bg-slate-900">Select payment method</option>
                        <option value="bKash" className="bg-slate-900">bKash</option>
                        <option value="Nagad" className="bg-slate-900">Nagad</option>
                        <option value="Rocket" className="bg-slate-900">Rocket</option>
                        <option value="Bank Transfer" className="bg-slate-900">Bank Transfer</option>
                        <option value="USDT (TRC20)" className="bg-slate-900">USDT (TRC20)</option>
                        <option value="USDT (BEP20)" className="bg-slate-900">USDT (BEP20)</option>
                      </select>
                    </div>

                    {/* Payment Details */}
                    {formData.paymentMethod && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                          <Tag className="w-4 h-4 text-blue-400" />
                          {formData.paymentMethod === 'bKash' && 'bKash Number'}
                          {formData.paymentMethod === 'Nagad' && 'Nagad Number'}
                          {formData.paymentMethod === 'Rocket' && 'Rocket Number'}
                          {formData.paymentMethod === 'Bank Transfer' && 'Bank Account Details'}
                          {formData.paymentMethod === 'USDT (TRC20)' && 'USDT (TRC20) Wallet Address'}
                          {formData.paymentMethod === 'USDT (BEP20)' && 'USDT (BEP20) Wallet Address'}
                          {' *'}
                        </label>
                        <input
                          type="text" name="paymentDetails" value={formData.paymentDetails} onChange={handleInputChange}
                          placeholder={
                            formData.paymentMethod === 'bKash' ? 'e.g., 017XXXXXXXX'
                            : formData.paymentMethod === 'Nagad' ? 'e.g., 018XXXXXXXX'
                            : formData.paymentMethod === 'Rocket' ? 'e.g., 019XXXXXXXX'
                            : formData.paymentMethod === 'Bank Transfer' ? 'Account number, bank name, routing number'
                            : formData.paymentMethod === 'USDT (TRC20)' ? 'TRC20 wallet address'
                            : formData.paymentMethod === 'USDT (BEP20)' ? 'BEP20 wallet address'
                            : 'Enter payment details'
                          }
                          className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          required
                        />
                      </div>
                    )}

                    {/* Condition */}
                    <div>
                      <label className="text-sm font-semibold text-white mb-3 block">Condition</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {conditions.map((cond) => (
                          <label
                            key={cond.value}
                            className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all ${
                              formData.condition === cond.value
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/20 bg-black/30 hover:border-white/40'
                            }`}
                          >
                            <input
                              type="radio" name="condition" value={cond.value}
                              checked={formData.condition === cond.value}
                              onChange={handleInputChange} className="sr-only"
                            />
                            <div className="text-white font-semibold">{cond.label}</div>
                            <div className="text-xs text-gray-400 mt-1">{cond.description}</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <label className="text-sm font-semibold text-white mb-3 block">Product Images</label>
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-colors">
                        <input
                          type="file" multiple accept="image/*"
                          onChange={handleImageUpload} className="hidden" id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="text-white font-medium">Click to upload images</p>
                          <p className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP up to 5MB each</p>
                        </label>
                      </div>
                      {imageUploading && (
                        <div className="flex items-center gap-2 mt-3 text-blue-400 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                          Uploading images...
                        </div>
                      )}
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {formData.images.map((url, index) => (
                            <div key={index} className="relative group">
                              <img src={url} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                              <button
                                type="button" onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="bg-black/20 rounded-xl p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                          <Mail className="w-4 h-4 text-blue-400" />
                          Email *
                        </label>
                        <input
                          type="email" name="contactEmail" value={formData.contactEmail} onChange={handleInputChange}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                          <Phone className="w-4 h-4 text-green-400" />
                          Phone *
                        </label>
                        <input
                          type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange}
                          placeholder="+880 1XXX-XXXXXX"
                          className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          Location
                        </label>
                        <input
                          type="text" name="location" value={formData.location} onChange={handleInputChange}
                          placeholder="e.g., Dhaka, Bangladesh"
                          className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {submitStatus === 'error' && (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{errorMessage}</p>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit" disabled={submitting || imageUploading}
                      className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span className="text-black">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-5 h-5" />
                          Submit Product for Review
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              {/* How It Works */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
                <div className="space-y-4">
                  {[
                    { num: '1', color: 'blue', title: 'Submit Your Product', desc: 'Fill in the product details and upload images' },
                    { num: '2', color: 'purple', title: 'Admin Review', desc: 'Admin reviews your submission within 24-48 hours' },
                    { num: '3', color: 'green', title: 'Direct Purchase', desc: 'If interested, admin will contact you to purchase directly' },
                  ].map(({ num, color, title, desc }) => (
                    <div key={num} className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: colorMap[color]?.bg || 'rgba(59,130,246,0.2)' }}
                      >
                        <span
                          className="font-bold text-sm"
                          style={{ color: colorMap[color]?.text || '#60a5fa' }}
                        >
                          {num}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{title}</p>
                        <p className="text-gray-400 text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Selling Guidelines</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                  {[
                    'Provide accurate product descriptions',
                    'Upload clear, high-quality images',
                    'Set reasonable prices for direct sale',
                    'Provide valid contact information',
                    'Be ready for admin contact if interested',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
                <p className="text-gray-400 text-sm mb-4">Our support team is here to assist you with any questions.</p>
                <a
                  href="/contact-us"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            {/* Stats Row */}
            {submissions.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total', value: stats.total, color: 'blue' },
                  { label: 'Pending', value: stats.pending, color: 'yellow' },
                  { label: 'Approved', value: stats.approved, color: 'green' },
                  { label: 'Rejected', value: stats.rejected, color: 'red' },
                ].map(({ label, value, color }) => {
                  const c = colorMap[color] || colorMap.blue;
                  return (
                    <div
                      key={label}
                      className="rounded-2xl p-4 text-center"
                      style={{
                        backgroundColor: c.bg,
                        borderColor: c.border,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      }}
                    >
                      <div className="text-2xl font-bold" style={{ color: c.text }}>{value}</div>
                      <div className="text-gray-400 text-sm mt-1">{label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">My Submission History</h2>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Loading */}
            {historyLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400">Loading your submissions...</p>
              </div>
            )}

            {/* Error */}
            {!historyLoading && historyError && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400">{historyError}</p>
                {!isLoggedIn && (
                  <button
                    onClick={() => navigate('/sign-in')}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {!historyLoading && !historyError && submissions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-white font-semibold text-lg">No submissions yet</h3>
                <p className="text-gray-400 text-sm text-center max-w-sm">
                  You haven't submitted any products for sale yet. Go to the Submit tab to get started!
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <Package className="w-4 h-4" />
                  Submit a Product
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Submissions list */}
            {!historyLoading && !historyError && submissions.length > 0 && (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <SubmissionCard key={sub._id} sub={sub} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

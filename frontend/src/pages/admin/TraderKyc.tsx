import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, Users, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus,
  Search, RefreshCw, Filter, Eye, ChevronDown, ChevronUp,
  MapPin, Calendar, Phone, Mail, CreditCard, MoreVertical,
  User, AlertTriangle, Image as ImageIcon,
  ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight,
  X, ArrowLeft
} from 'lucide-react';
import api from '../../lib/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KYCSubmission {
  _id: string;
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  nidNumber: string;
  dateOfBirth: string;
  district: string;
  upazila: string;
  city: string;
  postCode: string;
  country: string;
  address: string;
  nidFront: string;
  nidBack: string;
  selfieImage: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface KycCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

// ---------------------------------------------------------------------------
// KycStatusBadge
// ---------------------------------------------------------------------------

function KycStatusBadge({ status, size = 'md' }: { status: KYCSubmission['status']; size?: 'sm' | 'md' | 'lg' }) {
  const config: Record<string, { icon: React.ReactNode; label: string; bgClass: string; textClass: string; borderClass: string }> = {
    pending: {
      icon: <Clock className="w-3 h-3 md:w-4 md:h-4" />,
      label: 'Pending',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
    },
    approved: {
      icon: <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />,
      label: 'Approved',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30',
    },
    rejected: {
      icon: <XCircle className="w-3 h-3 md:w-4 md:h-4" />,
      label: 'Rejected',
      bgClass: 'bg-rose-500/10',
      textClass: 'text-rose-400',
      borderClass: 'border-rose-500/30',
    },
  };

  const c = config[status];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${c.bgClass} ${c.textClass} ${c.borderClass} ${sizeClasses[size]}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KycStats
// ---------------------------------------------------------------------------

function StatCard({ title, value, icon, accentClass, iconBgClass, valueClass }: {
  title: string; value: number; icon: React.ReactNode; accentClass: string; iconBgClass: string; valueClass: string;
}) {
  return (
    <div className="relative overflow-hidden bg-slate-800/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:shadow-black/20 group">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentClass}`} />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 truncate">{title}</p>
          <p className={`text-2xl md:text-3xl font-bold ${valueClass} transition-colors`}>{value.toLocaleString()}</p>
        </div>
        <div className={`p-2.5 md:p-3 rounded-xl ${iconBgClass} transition-transform group-hover:scale-110`}>{icon}</div>
      </div>
    </div>
  );
}

function KycStats({ counts }: { counts: KycCounts }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard title="Total Applications" value={counts.total} icon={<ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />} accentClass="bg-gradient-to-r from-blue-500 to-cyan-500" iconBgClass="bg-blue-500/20" valueClass="text-white" />
      <StatCard title="Pending Review" value={counts.pending} icon={<Clock className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />} accentClass="bg-gradient-to-r from-amber-400 to-yellow-500" iconBgClass="bg-amber-500/20" valueClass="text-amber-400" />
      <StatCard title="Approved" value={counts.approved} icon={<CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />} accentClass="bg-gradient-to-r from-emerald-400 to-teal-500" iconBgClass="bg-emerald-500/20" valueClass="text-emerald-400" />
      <StatCard title="Rejected" value={counts.rejected} icon={<XCircle className="w-5 h-5 md:w-6 md:h-6 text-rose-400" />} accentClass="bg-gradient-to-r from-rose-400 to-red-500" iconBgClass="bg-rose-500/20" valueClass="text-rose-400" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KycFilters
// ---------------------------------------------------------------------------

const filterTabs: { value: FilterStatus; label: string; colorClass: string }[] = [
  { value: 'all', label: 'All', colorClass: 'bg-slate-600 hover:bg-slate-500 active:bg-slate-400' },
  { value: 'pending', label: 'Pending', colorClass: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-400' },
  { value: 'approved', label: 'Approved', colorClass: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400' },
  { value: 'rejected', label: 'Rejected', colorClass: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-400' },
];

function KycFilters({ searchQuery, onSearchChange, filter, onFilterChange, onRefresh, isLoading }: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or NID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all duration-200"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-white/5">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${filter === tab.value ? `${tab.colorClass} text-white shadow-lg` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${showMobileFilters ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">{filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
          </button>
          <button onClick={onRefresh} disabled={isLoading} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all disabled:opacity-50">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {showMobileFilters && (
          <div className="flex flex-wrap gap-2 p-2 bg-slate-900/60 rounded-xl border border-white/5">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { onFilterChange(tab.value); setShowMobileFilters(false); }}
                className={`flex-1 min-w-[calc(50%-0.5rem)] px-3 py-2 text-sm font-medium rounded-lg transition-all ${filter === tab.value ? `${tab.colorClass} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KycTable
// ---------------------------------------------------------------------------

function KycTable({ kycList, processing, onView, onApprove, onReject }: {
  kycList: KYCSubmission[];
  processing: string | null;
  onView: (k: KYCSubmission) => void;
  onApprove: (id: string) => void;
  onReject: (k: KYCSubmission) => void;
}) {
  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/60 border-b border-white/5">
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Applicant</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">NID Number</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Submitted</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {kycList.map((kyc) => (
              <tr key={kyc._id} className="hover:bg-white/[0.02] transition-colors duration-200 group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                      {getInitials(kyc.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{kyc.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{kyc._id.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-slate-300"><Mail className="w-3.5 h-3.5 text-slate-500" /><span className="truncate max-w-[160px]">{kyc.email}</span></div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-400"><Phone className="w-3.5 h-3.5 text-slate-500" /><span>{kyc.phone}</span></div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="w-3.5 h-3.5 text-slate-500" /><span>{kyc.city}, {kyc.district}</span></div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-300"><CreditCard className="w-3.5 h-3.5 text-slate-500" /><span className="font-mono">{kyc.nidNumber}</span></div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-400"><Calendar className="w-3.5 h-3.5 text-slate-500" /><span>{formatDate(kyc.submittedAt)}</span></div>
                </td>
                <td className="px-5 py-4">
                  <KycStatusBadge status={kyc.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onView(kyc)} className="p-2 bg-slate-700/50 hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 rounded-lg transition-all duration-200" title="View Details"><Eye className="w-4 h-4" /></button>
                    {kyc.status === 'pending' && (
                      <>
                        <button onClick={() => onApprove(kyc._id)} disabled={processing === kyc._id} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-400 text-emerald-500 rounded-lg transition-all duration-200 disabled:opacity-50" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => onReject(kyc)} disabled={processing === kyc._id} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 text-rose-500 rounded-lg transition-all duration-200 disabled:opacity-50" title="Reject"><XCircle className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-white/5">
        {kycList.map((kyc) => (
          <div key={kyc._id} className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">{getInitials(kyc.fullName)}</div>
                <div>
                  <p className="font-semibold text-white">{kyc.fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">{kyc._id.slice(-8)}</p>
                </div>
              </div>
              <KycStatusBadge status={kyc.status} size="sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 rounded-xl p-3 space-y-1"><p className="text-xs text-slate-500">Email</p><p className="text-sm text-slate-200 truncate">{kyc.email}</p></div>
              <div className="bg-slate-900/60 rounded-xl p-3 space-y-1"><p className="text-xs text-slate-500">Phone</p><p className="text-sm text-slate-200">{kyc.phone}</p></div>
              <div className="bg-slate-900/60 rounded-xl p-3 space-y-1"><p className="text-xs text-slate-500">Location</p><p className="text-sm text-slate-200">{kyc.city}, {kyc.district}</p></div>
              <div className="bg-slate-900/60 rounded-xl p-3 space-y-1"><p className="text-xs text-slate-500">NID</p><p className="text-sm text-slate-200 font-mono">{kyc.nidNumber}</p></div>
              <div className="bg-slate-900/60 rounded-xl p-3 space-y-1 col-span-2"><p className="text-xs text-slate-500">Submitted</p><p className="text-sm text-slate-200">{formatDate(kyc.submittedAt)}</p></div>
            </div>
            {kyc.status === 'pending' ? (
              <div className="flex gap-2">
                <button onClick={() => onView(kyc)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all"><Eye className="w-4 h-4" /> View</button>
                <button onClick={() => onApprove(kyc._id)} disabled={processing === kyc._id} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Approve</button>
                <button onClick={() => onReject(kyc)} disabled={processing === kyc._id} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"><XCircle className="w-4 h-4" /> Reject</button>
              </div>
            ) : (
              <button onClick={() => onView(kyc)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all"><Eye className="w-4 h-4" /> View Details</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KycDocumentModal
// ---------------------------------------------------------------------------

function KycDocumentModal({ images, isOpen, onClose }: {
  images: { label: string; url: string }[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) { setSelectedIndex(0); setZoom(1); setIsLoaded(false); }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setSelectedIndex(i => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === 'ArrowRight') setSelectedIndex(i => (i < images.length - 1 ? i + 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen) return null;

  const currentImage = images[selectedIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
      <div className="relative w-full max-w-5xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
          <span className="px-3 text-sm text-white font-medium">{selectedIndex + 1} / {images.length}</span>
          <div className="w-px h-6 bg-white/20" />
          <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ZoomIn className="w-4 h-4 text-white" /></button>
          <span className="text-xs text-white/60 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ZoomOut className="w-4 h-4 text-white" /></button>
          <div className="w-px h-6 bg-white/20" />
          <button onClick={() => { const a = document.createElement('a'); a.href = currentImage.url; a.download = `${currentImage.label.toLowerCase().replace(/\s+/g, '-')}.jpg`; a.target = '_blank'; a.click(); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Download className="w-4 h-4 text-white" /></button>
        </div>
        {images.length > 1 && (
          <>
            <button onClick={() => setSelectedIndex(i => (i > 0 ? i - 1 : images.length - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 transition-all"><ChevronLeft className="w-6 h-6 text-white" /></button>
            <button onClick={() => setSelectedIndex(i => (i < images.length - 1 ? i + 1 : 0))} className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 transition-all"><ChevronRight className="w-6 h-6 text-white" /></button>
          </>
        )}
        <div className="flex items-center justify-center h-[80vh] bg-black/50 rounded-2xl overflow-hidden">
          {!isLoaded && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
          <img key={selectedIndex} src={currentImage.url} alt={currentImage.label} className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `scale(${zoom})` }} onLoad={() => setIsLoaded(true)} />
        </div>
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 overflow-x-auto">
            {images.map((img, i) => (
              <button key={i} onClick={() => { setSelectedIndex(i); setIsLoaded(false); }} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === i ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-transparent hover:border-white/30'}`}>
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <p className="text-center text-sm text-white/60 mt-3">{currentImage.label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KycDetailModal
// ---------------------------------------------------------------------------

function InfoCard({ label, value, icon, highlight, bgClass = 'bg-slate-800/40' }: {
  label: string; value: string | React.ReactNode; icon?: React.ReactNode; highlight?: string; bgClass?: string;
}) {
  return (
    <div className={`${bgClass} rounded-xl p-4 space-y-1`}>
      <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">{icon && <span className="text-slate-500">{icon}</span>}{label}</p>
      <p className={`text-sm font-medium ${highlight || 'text-slate-100'}`}>{value}</p>
    </div>
  );
}

function KycDetailModal({ kyc, isOpen, onClose, onApprove, onReject, processing }: {
  kyc: KYCSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (k: KYCSubmission) => void;
  processing: string | null;
}) {
  const [showDocModal, setShowDocModal] = useState(false);
  const [docImages, setDocImages] = useState<{ label: string; url: string }[]>([]);

  if (!isOpen || !kyc) return null;

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateTime = (ds: string) => new Date(ds).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleViewDocuments = () => {
    setDocImages([
      { label: 'NID Front', url: kyc.nidFront },
      { label: 'NID Back', url: kyc.nidBack },
      { label: 'Selfie with NID', url: kyc.selfieImage },
    ]);
    setShowDocModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl"><ShieldCheck className="w-5 h-5 text-blue-400" /></div>
              <div>
                <h2 className="text-lg font-bold text-white">KYC Verification Details</h2>
                <p className="text-xs text-slate-500">{kyc._id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KycStatusBadge status={kyc.status} size="md" />
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Personal Info */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider"><User className="w-4 h-4" /> Personal Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoCard label="Full Name" value={kyc.fullName} icon={<User className="w-3.5 h-3.5" />} highlight="text-white font-semibold" />
                <InfoCard label="Email" value={kyc.email} icon={<Mail className="w-3.5 h-3.5" />} />
                <InfoCard label="Phone" value={kyc.phone} icon={<Phone className="w-3.5 h-3.5" />} />
                <InfoCard label="NID Number" value={kyc.nidNumber} icon={<CreditCard className="w-3.5 h-3.5" />} />
                <InfoCard label="Date of Birth" value={kyc.dateOfBirth} icon={<Calendar className="w-3.5 h-3.5" />} />
                <InfoCard label="Country" value={kyc.country} icon={<MapPin className="w-3.5 h-3.5" />} />
              </div>
            </section>

            {/* Address */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider"><MapPin className="w-4 h-4" /> Address Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="md:col-span-3 bg-slate-800/40 rounded-xl p-4 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Full Address</p>
                  <p className="text-sm font-medium text-slate-100">{kyc.address}</p>
                </div>
                <InfoCard label="City" value={kyc.city} />
                <InfoCard label="District" value={kyc.district} />
                <InfoCard label="Upazila" value={kyc.upazila} />
                <InfoCard label="Post Code" value={kyc.postCode} />
                <InfoCard label="Submitted" value={formatDate(kyc.submittedAt)} />
              </div>
            </section>

            {/* Documents */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider"><ImageIcon className="w-4 h-4" /> Verification Documents</h3>
                <button onClick={handleViewDocuments} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium rounded-lg transition-colors"><ImageIcon className="w-3.5 h-3.5" /> View All</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'NID Front', url: kyc.nidFront },
                  { label: 'NID Back', url: kyc.nidBack },
                  { label: 'Selfie', url: kyc.selfieImage },
                ].map((doc, i) => (
                  <button key={i} onClick={() => { setDocImages([doc]); setShowDocModal(true); }} className="group relative aspect-[4/3] bg-slate-800/40 rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/30 transition-colors">
                    <img src={doc.url} alt={doc.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <p className="absolute bottom-2 left-2 text-xs font-medium text-white">{doc.label}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Review Info */}
            {kyc.reviewedAt && (
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider"><CheckCircle className="w-4 h-4" /> Review Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Reviewed By" value={kyc.reviewedBy || 'N/A'} />
                  <InfoCard label="Reviewed At" value={formatDateTime(kyc.reviewedAt)} />
                </div>
                {kyc.rejectionReason && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-rose-400"><AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason</p>
                    <p className="text-sm text-rose-200">{kyc.rejectionReason}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {kyc.status === 'pending' && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-slate-800/30">
              <button onClick={onClose} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors">Cancel</button>
              <button onClick={() => { onReject(kyc); onClose(); }} disabled={processing === kyc._id} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><X className="w-4 h-4" /> Reject</button>
              <button onClick={() => { onApprove(kyc._id); onClose(); }} disabled={processing === kyc._id} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Approve</button>
            </div>
          )}
        </div>
      </div>

      <KycDocumentModal images={docImages} isOpen={showDocModal} onClose={() => setShowDocModal(false)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// KycRejectModal
// ---------------------------------------------------------------------------

function KycRejectModal({ kyc, isOpen, onClose, reason, onReasonChange, onConfirm, processing }: {
  kyc: { _id: string; fullName: string } | null;
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  onReasonChange: (r: string) => void;
  onConfirm: () => void;
  processing: string | null;
}) {
  if (!isOpen || !kyc) return null;
  const isValid = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-rose-500/20 rounded-3xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl"><XCircle className="w-5 h-5 text-rose-400" /></div>
            <div>
              <h2 className="text-lg font-bold text-white">Reject KYC Application</h2>
              <p className="text-xs text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><XCircle className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-white/5">
            <p className="text-sm text-slate-400 mb-1">Rejecting application for</p>
            <p className="text-lg font-semibold text-white">{kyc.fullName}</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Rejection Reason <span className="text-rose-400">*</span></label>
            <textarea value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="Please provide a detailed reason for rejection (min. 10 characters)..." rows={4} className="w-full px-4 py-3 bg-slate-800/60 border border-white/5 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/30 resize-none transition-all" />
            <p className={`text-xs ${isValid ? 'text-emerald-400' : 'text-slate-500'}`}>{reason.length}/10 characters minimum</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-200">The user will be notified of this decision and can resubmit their KYC with corrections.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/5 bg-slate-800/20">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={!isValid || processing === kyc._id} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {processing === kyc._id ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : (
              <><XCircle className="w-4 h-4" /> Reject KYC</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TraderKyc() {
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [counts, setCounts] = useState<KycCounts>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  // Modal states
  const [detailModalKyc, setDetailModalKyc] = useState<KYCSubmission | null>(null);
  const [rejectModalKyc, setRejectModalKyc] = useState<KYCSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchKYCSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/admin/kyc', { params });
      if (res.data.success) {
        const data: KYCSubmission[] = res.data.data || [];
        setKycSubmissions(data);
        const p = data.reduce((acc, k) => {
          acc.total++;
          if (k.status === 'pending') acc.pending++;
          else if (k.status === 'approved') acc.approved++;
          else if (k.status === 'rejected') acc.rejected++;
          return acc;
        }, { total: 0, pending: 0, approved: 0, rejected: 0 });
        setCounts(p);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchKYCSubmissions();
  }, [fetchKYCSubmissions]);

  const handleApprove = async (kycId: string) => {
    setProcessing(kycId);
    try {
      const res = await api.put(`/admin/kyc/${kycId}`, { action: 'approve' });
      if (res.data.success) {
        fetchKYCSubmissions();
      }
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalKyc) return;
    if (!rejectionReason.trim()) return;
    setProcessing(rejectModalKyc._id);
    try {
      const res = await api.put(`/admin/kyc/${rejectModalKyc._id}`, {
        action: 'reject',
        rejectionReason: rejectionReason.trim()
      });
      if (res.data.success) {
        fetchKYCSubmissions();
        setRejectModalKyc(null);
        setRejectionReason('');
      }
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  };

  // Client-side search/filter for table display
  const filteredKYC = kycSubmissions.filter((kyc) => {
    const matchesSearch =
      !searchQuery ||
      kyc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kyc.phone.includes(searchQuery) ||
      kyc.nidNumber.includes(searchQuery);
    return matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">KYC Maintenance</h1>
            <p className="text-xs md:text-sm text-slate-400">Review and manage trader KYC verification requests</p>
          </div>
        </div>
        <div className="text-sm text-slate-500">{counts.total} total submissions</div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <KycStats counts={counts} />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <KycFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
          onRefresh={fetchKYCSubmissions}
          isLoading={loading}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2"><div className="h-3 w-16 bg-slate-700 rounded" /><div className="h-7 w-10 bg-slate-700 rounded" /></div>
                  <div className="w-10 h-10 bg-slate-700 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="h-14 bg-slate-900/60 border-b border-white/5" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 border-b border-white/5 px-5 flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-xl animate-pulse" />
                  <div className="space-y-2"><div className="h-3 w-24 bg-slate-700 rounded animate-pulse" /><div className="h-2 w-16 bg-slate-700 rounded animate-pulse" /></div>
                </div>
                <div className="h-3 w-32 bg-slate-700 rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredKYC.length === 0 ? (
        <div className="bg-slate-800/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="p-4 bg-slate-800/60 rounded-2xl mb-4"><ShieldCheck className="w-12 h-12 text-slate-600" /></div>
            <h3 className="text-lg font-semibold text-slate-300 mb-1">No KYC submissions found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      ) : (
        <KycTable
          kycList={filteredKYC}
          processing={processing}
          onView={(kyc) => setDetailModalKyc(kyc)}
          onApprove={handleApprove}
          onReject={(kyc) => setRejectModalKyc(kyc)}
        />
      )}

      {/* Modals */}
      <KycDetailModal
        kyc={detailModalKyc}
        isOpen={!!detailModalKyc}
        onClose={() => setDetailModalKyc(null)}
        onApprove={handleApprove}
        onReject={(kyc) => { setDetailModalKyc(null); setRejectModalKyc(kyc); }}
        processing={processing}
      />

      <KycRejectModal
        kyc={rejectModalKyc}
        isOpen={!!rejectModalKyc}
        onClose={() => { setRejectModalKyc(null); setRejectionReason(''); }}
        reason={rejectionReason}
        onReasonChange={setRejectionReason}
        onConfirm={handleReject}
        processing={processing}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/axios';
import { formatPrice } from '../../utils/formatPrice';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Megaphone,
  RefreshCw,
  Calendar,
  Clock,
  Tag,
  Target,
  Percent,
  DollarSign,
  ShoppingBag,
  Layers,
  Globe,
  Sparkles,
  Zap,
  Gift,
  Truck,
  Package,
  Star,
} from 'lucide-react';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

interface Campaign {
  _id: string;
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  mobileBanner: string;
  campaignLogo: string;
  colorTheme: string;
  status: 'draft' | 'scheduled' | 'active' | 'expired';
  priority: number;
  startDate: string | null;
  endDate: string | null;
  autoStart: boolean;
  autoEnd: boolean;
  discountType: string;
  discountValue: number;
  buyX: number | null;
  getY: number | null;
  minSpend: number | null;
  saveAmount: number | null;
  couponCode: string | null;
  targetType: string;
  applicableProducts: any[];
  applicableCategories: string[];
  maxDiscountAmount: number | null;
  customerPurchaseLimit: number;
  totalStock: number;
  usedStock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Off', icon: Percent },
  { value: 'fixed_amount', label: 'Fixed Amount Off', icon: DollarSign },
  { value: 'fixed_price', label: 'Fixed Price', icon: Tag },
  { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: Gift },
  { value: 'free_shipping', label: 'Free Shipping', icon: Truck },
  { value: 'bundle_discount', label: 'Bundle Discount', icon: Layers },
  { value: 'spend_x_save_y', label: 'Spend X Save Y', icon: DollarSign },
  { value: 'coupon_required', label: 'Coupon Required', icon: Tag },
  { value: 'auto_apply', label: 'Auto Apply', icon: Zap },
];

const TARGET_TYPES = [
  { value: 'specific_products', label: 'Specific Products', icon: ShoppingBag },
  { value: 'categories', label: 'Categories', icon: Layers },
  { value: 'brands', label: 'Brands', icon: Globe },
  { value: 'entire_store', label: 'Entire Store', icon: Globe },
  { value: 'new_arrivals', label: 'New Arrivals', icon: Sparkles },
  { value: 'featured', label: 'Featured Products', icon: Star },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  expired: 'bg-red-500/20 text-red-300 border-red-500/30',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CampaignsAdmin() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    bannerImage: '',
    mobileBanner: '',
    campaignLogo: '',
    colorTheme: '#ef4444',
    priority: 0,
    status: 'draft' as Campaign['status'],
    startDate: '',
    endDate: '',
    autoStart: true,
    autoEnd: true,
    discountType: 'percentage',
    discountValue: 0,
    buyX: null as number | null,
    getY: null as number | null,
    minSpend: null as number | null,
    saveAmount: null as number | null,
    couponCode: '',
    targetType: 'specific_products',
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    maxDiscountAmount: null as number | null,
    customerPurchaseLimit: 0,
    totalStock: 0,
    isActive: true,
    isFeatured: false,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api.get('/admin/campaigns', {
        params: {
          limit: 100,
          status: statusFilter || undefined,
          search: search || undefined,
          includeDeleted: false,
        },
      });
      if (res.data.success) setCampaigns(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchAnalytics = useCallback(async (campaignId: string) => {
    try {
      const res = await api.get('/admin/campaigns/analytics', { params: { campaignId, days: 7 } });
      if (res.data.success) {
        setAnalytics(prev => ({ ...prev, [campaignId]: res.data.data }));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products', { params: { limit: 200 } });
      if (res.data.success) setAllProducts(res.data.data);
    } catch {
      // ignore
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data.map((c: any) => c.name));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
    fetchCategories();
  }, [fetchCampaigns]);

  useEffect(() => {
    const timer = setTimeout(fetchCampaigns, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchCampaigns]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      bannerImage: '',
      mobileBanner: '',
      campaignLogo: '',
      colorTheme: '#ef4444',
      priority: 0,
      status: 'draft',
      startDate: '',
      endDate: '',
      autoStart: true,
      autoEnd: true,
      discountType: 'percentage',
      discountValue: 0,
      buyX: null,
      getY: null,
      minSpend: null,
      saveAmount: null,
      couponCode: '',
      targetType: 'specific_products',
      applicableProducts: [],
      applicableCategories: [],
      maxDiscountAmount: null,
      customerPurchaseLimit: 0,
      totalStock: 0,
      isActive: true,
      isFeatured: false,
    });
    setEditingCampaign(null);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      slug: campaign.slug,
      description: campaign.description || '',
      bannerImage: campaign.bannerImage || '',
      mobileBanner: campaign.mobileBanner || '',
      campaignLogo: campaign.campaignLogo || '',
      colorTheme: campaign.colorTheme || '#ef4444',
      priority: campaign.priority || 0,
      status: campaign.status,
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
      autoStart: campaign.autoStart,
      autoEnd: campaign.autoEnd,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      buyX: campaign.buyX,
      getY: campaign.getY,
      minSpend: campaign.minSpend,
      saveAmount: campaign.saveAmount,
      couponCode: campaign.couponCode || '',
      targetType: campaign.targetType,
      applicableProducts: campaign.applicableProducts?.map((p: any) => p._id || p) || [],
      applicableCategories: campaign.applicableCategories || [],
      maxDiscountAmount: campaign.maxDiscountAmount,
      customerPurchaseLimit: campaign.customerPurchaseLimit || 0,
      totalStock: campaign.totalStock || 0,
      isActive: campaign.isActive,
      isFeatured: campaign.isFeatured,
    });
    setShowModal(true);
  };

  const openDuplicate = async (campaign: Campaign) => {
    try {
      const res = await api.post('/admin/campaigns/duplicate', { id: campaign._id });
      if (res.data.success) {
        fetchCampaigns();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to duplicate campaign' });
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await api.delete(`/admin/campaigns/${id}`);
      if (res.data.success) fetchCampaigns();
      else setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to delete' });
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };

      let res;
      if (editingCampaign) {
        res = await api.put(`/admin/campaigns/${editingCampaign._id}`, payload);
      } else {
        res = await api.post('/admin/campaigns', payload);
      }

      if (res.data.success) {
        setShowModal(false);
        resetForm();
        fetchCampaigns();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to save campaign' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to save campaign' });
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      applicableProducts: prev.applicableProducts.includes(productId)
        ? prev.applicableProducts.filter(id => id !== productId)
        : [...prev.applicableProducts, productId],
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      applicableCategories: prev.applicableCategories.includes(category)
        ? prev.applicableCategories.filter(c => c !== category)
        : [...prev.applicableCategories, category],
    }));
  };

  const getStatusBadge = (status: string) => (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  // Generate a name-based slug
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  const filteredProducts = productSearch
    ? allProducts.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()))
    : allProducts;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {alertConfig && <EnhancedAlert {...alertConfig} onClose={() => setAlertConfig(null)} />}
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-white">Campaign Management</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">Create and manage marketing campaigns, promotions, and special offers</p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none w-full sm:w-48"
              />
            </div>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none w-full sm:w-auto"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25 active:scale-95 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4 text-gray-400">
            <Megaphone className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-1">No campaigns yet</p>
            <p className="text-sm">Create your first marketing campaign to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="hover:bg-white/5 transition-colors">
                {/* Campaign Header */}
                <div
                  className="p-3 sm:p-5 cursor-pointer"
                  onClick={() => {
                    if (expandedId === campaign._id) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(campaign._id);
                      fetchAnalytics(campaign._id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Color indicator */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: campaign.colorTheme || '#ef4444' }}
                      >
                        <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold text-sm sm:text-lg truncate max-w-[120px] sm:max-w-none">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          {campaign.isFeatured && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full border border-yellow-500/30">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs sm:text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {DISCOUNT_TYPES.find(d => d.value === campaign.discountType)?.label || campaign.discountType}
                            {campaign.discountValue > 0 && ` (${campaign.discountValue}${campaign.discountType === 'percentage' ? '%' : '৳'})`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {TARGET_TYPES.find(t => t.value === campaign.targetType)?.label || campaign.targetType}
                          </span>
                          {campaign.startDate && (
                            <span className="flex items-center gap-1 hidden sm:inline-flex">
                              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {formatDate(campaign.startDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewCampaign(campaign); }}
                        className="p-1.5 sm:p-2 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded-lg transition-all active:scale-90"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDuplicate(campaign); }}
                        className="p-1.5 sm:p-2 text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 rounded-lg transition-all active:scale-90 hidden sm:block"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(campaign); }}
                        className="p-1.5 sm:p-2 text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 rounded-lg transition-all active:scale-90"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(campaign._id); }}
                        className="p-1.5 sm:p-2 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-all active:scale-90"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <div className="text-gray-400 ml-0.5 sm:ml-1">
                        {expandedId === campaign._id ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Analytics */}
                {expandedId === campaign._id && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-white/5 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                      {[
                        { label: 'Views', value: analytics[campaign._id]?.totals?.totalViews || 0, color: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-400', val: 'text-blue-300', border: 'border-blue-500/20' },
                        { label: 'Clicks', value: analytics[campaign._id]?.totals?.totalClicks || 0, color: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-400', val: 'text-purple-300', border: 'border-purple-500/20' },
                        { label: 'Orders', value: analytics[campaign._id]?.totals?.totalOrders || 0, color: 'green', bg: 'bg-green-500/10', text: 'text-green-400', val: 'text-green-300', border: 'border-green-500/20' },
                        { label: 'Revenue', value: `৳${formatPrice(analytics[campaign._id]?.totals?.totalRevenue, 2) || '0.00'}`, color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-400', val: 'text-amber-300', border: 'border-amber-500/20' },
                      ].map((stat) => (
                        <div key={stat.label} className={`${stat.bg} ${stat.border} rounded-xl p-3 sm:p-4`}>
                          <p className={`${stat.text} text-xs font-semibold uppercase tracking-wider`}>{stat.label}</p>
                          <p className={`${stat.val} text-lg sm:text-2xl font-bold mt-1`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created: {formatDate(campaign.createdAt)}
                        {campaign.endDate && (
                          <> | Ends: {formatDate(campaign.endDate)}</>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-white/10 max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-pink-400" />
                  Campaign Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., Summer Flash Sale 2025"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-generated"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Color Theme</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={formData.colorTheme}
                        onChange={(e) => setFormData(prev => ({ ...prev, colorTheme: e.target.value }))}
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-white/10"
                      />
                      <span className="text-sm text-gray-400">{formData.colorTheme}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this campaign..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Schedule & Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoStart}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoStart: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      <span className="text-sm text-gray-300">Auto Start</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoEnd}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoEnd: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      <span className="text-sm text-gray-300">Auto End</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      <span className="text-sm text-gray-300">Featured</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Discount */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-400" />
                  Discount Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Discount Type *</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    >
                      {DISCOUNT_TYPES.map(dt => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                  </div>
                  {(formData.discountType === 'percentage' || formData.discountType === 'fixed_amount' || formData.discountType === 'fixed_price') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Discount Value {formData.discountType === 'percentage' ? '(%)' : '(৳)'}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={formData.discountType === 'percentage' ? '1' : '0.01'}
                          value={formData.discountValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      {formData.discountType === 'percentage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Max Discount Amount (৳)</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={formData.maxDiscountAmount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                            placeholder="No limit"
                          />
                        </div>
                      )}
                    </>
                  )}
                  {formData.discountType === 'buy_x_get_y' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Buy X</label>
                        <input
                          type="number"
                          min={1}
                          value={formData.buyX || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, buyX: parseInt(e.target.value) || null }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Get Y</label>
                        <input
                          type="number"
                          min={1}
                          value={formData.getY || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, getY: parseInt(e.target.value) || null }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                  {formData.discountType === 'spend_x_save_y' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Spend (৳)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.minSpend || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, minSpend: e.target.value ? parseFloat(e.target.value) : null }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Save Amount (৳)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={formData.saveAmount || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, saveAmount: e.target.value ? parseFloat(e.target.value) : null }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                  {formData.discountType === 'coupon_required' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Coupon Code</label>
                      <input
                        type="text"
                        value={formData.couponCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Targeting */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Targeting
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Type</label>
                    <select
                      value={formData.targetType}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                    >
                      {TARGET_TYPES.map(tt => (
                        <option key={tt.value} value={tt.value}>{tt.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.targetType === 'specific_products' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Selected Products ({formData.applicableProducts.length})
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowProductPicker(!showProductPicker)}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                        >
                          {showProductPicker ? 'Hide' : 'Browse'}
                        </button>
                      </div>
                      {showProductPicker && (
                        <div className="mt-3 max-h-48 overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-2 space-y-1">
                          {filteredProducts.slice(0, 100).map((product: any) => (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => toggleProduct(product._id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                                formData.applicableProducts.includes(product._id)
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'text-gray-400 hover:bg-white/5'
                              }`}
                            >
                              <span>{product.name}</span>
                              {formData.applicableProducts.includes(product._id) && (
                                <span className="text-blue-400 text-xs">Selected</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.targetType === 'categories' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Selected Categories ({formData.applicableCategories.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              formData.applicableCategories.includes(cat)
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  Limits & Stock
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Customer Purchase Limit</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.customerPurchaseLimit}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPurchaseLimit: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      placeholder="0 = no limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Total Campaign Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.totalStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalStock: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25"
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewCampaign && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden mx-2 sm:mx-0">
            {/* Banner preview */}
            <div className="h-40 sm:h-48 relative flex items-center justify-center" style={{ backgroundColor: previewCampaign.colorTheme || '#ef4444' }}>
              <div className="text-center px-4">
                <Megaphone className="w-8 h-8 sm:w-12 sm:h-12 text-white/60 mx-auto mb-2" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">{previewCampaign.name}</h2>
                <div className="mt-2">{getStatusBadge(previewCampaign.status)}</div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">{previewCampaign.description || 'No description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs">Discount</p>
                  <p className="text-white font-semibold">
                    {DISCOUNT_TYPES.find(d => d.value === previewCampaign.discountType)?.label}
                    {previewCampaign.discountValue > 0 && ` (${previewCampaign.discountValue}${previewCampaign.discountType === 'percentage' ? '%' : '৳'})`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs">Target</p>
                  <p className="text-white font-semibold">{TARGET_TYPES.find(t => t.value === previewCampaign.targetType)?.label}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs">Start</p>
                  <p className="text-white font-semibold">{formatDate(previewCampaign.startDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase tracking-wider text-xs">End</p>
                  <p className="text-white font-semibold">{formatDate(previewCampaign.endDate)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewCampaign(null)}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

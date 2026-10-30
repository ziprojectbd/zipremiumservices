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
  CreditCard,
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
  campaignType: 'special_offer' | 'payment_method' | 'bulk_quantity' | 'weekly_special';
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
  // Payment Method Campaign
  eligiblePaymentMethods: string[];
  paymentMethodDiscountType: string | null;
  paymentMethodDiscountValue: number | null;
  paymentMethodMaxDiscount: number | null;
  // Bulk Quantity Discount
  bulkQuantityTiers: Array<{ minQty: number; maxQty: number | null; discountType: string; discountValue: number; maxDiscountAmount: number | null }>;
  bulkMinOrderAmount: number | null;
  // Weekly Special
  weeklySchedule: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  weeklyTimezone: string;
  weeklyRecurrenceStartDate: string | null;
  weeklyRecurrenceEndDate: string | null;
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Off', icon: Percent },
  { value: 'fixed_amount', label: 'Fixed Amount Off', icon: DollarSign },
  { value: 'coupon_required', label: 'Coupon Required', icon: Tag },
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
  paused: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
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
    campaignType: 'special_offer' as Campaign['campaignType'],
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
    slugIsCustom: false,
    // Payment Method Campaign
    eligiblePaymentMethods: [] as string[],
    paymentMethodDiscountType: 'percentage' as string | null,
    paymentMethodDiscountValue: null as number | null,
    paymentMethodMaxDiscount: null as number | null,
    // Bulk Quantity Discount
    bulkQuantityTiers: [] as Array<{ minQty: number; maxQty: number | null; discountType: string; discountValue: number; maxDiscountAmount: number | null }>,
    bulkMinOrderAmount: null as number | null,
    // Weekly Special
    weeklySchedule: [] as Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
    weeklyTimezone: 'Asia/Dhaka',
    weeklyRecurrenceStartDate: null as string | null,
    weeklyRecurrenceEndDate: null as string | null,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ code: string; name: string; displayName: string; icon: string; isActive: boolean }>>([]);
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

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/zi-pay/payment-methods');
      if (res.data.success) setPaymentMethods(res.data.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
    fetchCategories();
    fetchPaymentMethods();
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
      campaignType: 'special_offer',
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
      eligiblePaymentMethods: [],
      paymentMethodDiscountType: 'percentage',
      paymentMethodDiscountValue: null,
      paymentMethodMaxDiscount: null,
      bulkQuantityTiers: [],
      bulkMinOrderAmount: null,
      weeklySchedule: [],
      weeklyTimezone: 'Asia/Dhaka',
      weeklyRecurrenceStartDate: null,
      weeklyRecurrenceEndDate: null,
      slugIsCustom: false,
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
      campaignType: campaign.campaignType || 'special_offer',
      eligiblePaymentMethods: campaign.eligiblePaymentMethods || [],
      paymentMethodDiscountType: campaign.paymentMethodDiscountType || 'percentage',
      paymentMethodDiscountValue: campaign.paymentMethodDiscountValue ?? null,
      paymentMethodMaxDiscount: campaign.paymentMethodMaxDiscount ?? null,
      bulkQuantityTiers: campaign.bulkQuantityTiers || [],
      bulkMinOrderAmount: campaign.bulkMinOrderAmount ?? null,
      weeklySchedule: campaign.weeklySchedule || [],
      weeklyTimezone: campaign.weeklyTimezone || 'Asia/Dhaka',
      weeklyRecurrenceStartDate: campaign.weeklyRecurrenceStartDate ? new Date(campaign.weeklyRecurrenceStartDate).toISOString().slice(0, 16) : null,
      weeklyRecurrenceEndDate: campaign.weeklyRecurrenceEndDate ? new Date(campaign.weeklyRecurrenceEndDate).toISOString().slice(0, 16) : null,
      slugIsCustom: true,
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

  // Form-level validation. Returns an error message string or null if valid.
  const validateForm = useCallback((): string | null => {
    const { campaignType, discountType, discountValue, maxDiscountAmount, weeklySchedule, weeklyTimezone, weeklyRecurrenceStartDate, weeklyRecurrenceEndDate, startDate, endDate, targetType, applicableProducts, applicableCategories, couponCode } = formData;

    // Discount validation
    if (discountType === 'percentage') {
      if (!discountValue || discountValue <= 0 || discountValue > 100) {
        return 'Percentage discount must be between 0 and 100';
      }
      if (maxDiscountAmount != null && maxDiscountAmount < 0) {
        return 'Maximum discount amount must be positive';
      }
    } else if (discountType === 'fixed_amount') {
      if (!discountValue || discountValue <= 0) {
        return 'Fixed discount amount must be positive';
      }
      if (maxDiscountAmount != null && maxDiscountAmount < 0) {
        return 'Maximum discount amount must be positive';
      }
    } else if (discountType === 'coupon_required') {
      if (!couponCode || !couponCode.trim()) {
        return 'Coupon Required campaigns require a coupon code';
      }
    }

    // Weekly schedule validation
    if (campaignType === 'weekly_special') {
      if (!weeklyRecurrenceStartDate) {
        return 'Recurrence Start Date & Time is required for Weekly Special campaigns';
      }
      if (weeklyRecurrenceEndDate && new Date(weeklyRecurrenceStartDate) >= new Date(weeklyRecurrenceEndDate)) {
        return 'Recurrence start date must be before recurrence end date';
      }
      if (!weeklySchedule || weeklySchedule.length === 0) {
        return 'Weekly Special requires at least one schedule window';
      }
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      const byDay = new Map<number, Array<{ startTime: string; endTime: string }>>();
      for (const slot of weeklySchedule) {
        if (!slot.startTime || !slot.endTime) {
          return 'Every schedule window must have start and end times';
        }
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return 'Invalid time format (use HH:MM)';
        }
        if (!byDay.has(slot.dayOfWeek)) byDay.set(slot.dayOfWeek, []);
        byDay.get(slot.dayOfWeek)!.push({ startTime: slot.startTime, endTime: slot.endTime });
      }
      for (const [day, windows] of byDay.entries()) {
        windows.sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < windows.length; i++) {
          for (let j = i + 1; j < windows.length; j++) {
            const a = windows[i];
            const b = windows[j];
            if (a.startTime === b.startTime && a.endTime === b.endTime) {
              return `Day ${day}: duplicate time window`;
            }
            const aCrosses = a.endTime <= a.startTime;
            const bCrosses = b.endTime <= b.startTime;
            if (aCrosses && bCrosses) {
              return `Day ${day}: overlapping time windows`;
            }
            if (aCrosses) {
              if (b.startTime < a.endTime || b.startTime >= a.startTime) {
                return `Day ${day}: overlapping time windows`;
              }
            } else if (bCrosses) {
              if (a.startTime < b.endTime || a.startTime >= b.startTime) {
                return `Day ${day}: overlapping time windows`;
              }
            } else {
              if (a.startTime < b.endTime && b.startTime < a.endTime) {
                return `Day ${day}: overlapping time windows`;
              }
            }
          }
        }
      }
      // Recurrence end must not exceed global end
      if (weeklyRecurrenceEndDate && endDate) {
        if (new Date(weeklyRecurrenceEndDate) > new Date(endDate)) {
          return 'Recurrence end date must not be after the campaign end date';
        }
      }
    }

    // Global date boundaries
    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        return 'Start date must be before end date';
      }
    }

    // Targeting validation
    if (targetType === 'specific_products' && applicableProducts.length === 0) {
      return 'Please select at least one product';
    }
    if (targetType === 'categories' && applicableCategories.length === 0) {
      return 'Please select at least one category';
    }

    return null;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Run form-level validation before submission
    const validationErr = validateForm();
    if (validationErr) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Validation Error', message: validationErr });
      return;
    }
    try {
      const payload = {
        ...formData,
        startDate:
          formData.campaignType === 'weekly_special'
            ? null
            : formData.startDate
              ? new Date(formData.startDate).toISOString()
              : null,
        endDate:
          formData.campaignType === 'weekly_special'
            ? null
            : formData.endDate
              ? new Date(formData.endDate).toISOString()
              : null,
        weeklyRecurrenceStartDate: formData.weeklyRecurrenceStartDate ? new Date(formData.weeklyRecurrenceStartDate).toISOString() : null,
        weeklyRecurrenceEndDate: formData.weeklyRecurrenceEndDate ? new Date(formData.weeklyRecurrenceEndDate).toISOString() : null,
        // Auto Start/Auto End are not used for Weekly Special — recurrence
        // schedule controls eligibility. Clear them so legacy values cannot
        // override weekly schedule behavior.
        autoStart: formData.campaignType === 'weekly_special' ? false : formData.autoStart,
        autoEnd: formData.campaignType === 'weekly_special' ? false : formData.autoEnd,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        // Round discount values to eliminate floating-point artifacts (e.g. 100 → 99.98)
        discountValue:
          formData.discountType === 'percentage'
            ? Math.round(formData.discountValue)
            : Math.round(formData.discountValue * 100) / 100,
        maxDiscountAmount:
          formData.maxDiscountAmount != null
            ? Math.round(formData.maxDiscountAmount * 100) / 100
            : null,
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

  // Generate a name-based slug (matches backend slugify)
  const handleNameChange = (name: string) => {
    const generatedSlug = name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slugIsCustom ? prev.slug : generatedSlug,
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
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value, slugIsCustom: true }))}
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

              {/* Campaign Type Selector */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Campaign Type
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { value: 'special_offer', label: 'Special Offer', icon: Zap },
                    { value: 'payment_method', label: 'Payment Method', icon: CreditCard },
                    { value: 'bulk_quantity', label: 'Bulk Quantity', icon: Layers },
                    { value: 'weekly_special', label: 'Weekly Special', icon: Clock },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, campaignType: t.value as Campaign['campaignType'] }))}
                      className={`w-full p-3 rounded-xl text-sm font-medium border transition-all ${
                        formData.campaignType === t.value
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <div className="text-xs">{t.label}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {formData.campaignType === 'payment_method' && 'Discount applies when customer pays with a selected gateway method.'}
                  {formData.campaignType === 'bulk_quantity' && 'Quantity-tier discounts per product (e.g. 3+ items = 10% off).'}
                  {formData.campaignType === 'weekly_special' && 'Recurring weekly schedule (e.g. every Friday 10:00-22:00).'}
                  {formData.campaignType === 'special_offer' && 'Standard product-level campaign discount.'}
                </p>
              </div>

              {formData.campaignType === 'payment_method' && (
                <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 border-indigo-500/30">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Payment Method Campaign
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Discount Type</label>
                        <select
                          value={formData.paymentMethodDiscountType || 'percentage'}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodDiscountType: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="percentage">Percentage Off</option>
                          <option value="fixed_amount">Fixed Amount Off</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Discount Value</label>
                        <input
                          type="number"
                          value={formData.paymentMethodDiscountValue || 0}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodDiscountValue: parseFloat(e.target.value) || 0 }))}
                          placeholder="e.g. 10 or 50"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Max Discount Cap (optional)</label>
                      <input
                        type="number"
                        value={formData.paymentMethodMaxDiscount || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodMaxDiscount: parseFloat(e.target.value) || null }))}
                        placeholder="e.g. 500"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Select Payment Methods</label>
                        <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl p-3 space-y-2">
                          {paymentMethods.map((m) => (
                            <label key={m.code} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.eligiblePaymentMethods.includes(m.code)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, eligiblePaymentMethods: [...prev.eligiblePaymentMethods, m.code] }));
                                  } else {
                                    setFormData(prev => ({ ...prev, eligiblePaymentMethods: prev.eligiblePaymentMethods.filter(c => c !== m.code) }));
                                  }
                                }}
                                className="rounded text-indigo-500 focus:ring-indigo-500"
                              />
                              <div className="flex items-center gap-2">
                                {m.icon && <img src={m.icon} alt={m.name} className="w-5 h-5 rounded" />}
                                <span className="text-sm text-gray-300">{m.displayName || m.name}</span>
                                <span className={`text-xs ${m.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                  {m.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </label>
                          ))}
                          {paymentMethods.length === 0 && (
                            <p className="text-xs text-gray-500">Loading payment methods...</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Select one or more gateway payment methods. The discount applies only when the customer
                      pays with a selected method at checkout.
                    </p>
                  </div>
                </div>
              )}

              {formData.campaignType === 'bulk_quantity' && (
                <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 border-indigo-500/30">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Bulk Quantity Discount Tiers
                  </h4>
                  <div className="space-y-3">
                    {formData.bulkQuantityTiers.map((tier, idx) => (
                      <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Min Qty</label>
                            <input
                              type="number"
                              value={tier.minQty}
                              onChange={(e) => {
                                const tiers = [...formData.bulkQuantityTiers];
                                tiers[idx].minQty = parseInt(e.target.value) || 1;
                                setFormData(prev => ({ ...prev, bulkQuantityTiers: tiers }));
                              }}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Max Qty</label>
                            <input
                              type="number"
                              value={tier.maxQty || ''}
                              onChange={(e) => {
                                const tiers = [...formData.bulkQuantityTiers];
                                tiers[idx].maxQty = e.target.value ? parseInt(e.target.value) : null;
                                setFormData(prev => ({ ...prev, bulkQuantityTiers: tiers }));
                              }}
                              placeholder="∞"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Discount %</label>
                            <input
                              type="number"
                              value={tier.discountValue}
                              onChange={(e) => {
                                const tiers = [...formData.bulkQuantityTiers];
                                tiers[idx].discountValue = parseFloat(e.target.value) || 0;
                                setFormData(prev => ({ ...prev, bulkQuantityTiers: tiers }));
                              }}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  bulkQuantityTiers: prev.bulkQuantityTiers.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="w-full px-3 py-2 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-xs hover:bg-red-500/30"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            bulkQuantityTiers: [...prev.bulkQuantityTiers, { minQty: 1, maxQty: null, discountType: 'percentage', discountValue: 0, maxDiscountAmount: null }],
                          }));
                        }}
                        className="w-full px-3 py-2 bg-indigo-500/20 border border-indigo-500 rounded-lg text-indigo-300 text-xs hover:bg-indigo-500/30"
                      >
                        + Add Tier
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Tiers apply per eligible product. Example: 3-4 qty = 5% off, 5-9 qty = 10% off, 10+ qty = 15% off.
                    </p>
                  </div>
                </div>
              )}

              {formData.campaignType === 'weekly_special' && (
                <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 border-indigo-500/30">
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Weekly Special Schedule
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Uses the discount type and value from the <strong>Discount Configuration</strong> section above.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
                      <select
                        value={formData.weeklyTimezone}
                        onChange={(e) => setFormData(prev => ({ ...prev, weeklyTimezone: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Recurrence Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.weeklyRecurrenceStartDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, weeklyRecurrenceStartDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Recurrence End Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={formData.weeklyRecurrenceEndDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, weeklyRecurrenceEndDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayWindows = formData.weeklySchedule.filter(s => s.dayOfWeek === day);
                        return (
                          <div key={day} className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-300">{dayNames[day]}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (dayWindows.length > 0) {
                                    setFormData(prev => ({
                                      ...prev,
                                      weeklySchedule: prev.weeklySchedule.filter(s => s.dayOfWeek !== day),
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      weeklySchedule: [...prev.weeklySchedule, { dayOfWeek: day, startTime: '09:00', endTime: '18:00' }],
                                    }));
                                  }
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  dayWindows.length > 0 ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-500 border border-white/10'
                                }`}
                              >
                                {dayWindows.length > 0 ? '✓' : '+'}
                              </button>
                            </div>
                            {dayWindows.length > 0 && (
                              <div className="space-y-2">
                                {dayWindows.map((win, winIdx) => (
                                  <div key={winIdx} className="bg-white/10 p-2 rounded border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">Start</label>
                                      <input
                                        type="time"
                                        value={win.startTime}
                                        onChange={(e) => {
                                          const sched = [...formData.weeklySchedule];
                                          const globalIdx = sched.findIndex(s => s.dayOfWeek === day && s.startTime === win.startTime && s.endTime === win.endTime);
                                          if (globalIdx >= 0) sched[globalIdx].startTime = e.target.value;
                                          setFormData(prev => ({ ...prev, weeklySchedule: sched }));
                                        }}
                                        className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">End</label>
                                      <input
                                        type="time"
                                        value={win.endTime}
                                        onChange={(e) => {
                                          const sched = [...formData.weeklySchedule];
                                          const globalIdx = sched.findIndex(s => s.dayOfWeek === day && s.startTime === win.startTime && s.endTime === win.endTime);
                                          if (globalIdx >= 0) sched[globalIdx].endTime = e.target.value;
                                          setFormData(prev => ({ ...prev, weeklySchedule: sched }));
                                        }}
                                        className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            weeklySchedule: prev.weeklySchedule.filter(s => !(s.dayOfWeek === day && s.startTime === win.startTime && s.endTime === win.endTime)),
                                          }));
                                        }}
                                        className="w-full px-2 py-2 bg-red-500/20 border border-red-500 rounded text-red-300 text-xs hover:bg-red-500/30"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            weeklySchedule: [
                                              ...prev.weeklySchedule.filter(s => !(s.dayOfWeek === day && s.startTime === win.startTime && s.endTime === win.endTime)),
                                              { dayOfWeek: day, startTime: win.startTime, endTime: win.endTime },
                                            ],
                                          }));
                                        }}
                                        className="w-full px-2 py-2 bg-indigo-500/20 border border-indigo-500 rounded text-indigo-300 text-xs hover:bg-indigo-500/30"
                                      >
                                        + Add Window
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Select weekdays and set start/end times for each. Multiple windows per day are supported. The discount auto-activates during these windows every week.
                    </p>
                  </div>
                </div>
              )}

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
                      <option value="paused">Paused</option>
                    </select>
                    {formData.campaignType === 'weekly_special' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Weekly schedule windows control when the discount applies.
                      </p>
                    )}
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
                  {formData.campaignType !== 'weekly_special' && (
                    <>
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
                    </>
                  )}
                  <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
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
                    {formData.discountType === 'fixed_amount' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Discount Cap (৳) (optional)</label>
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
                    {formData.discountType === 'coupon_required' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Required Coupon Code *</label>
                        <input
                          type="text"
                          value={formData.couponCode || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                          placeholder="e.g. SAVE20"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none uppercase"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Customers must enter this coupon code at checkout to receive the discount.
                        </p>
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

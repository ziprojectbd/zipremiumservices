import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Percent, DollarSign, Calendar, Power, Edit3, Trash2, Copy, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Tag, Package } from 'lucide-react';
import api from '../../lib/axios';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  applicableCategories: string[];
  applicableProducts: string[];
}

interface Category {
  _id: string;
  name: string;
  icon?: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
}

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
      type === 'success'
        ? 'bg-green-900/90 border-green-500/30 text-green-200'
        : 'bg-red-900/90 border-red-500/30 text-red-200'
    }`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Confirm Dialog Component ─────────────────────────────────────────────────
function ConfirmDialog({
  open, title, message, onConfirm, onCancel, loading,
}: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500 rounded-full filter blur-2xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all disabled:opacity-50 border border-white/20">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Coupon Form Modal ────────────────────────────────────────────────────────
function CouponModal({
  open, onClose, onSaved, editCoupon,
}: {
  open: boolean; onClose: () => void; onSaved: () => void; editCoupon?: Coupon | null;
}) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [restrictionType, setRestrictionType] = useState<'all' | 'categories' | 'products'>('all');
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  const [applicableProducts, setApplicableProducts] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    if (open) {
      if (editCoupon) {
        setCode(editCoupon.code);
        setDiscountType(editCoupon.discountType);
        setDiscountValue(String(editCoupon.discountValue));
        setMinOrderAmount(editCoupon.minOrderAmount ? String(editCoupon.minOrderAmount) : '');
        setMaxDiscountAmount(editCoupon.maxDiscountAmount ? String(editCoupon.maxDiscountAmount) : '');
        setUsageLimit(editCoupon.usageLimit ? String(editCoupon.usageLimit) : '');
        setExpiresAt(editCoupon.expiresAt ? editCoupon.expiresAt.slice(0, 16) : '');
        setApplicableCategories(editCoupon.applicableCategories || []);
        setApplicableProducts(editCoupon.applicableProducts || []);
        if (editCoupon.applicableCategories?.length > 0) {
          setRestrictionType('categories');
        } else if (editCoupon.applicableProducts?.length > 0) {
          setRestrictionType('products');
        } else {
          setRestrictionType('all');
        }
      } else {
        setCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setMinOrderAmount('');
        setMaxDiscountAmount('');
        setUsageLimit('');
        setExpiresAt('');
        setApplicableCategories([]);
        setApplicableProducts([]);
        setRestrictionType('all');
      }
      setError('');
      setProductSearch('');
      setCategorySearch('');
      // Fetch categories and products
      setLoadingOptions(true);
      Promise.all([
        api.get('/categories'),
        api.get('/admin/products', { params: { limit: 200 } }),
      ]).then(([catRes, prodRes]) => {
        if (catRes.data.success && catRes.data.data) setAllCategories(catRes.data.data as Category[]);
        if (prodRes.data.success && prodRes.data.data) setAllProducts(prodRes.data.data as Product[]);
      }).catch(() => {}).finally(() => setLoadingOptions(false));
    }
  }, [open, editCoupon]);

  const handleSave = async () => {
    setError('');
    if (!code.trim()) { setError('Coupon code is required'); return; }
    const val = parseFloat(discountValue);
    if (!val || val <= 0) { setError('Valid discount value is required'); return; }

    setSaving(true);
    try {
      const data: any = {
        code: code.trim(),
        discountType,
        discountValue: val,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscountAmount: parseFloat(maxDiscountAmount) || 0,
        usageLimit: parseInt(usageLimit) || 0,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        applicableCategories: restrictionType === 'categories' ? applicableCategories : [],
        applicableProducts: restrictionType === 'products' ? applicableProducts : [],
      };

      const res = editCoupon
        ? await api.put(`/admin/coupons/${editCoupon._id}`, data)
        : await api.post('/admin/coupons', data);

      if (res.data.success) {
        onSaved();
        onClose();
      } else {
        setError(res.data.error || 'Failed to save coupon');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6 overflow-hidden my-2 sm:my-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
                {editCoupon ? 'Update coupon settings' : 'Add a new discount coupon'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all shrink-0">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Coupon Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., SUMMER20"
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase"
                disabled={!!editCoupon}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Discount Type *</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'flat')}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (৳)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Discount Value *</label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                    min="0"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {discountType === 'percentage' ? '%' : '৳'}
                  </span>
                </div>
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Min Order Amount</label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0 = no minimum"
                  min="0"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Max Discount</label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="0 = no limit"
                  min="0"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Usage Limit & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Usage Limit</label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="0 = unlimited"
                  min="0"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Expiry Date & Time</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Restriction Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                Allow on
              </label>
              <select
                value={restrictionType}
                onChange={(e) => {
                  setRestrictionType(e.target.value as 'all' | 'categories' | 'products');
                  setApplicableCategories([]);
                  setApplicableProducts([]);
                }}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="categories">Specific Categories</option>
                <option value="products">Specific Products</option>
              </select>
            </div>

            {restrictionType === 'categories' && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-400" />
                  Select Categories
                  {applicableCategories.length > 0 && (
                    <span className="text-xs text-blue-400 font-normal">({applicableCategories.length} selected)</span>
                  )}
                </label>
                {loadingOptions ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Filter categories..."
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all mb-2"
                    />
                    <div className="max-h-32 overflow-y-auto bg-black/30 border border-white/10 rounded-xl p-2 space-y-1 custom-scrollbar">
                      {allCategories
                        .filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((cat) => {
                          const selected = applicableCategories.includes(cat.name);
                          return (
                            <label
                              key={cat._id || cat.name}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${
                                selected
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'text-gray-400 hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  setApplicableCategories(prev =>
                                    selected ? prev.filter(c => c !== cat.name) : [...prev, cat.name]
                                  );
                                }}
                                className="rounded border-white/20 text-blue-500 focus:ring-blue-500/50"
                              />
                              {cat.icon && <span className="text-base">{cat.icon}</span>}
                              {cat.name}
                            </label>
                          );
                        })}
                      {allCategories.length === 0 && (
                        <p className="text-gray-600 text-xs text-center py-2">No categories found</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {restrictionType === 'products' && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  Select Products
                  {applicableProducts.length > 0 && (
                    <span className="text-xs text-cyan-400 font-normal">({applicableProducts.length} selected)</span>
                  )}
                </label>
                {loadingOptions ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading products...
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Filter products..."
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all mb-2"
                    />
                    <div className="max-h-32 overflow-y-auto bg-black/30 border border-white/10 rounded-xl p-2 space-y-1 custom-scrollbar">
                      {allProducts
                        .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .map((product) => {
                          const selected = applicableProducts.includes(product._id);
                          return (
                            <label
                              key={product._id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${
                                selected
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'text-gray-400 hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  setApplicableProducts(prev =>
                                    selected ? prev.filter(id => id !== product._id) : [...prev, product._id]
                                  );
                                }}
                                className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500/50"
                              />
                              <span className="truncate">{product.name}</span>
                              <span className="text-xs text-gray-600 ml-auto shrink-0">{product.category}</span>
                            </label>
                          );
                        })}
                      {allProducts.length === 0 && (
                        <p className="text-gray-600 text-xs text-center py-2">No products found</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={onClose} disabled={saving} className="w-full sm:flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all disabled:opacity-50 border border-white/20 order-2 sm:order-1">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 order-1 sm:order-2">
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : editCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Coupons Page ─────────────────────────────────────────────────────────
export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons', { params: { search: search || undefined } });
      if (res.data.success && res.data.data) {
        setCoupons(res.data.data as Coupon[]);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = () => {
    setEditCoupon(null);
    setShowModal(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/coupons/${deleteConfirm}`);
      if (res.data.success) {
        setToast({ message: 'Coupon deleted successfully', type: 'success' });
        fetchCoupons();
      } else {
        setToast({ message: res.data.error || 'Failed to delete coupon', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to delete coupon', type: 'error' });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await api.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      if (res.data.success) {
        setToast({ message: `Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully`, type: 'success' });
        fetchCoupons();
      } else {
        setToast({ message: res.data.error || 'Failed to toggle coupon', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to toggle coupon', type: 'error' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({ message: 'Coupon code copied to clipboard', type: 'success' });
  };

  const isExpired = (coupon: Coupon) => {
    return coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  };

  const isUsageExhausted = (coupon: Coupon) => {
    return coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Coupon Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage discount coupons</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search coupons by code..."
          className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Desktop table / Mobile cards */}
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Percent className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No coupons found. Create your first coupon!
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const expired = isExpired(coupon);
                  const exhausted = isUsageExhausted(coupon);
                  const active = coupon.isActive && !expired && !exhausted;

                  return (
                    <tr key={coupon._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm">{coupon.code}</span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-blue-400 transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          {coupon.discountType === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-blue-400" />
                              <span className="text-white font-semibold">{coupon.discountValue}%</span>
                              {coupon.maxDiscountAmount > 0 && (
                                <span className="text-gray-500 text-xs">(max ৳{coupon.maxDiscountAmount})</span>
                              )}
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span className="text-white font-semibold">৳{coupon.discountValue}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <span className="text-white font-semibold">{coupon.usedCount}</span>
                          {coupon.usageLimit > 0 && (
                            <span className="text-gray-500"> / {coupon.usageLimit}</span>
                          )}
                          {coupon.usageLimit === 0 && (
                            <span className="text-gray-500 text-xs ml-1">(unlimited)</span>
                          )}
                          {coupon.minOrderAmount > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">Min: ৳{coupon.minOrderAmount}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                            active
                              ? 'bg-green-500/20 border-green-400/40 text-green-300'
                              : 'bg-gray-800/60 border-gray-600/40 text-gray-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                            {active ? 'ACTIVE' : expired ? 'EXPIRED' : exhausted ? 'EXHAUSTED' : 'INACTIVE'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {coupon.expiresAt ? (
                            <span className={expired ? 'text-red-400' : ''}>
                              {new Date(coupon.expiresAt).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className="text-gray-600">No expiry</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className={`p-2 rounded-lg transition-all ${
                              coupon.isActive
                                ? 'text-green-400 hover:bg-green-500/10'
                                : 'text-gray-600 hover:bg-white/10 hover:text-white'
                            }`}
                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-white/10 hover:text-blue-400 transition-all"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(coupon._id)}
                            className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-white/5">
          {loading ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <Percent className="w-10 h-10 mx-auto mb-3 opacity-30" />
              No coupons found. Create your first coupon!
            </div>
          ) : (
            coupons.map((coupon) => {
              const expired = isExpired(coupon);
              const exhausted = isUsageExhausted(coupon);
              const active = coupon.isActive && !expired && !exhausted;

              return (
                <div key={coupon._id} className="px-4 py-4 space-y-3">
                  {/* Code + Status row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{coupon.code}</span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-blue-400 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                      active
                        ? 'bg-green-500/20 border-green-400/40 text-green-300'
                        : 'bg-gray-800/60 border-gray-600/40 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                      {active ? 'ACTIVE' : expired ? 'EXPIRED' : exhausted ? 'EXHAUSTED' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-black/20 rounded-lg px-3 py-2">
                      <span className="text-gray-500 text-xs">Discount</span>
                      <div className="flex items-center gap-1 text-white font-semibold">
                        {coupon.discountType === 'percentage' ? (
                          <>{coupon.discountValue}%</>
                        ) : (
                          <>৳{coupon.discountValue}</>
                        )}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg px-3 py-2">
                      <span className="text-gray-500 text-xs">Usage</span>
                      <div className="text-white font-semibold">
                        {coupon.usedCount}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}
                      </div>
                    </div>
                    {coupon.minOrderAmount > 0 && (
                      <div className="bg-black/20 rounded-lg px-3 py-2">
                        <span className="text-gray-500 text-xs">Min Order</span>
                        <div className="text-white font-semibold">৳{coupon.minOrderAmount}</div>
                      </div>
                    )}
                    <div className="bg-black/20 rounded-lg px-3 py-2">
                      <span className="text-gray-500 text-xs">Expires</span>
                      <div className={`font-semibold ${expired ? 'text-red-400' : 'text-white'}`}>
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        coupon.isActive
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-blue-400 border border-white/10 hover:bg-blue-500/10 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(coupon._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-red-400 border border-white/10 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Coupon Form Modal */}
      <CouponModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={fetchCoupons}
        editCoupon={editCoupon}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleting}
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

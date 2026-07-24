import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, PackageOpen, Layers, Star, AlertTriangle, DollarSign, Wallet, TrendingUp,
  Sparkles, Film, Palette, Lock, Users, X, Upload, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';
import { formatPrice } from '../../utils/formatPrice';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Product {
  _id?: string;
  id?: string;
  name: string;
  sales?: number;
  revenue?: number | string;
  trend?: string;
  category?: string;
  price?: number;
  priceBDT?: number;
  priceUSDT?: number;
  stock?: number;
  description?: string;
  details?: string;
  imageUrl?: string;
  images?: string[];
  featured?: boolean;
  available?: boolean;
  showStock?: boolean;
  showImageSlider?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoSlug?: string;
  customCategory?: string;
}

interface ProductStats {
  totalProducts: number;
  totalCategories: number;
  featuredProducts: number;
  lowStockProducts: number;
  revenueUSDT: number;
  revenueBDT: number;
  topProduct: { name: string; sales: number } | null;
  categories: { name: string; count: number }[];
}

interface Category {
  _id?: string;
  name: string;
  icon?: string;
  gradient?: string;
  slug?: string;
  productCount?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 50;
const ICON_OPTIONS = ['🎬', '🎨', '🔒', '📱', '🛠️', '💸', '🎮', '📚', '🎵', '🏃', '🍔', '☕'];

const DEFAULT_CATEGORY_ICONS: Record<string, any> = {
  'Entertainment': Film,
  'Design': Palette,
  'Security': Lock,
  'Social Services': Users,
};

// ---------------------------------------------------------------------------
// Products Page
// ---------------------------------------------------------------------------
export default function ProductsPage() {
  const navigate = useNavigate();

  // Products list state
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoryFilters, setCategoryFilters] = useState<{ name: string; icon: any }[]>([{ name: 'All', icon: null }]);

  // Stats state
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const statsRef = useRef(false);

  // Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  // ---- Data fetching ----
  const fetchProducts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await api.get('/admin/products', { params: { page, limit: PAGE_SIZE } });
      const json = res.data;
      if (json.success && json.data) {
        const fetched = json.data;
        setProducts(prev => (append ? [...prev, ...fetched] : fetched));
        setCurrentPage(page);
        if (json.pagination) {
          setTotalProducts(json.pagination.total);
          setHasMore(page < json.pagination.pages);
        }
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/products/stats');
      const json = res.data;
      if (json.success) setStats(json.data);
    } catch {
      // stats endpoint may not exist
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch categories for filter buttons
  useEffect(() => {
    api.get('/categories')
      .then(res => {
        const json = res.data;
        if (json.success && json.data) {
          const filters: { name: string; icon: any }[] = [{ name: 'All', icon: null }];
          for (const cat of json.data) {
            if (cat.name === 'All') continue;
            filters.push({
              name: cat.name,
              icon: DEFAULT_CATEGORY_ICONS[cat.name] || Sparkles,
            });
          }
          setCategoryFilters(filters);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!statsRef.current) {
      statsRef.current = true;
      fetchStats();
    }
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // ---- Handlers ----
  const handleProductChanged = () => {
    setEditingProduct(null);
    fetchProducts(1);
    fetchStats();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  };

  const handleEditProduct = (product: Product) => {
    const productId = product._id || product.id;
    if (productId) {
      navigate(`/admin/products/edit/${productId}`);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/admin/products/${product._id || product.id}`);
      const json = res.data;
      if (json.success) {
        fetchProducts(1);
        fetchStats();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: `Failed to delete: ${json.error || 'Unknown error'}` });
      }
    } catch (err: any) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: err?.response?.data?.error || 'Failed to delete product' });
    }
  };

  // ---- Derived data ----
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const formatPrice = (product: Product) => {
    const parts: string[] = [];
    if (product.priceBDT) parts.push(`৳${product.priceBDT.toLocaleString()}`);
    if (product.priceUSDT) parts.push(`$${product.priceUSDT.toLocaleString()}`);
    if (product.price && !product.priceBDT) parts.push(`$${product.price.toLocaleString()}`);
    return parts.length > 0 ? parts.join(' / ') : 'Price not set';
  };

  const formatNumber = (value: number | string | undefined) => {
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'string' && !isNaN(Number(value))) return Number(value).toLocaleString();
    if (typeof value === 'string') return value;
    return '0';
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Products Management</h2>
          <p className="text-gray-400 text-sm mt-1">
            {totalProducts || products.length} product{(totalProducts || products.length) !== 1 ? 's' : ''} in database
            {loadingMore && <span className="text-blue-400 ml-2">(loading more...)</span>}
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20"
        >
          + Add New Product
        </button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-16 mb-3" />
              <div className="h-6 bg-white/10 rounded w-20" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <PackageOpen className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">Total</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalProducts.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-xs font-medium">Categories</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.totalCategories}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">Featured</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.featuredProducts}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl border border-red-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs font-medium">Low Stock</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">{stats.lowStockProducts}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">Revenue USDT</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">${(stats.revenueUSDT || 0).toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-xs font-medium">Revenue BDT</span>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold">৳{(stats.revenueBDT || 0).toLocaleString()}</p>
          </div>
          {stats.topProduct && (
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4 lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-xs font-medium truncate">Top (30d)</span>
              </div>
              <p className="text-white text-sm font-bold truncate" title={stats.topProduct.name}>{stats.topProduct.name}</p>
              <p className="text-green-400 text-xs">{stats.topProduct.sales} sales</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Category Filter Buttons */}
      {products.length > 0 && (
        <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
          {categoryFilters.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center px-4 py-2 rounded-full transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.name
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {cat.icon && <cat.icon className="w-4 h-4 mr-2" />}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-lg" />
                <div className="w-5 h-5 bg-white/10 rounded" />
              </div>
              <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
              <div className="space-y-2 mt-4">
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-1/4" />
              </div>
              <div className="flex space-x-2 mt-4">
                <div className="h-8 bg-blue-500/10 rounded-lg flex-1" />
                <div className="h-8 bg-red-500/10 rounded-lg flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : /* Product Cards Grid */
      filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg font-medium">
            {products.length === 0 ? 'No products yet' : `No products in "${selectedCategory}"`}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {products.length === 0 ? 'Click "Add New Product" to create your first product' : 'Add a product to this category or select a different one'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => setShowProductModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.map((product) => {
            const stock = product.stock ?? 0;
            const stockPercent = Math.min((stock / 1000) * 100, 100);
            const stockColor = stock > 500 ? 'bg-gradient-to-r from-emerald-400 to-green-400' : stock > 100 ? 'bg-gradient-to-r from-amber-400 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-500';
            const hasImage = product.images?.[0] || product.imageUrl;
            const CategoryIcon = product.category ? DEFAULT_CATEGORY_ICONS[product.category] : undefined;
            const cardIndex = filteredProducts.indexOf(product);
            const hue = (cardIndex * 47) % 360;
            const borderColor = `hsl(${hue}, 70%, 60%)`;
            const glowColor = `hsla(${hue}, 70%, 60%, 0.12)`;
            const accentFrom = `hsl(${hue}, 55%, 30%)`;
            const accentTo = `hsl(${(hue + 40) % 360}, 55%, 30%)`;

            return (
              <div key={product._id || product.id} className="group relative bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{ borderColor, '--card-glow': glowColor } as React.CSSProperties}>
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(90deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 60) % 360}, 80%, 55%), hsl(${(hue + 120) % 360}, 70%, 55%))` }} />
                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-xl" style={{ boxShadow: `0 0 40px 8px var(--card-glow, rgba(140,100,255,0.08))` }} />

                {/* Image Section */}
                <div className="relative h-32 overflow-hidden">
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})` }} />
                  {hasImage ? (
                    <img src={product.images?.[0] || product.imageUrl} alt={product.name} className="relative w-full h-full object-fill" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-white/15 group-hover:text-white/25 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 drop-shadow-lg" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {product.featured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-amber-950 rounded-full shadow-lg shadow-amber-400/30 animate-pulse">Featured</span>
                    )}
                    {product.available === false ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full shadow-md shadow-red-500/30">Sold Out</span>
                    ) : stock <= 100 ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-md shadow-orange-500/30">Low Stock</span>
                    ) : null}
                  </div>

                  {/* Category badge */}
                  {product.category && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm text-white rounded-lg border border-white/20 shadow-lg" style={{ backgroundColor: `hsla(${hue}, 40%, 35%, 0.6)` }}>
                        {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                        {product.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2.5">
                  <h3 className="text-sm font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent line-clamp-1">{product.name}</h3>

                  <div className="rounded-lg p-2 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsla(${hue}, 50%, 55%, 0.1), hsla(${(hue + 80) % 360}, 50%, 55%, 0.1))`, border: `1px solid hsla(${hue}, 50%, 55%, 0.15)` }}>
                    <span className="text-sm font-extrabold" style={{ backgroundImage: `linear-gradient(90deg, hsl(${hue}, 70%, 70%), hsl(${(hue + 60) % 360}, 80%, 70%))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {formatPrice(product)}
                    </span>
                  </div>

                  {/* Stock Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500 text-[10px] font-medium uppercase tracking-wide">Stock</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        stock > 500 ? 'text-emerald-400 bg-emerald-400/10' : stock > 100 ? 'text-amber-400 bg-amber-400/10' : 'text-rose-400 bg-rose-400/10'
                      }`}>{stock}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${stockColor} rounded-full transition-all duration-700 ease-out shadow-lg`} style={{ width: `${stockPercent}%`, boxShadow: `0 0 8px hsla(${hue}, 70%, 60%, 0.3)` }} />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-1.5 text-center border border-white/5 bg-gradient-to-b from-violet-500/[0.06] to-transparent">
                      <div className="text-[9px] text-violet-300/70 uppercase tracking-wider font-semibold mb-0.5">Sales</div>
                      <div className="text-xs font-extrabold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{formatNumber(product.sales)}</div>
                    </div>
                    <div className="rounded-lg p-1.5 text-center border border-white/5 bg-gradient-to-b from-cyan-500/[0.06] to-transparent">
                      <div className="text-[9px] text-cyan-300/70 uppercase tracking-wider font-semibold mb-0.5">Revenue</div>
                      <div className="text-xs font-extrabold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">{typeof product.revenue === 'number' ? `৳${product.revenue.toLocaleString()}` : (typeof product.revenue === 'string' ? product.revenue : '—')}</div>
                    </div>
                  </div>

                  {product.trend && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span className="font-semibold bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">{product.trend}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                    <button onClick={() => handleEditProduct(product)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))', color: '#93c5fd', border: '1px solid rgba(139,92,246,0.2)' }}>Edit</button>
                    <button onClick={() => handleDeleteProduct(product)} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(244,63,94,0.2))', color: '#fda4af', border: '1px solid rgba(239,68,68,0.2)' }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* See More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button onClick={handleLoadMore} disabled={loadingMore}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Loading...
              </span>
            ) : `See More (${Math.min(PAGE_SIZE, (totalProducts || products.length) - products.length)})`}
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* Add/Edit Product Modal */}
      {/* =================================================================== */}
      <ProductModal
        showModal={showProductModal}
        setShowModal={setShowProductModal}
        editingProduct={editingProduct}
        onProductAdded={handleProductChanged}
      />

      {/* Alert */}
      <EnhancedAlert
        isOpen={alertConfig?.isOpen ?? false}
        type={alertConfig?.type ?? 'info'}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        onConfirm={() => setAlertConfig(null)}
        confirmText={alertConfig?.confirmText}
        onClose={() => setAlertConfig(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Modal Component (extracted to keep the main page manageable)
// ---------------------------------------------------------------------------
function ProductModal({
  showModal, setShowModal, editingProduct, onProductAdded,
}: {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  editingProduct?: Product | null;
  onProductAdded?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '', category: '', customCategory: '', priceBDT: '', priceUSDT: '', stock: '', price: '',
    details: '', description: '', imageUrl: '', images: [] as string[],
    seoTitle: '', seoDescription: '', seoKeywords: '', seoSlug: '',
    featured: false, available: true, showStock: true, showImageSlider: true,
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [imageDragging, setImageDragging] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('📦');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [features, setFeatures] = useState(['', '', '', '', '']);
  const [generating, setGenerating] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📦', gradient: 'from-gray-500 to-slate-500' });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Fetch exchange rate
  useEffect(() => {
    api.get('/payment-settings').then(res => {
      const json = res.data;
      if (json.success && json.data?.exchangeRate) setExchangeRate(json.data.exchangeRate);
    }).catch(() => {});
  }, []);

  const convertBDTtoUSDT = (bdtAmount: string) => {
    if (!exchangeRate) return '';
    const bdt = parseFloat(bdtAmount);
    if (!isNaN(bdt) && bdt > 0) return formatPrice(bdt / exchangeRate, 2);
    return '';
  };

  // Fetch categories
  useEffect(() => {
    if (!showModal) return;
    api.get('/admin/categories').then(res => {
      const json = res.data;
      if (json.success && json.data) setCategories(json.data);
    }).catch(() => {
      setCategories([
        { name: 'Entertainment', icon: '🎬', gradient: 'from-red-500 to-orange-500', slug: 'entertainment' },
        { name: 'Design', icon: '🎨', gradient: 'from-blue-500 to-cyan-500', slug: 'design' },
        { name: 'Security', icon: '🔒', gradient: 'from-green-500 to-emerald-500', slug: 'security' },
        { name: 'Social Services', icon: '📱', gradient: 'from-indigo-500 to-blue-500', slug: 'social-services' },
      ]);
    });
  }, [showModal]);

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      const editImages = editingProduct.images?.filter(Boolean) || [];
      setImages(editImages);
      setCurrentPreviewIndex(0);
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        customCategory: editingProduct.customCategory || '',
        priceBDT: editingProduct.priceBDT?.toString() || '',
        priceUSDT: editingProduct.priceUSDT?.toString() || '',
        stock: editingProduct.stock?.toString() || '',
        price: editingProduct.price?.toString() || editingProduct.priceUSDT?.toString() || '',
        details: editingProduct.details || '',
        description: editingProduct.description || '',
        imageUrl: editingProduct.imageUrl || '',
        images: editImages,
        seoTitle: editingProduct.seoTitle || '',
        seoDescription: editingProduct.seoDescription || '',
        seoKeywords: editingProduct.seoKeywords || '',
        seoSlug: editingProduct.seoSlug || '',
        featured: editingProduct.featured || false,
        available: editingProduct.available !== undefined ? editingProduct.available : true,
        showStock: Boolean(editingProduct.showStock),
        showImageSlider: editingProduct.showImageSlider !== false,
      });
    } else {
      setFormData({ name: '', category: '', customCategory: '', priceBDT: '', priceUSDT: '', stock: '', price: '', details: '', description: '', imageUrl: '', images: [], seoTitle: '', seoDescription: '', seoKeywords: '', seoSlug: '', featured: false, available: true, showStock: true, showImageSlider: true });
      setImages([]);
      setCurrentPreviewIndex(0);
      setFeatures(['', '', '', '', '']);
    }
  }, [editingProduct]);

  const handleClose = () => {
    setShowModal(false);
    setShowCustomCategory(false);
    setShowIconPicker(false);
    setSelectedIcon('📦');
  };

  const handleGenerateSeo = async () => {
    if (!formData.name.trim()) {
      setAlertConfig({ isOpen: true, type: 'warning', title: 'Validation', message: 'Please enter a product name first' });
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/admin/generate-seo', { productName: formData.name.trim() });
      const json = res.data;
      if (json.success && json.data) {
        const d = json.data;
        setFormData(prev => ({ ...prev, seoTitle: d.seoTitle || '', seoDescription: d.seoDescription || '', seoKeywords: d.seoKeywords || '', seoSlug: d.seoSlug || '' }));
        if (Array.isArray(d.features)) {
          setFeatures(prev => d.features.map((f: string, i: number) => f || prev[i] || ''));
        }
        setAlertConfig({ isOpen: true, type: 'success', title: 'Generated!', message: 'SEO fields and features auto-filled successfully.' });
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: json.error || 'Generation failed' });
      }
    } catch (err: any) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: err?.response?.data?.error || err.message || 'Failed to generate' });
    } finally {
      setGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'priceBDT') {
        const usdtValue = convertBDTtoUSDT(value);
        setFormData(prev => ({ ...prev, priceBDT: value, priceUSDT: usdtValue, price: usdtValue }));
      }
    }
    if (name === 'category' && value === 'custom') setShowCustomCategory(true);
    else if (name === 'category') setShowCustomCategory(false);
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const json = res.data;
      if (json.success) {
        const newUrl = json.url;
        setImages(prev => { setCurrentPreviewIndex(prev.length); return [...prev, newUrl]; });
        setFormData(prev => ({ ...prev, imageUrl: newUrl }));
      } else setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: json.error || 'Upload failed' });
    } catch { setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'Upload failed' });
    } finally { setImageUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalCategory = formData.category;
      if (formData.category === 'custom' && formData.customCategory) {
        const catRes = await api.post('/admin/categories', { name: formData.customCategory });
        const catJson = catRes.data;
        if (catJson.success) finalCategory = catJson.data.name;
        else if (catJson.error?.includes('already exists')) finalCategory = formData.customCategory;
      }
      const featureTexts = features.filter(f => f.trim()).join('\n');
      const productData = {
        ...formData,
        description: featureTexts || formData.description,
        images,
        price: parseFloat(formData.priceUSDT) || 0,
        priceBDT: parseFloat(formData.priceBDT) || 0,
        priceUSDT: parseFloat(formData.priceUSDT) || 0,
        stock: parseInt(formData.stock) || 0,
        category: finalCategory,
      };

      if (editingProduct) {
        const productId = editingProduct._id || editingProduct.id;
        if (!productId) { setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Product ID is required' }); return; }
        const res = await api.put(`/admin/products/${productId}`, productData);
        if (res.data.success) { onProductAdded?.(); handleClose(); }
        else setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: `Error: ${res.data.error || 'Failed to update'}` });
      } else {
        const res = await api.post('/admin/products', productData);
        if (res.data.success) { onProductAdded?.(); handleClose(); }
        else setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: `Error: ${res.data.error || 'Failed to create'}` });
      }
    } catch (err: any) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: `Failed: ${err?.response?.data?.error || err.message || 'Unknown error'}` });
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      const json = res.data;
      if (json.success && json.data) setCategories(json.data);
    } catch { /* ignore */ }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { setAlertConfig({ isOpen: true, type: 'warning', title: 'Validation', message: 'Category name is required' }); return; }
    setCategoryLoading(true);
    try {
      let res;
      if (editingCategory?._id) {
        res = await api.put(`/admin/categories/${editingCategory._id}`, { name: categoryForm.name, icon: categoryForm.icon, gradient: categoryForm.gradient });
      } else {
        res = await api.post('/admin/categories', categoryForm);
      }
      if (res.data.success) { await fetchCategories(); setShowCategoryModal(false); setAlertConfig({ isOpen: true, type: 'success', title: 'Success', message: editingCategory ? 'Category updated!' : 'Category created!' }); }
      else setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to save' });
    } catch { setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to save' }); } finally { setCategoryLoading(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await api.delete(`/admin/categories/${id}`);
      if (res.data.success) { await fetchCategories(); }
      else setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to delete' });
    } catch { setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete' }); }
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    const urlToDelete = images[indexToDelete];
    if (!urlToDelete || !window.confirm('Delete this image?')) return;
    const newImages = images.filter((_, i) => i !== indexToDelete);
    setImages(newImages);
    setFormData(prev => ({ ...prev, imageUrl: newImages[0] || '' }));
    if (currentPreviewIndex >= newImages.length) setCurrentPreviewIndex(Math.max(0, newImages.length - 1));
  };

  if (!showModal) return null;

  return (
    <>
      <EnhancedAlert
        isOpen={alertConfig?.isOpen ?? false}
        type={alertConfig?.type ?? 'info'}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        onConfirm={() => setAlertConfig(null)}
        confirmText={alertConfig?.confirmText}
        onClose={() => setAlertConfig(null)}
      />
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
          <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                <div className="flex gap-2">
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Netflix Premium" className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  <button type="button" onClick={handleGenerateSeo} disabled={generating} className="px-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0">
                    {generating ? (
                      <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> AI</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> AI</>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                {!showCustomCategory ? (
                  <div className="space-y-2">
                    <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-900 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer" required>
                      <option value="" className="bg-slate-900">Select a category</option>
                      {categories.map(cat => <option key={cat.name} value={cat.name} className="bg-slate-900">{cat.name}</option>)}
                      <option value="custom" className="bg-slate-900">+ Create New Category</option>
                    </select>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{categories.length} categories</p>
                      <button type="button" onClick={() => { setShowCategoryModal(true); setEditingCategory(null); setCategoryForm({ name: '', icon: '📦', gradient: 'from-gray-500 to-slate-500' }); }} className="text-xs text-blue-400 hover:text-blue-300 underline">Edit Categories</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                      <input type="text" name="customCategory" value={formData.customCategory} onChange={handleInputChange} placeholder="Category name" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus required />
                      <div className="relative">
                        <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-2xl hover:bg-white/20 transition-all w-14 h-12 flex items-center justify-center">{selectedIcon}</button>
                        {showIconPicker && (
                          <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-white/20 rounded-lg p-2 grid grid-cols-4 gap-1 z-50 shadow-xl">
                            {ICON_OPTIONS.map(icon => (
                              <button key={icon} type="button" onClick={() => { setSelectedIcon(icon); setShowIconPicker(false); }} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded transition-all">{icon}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => { setShowCustomCategory(false); setShowIconPicker(false); setFormData(prev => ({ ...prev, category: '', customCategory: '' })); }} className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all">✕</button>
                    </div>
                    <p className="text-xs text-gray-400">Creating: <span className="text-blue-400 font-medium">{formData.customCategory || 'Enter name'}</span></p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (BDT)</label>
                <input type="number" name="priceBDT" value={formData.priceBDT} onChange={handleInputChange} step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price (USDT)</label>
                <input type="number" name="priceUSDT" value={formData.priceUSDT} onChange={handleInputChange} step="0.01" placeholder="Auto-calculated" className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed" readOnly />
                <p className="text-xs text-gray-400 mt-1">Auto-calculated from BDT</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} placeholder="0" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center cursor-pointer group relative z-10">
                  <div className="relative">
                    <input type="checkbox" name="available" checked={formData.available} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300 shadow-inner"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5 z-20"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Available</span>
                </label>
                <label className="flex items-center cursor-pointer group relative z-10">
                  <div className="relative">
                    <input type="checkbox" name="showStock" checked={formData.showStock === true} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 shadow-inner"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5 z-20"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Show Stock</span>
                </label>
                <label className="flex items-center cursor-pointer group relative z-10">
                  <div className="relative">
                    <input type="checkbox" name="showImageSlider" checked={formData.showImageSlider !== false} onChange={handleInputChange} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 shadow-inner"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5 z-20"></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Image Slider</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Images *</label>
              <div className="space-y-3">
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${imageDragging ? 'border-blue-400 bg-blue-400/10' : 'border-white/20 bg-white/5 hover:border-white/30'}`}
                  onDragOver={e => { e.preventDefault(); setImageDragging(true); }}
                  onDragLeave={e => { e.preventDefault(); setImageDragging(false); }}
                  onDrop={e => { e.preventDefault(); setImageDragging(false); const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith('image/')) handleImageUpload(file); }}
                >
                  <input type="file" ref={imageFileInputRef} accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); e.target.value = ''; }} className="hidden" />
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400 mb-1">{imageDragging ? 'Drop image here' : 'Drag & drop images here'}</p>
                    <p className="text-xs text-gray-500 mb-2">or</p>
                    <button type="button" onClick={() => imageFileInputRef.current?.click()} disabled={imageUploading} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{imageUploading ? 'Uploading...' : 'Browse Files'}</button>
                  </div>
                </div>
                <input type="url" name="imageUrl" value={formData.imageUrl} onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  onBlur={e => { const val = e.target.value.trim(); if (val && !images.includes(val)) { setImages(prev => { setCurrentPreviewIndex(prev.length); return [...prev, val]; }); }}}
                  placeholder="Or enter image URL and press Tab" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {images.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg border border-white/10 bg-black/40 overflow-hidden">
                      <img src={images[currentPreviewIndex]} alt={`Product image ${currentPreviewIndex + 1}`} className="w-full h-40 object-contain" />
                      {images.length > 1 && (
                        <>
                          <button type="button" onClick={() => setCurrentPreviewIndex(prev => (prev - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white"><ChevronLeft className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setCurrentPreviewIndex(prev => (prev + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white"><ChevronRight className="w-4 h-4" /></button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                            {images.map((_, idx) => (
                              <button key={idx} type="button" onClick={() => setCurrentPreviewIndex(idx)} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentPreviewIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/70'}`} />
                            ))}
                          </div>
                        </>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">{currentPreviewIndex + 1} / {images.length}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative group/thumb">
                          <button type="button" onClick={() => setCurrentPreviewIndex(idx)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${idx === currentPreviewIndex ? 'border-blue-400 ring-1 ring-blue-400/50' : 'border-white/10 hover:border-white/30'}`}>
                            <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                          {idx === 0 && <div className="absolute -top-1.5 -left-1.5 px-1 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded leading-none shadow z-10">Cover</div>}
                          <button type="button" onClick={() => handleDeleteImage(idx)} className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover/thumb:opacity-100" title="Delete"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Details (Additional Information)</label>
              <textarea name="details" value={formData.details} onChange={handleInputChange} rows={4} placeholder="Enter additional details..." className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SEO Title</label>
                <input type="text" name="seoTitle" value={formData.seoTitle} onChange={handleInputChange} maxLength={60} placeholder="Max 60 characters" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SEO Slug</label>
                <input type="text" name="seoSlug" value={formData.seoSlug} onChange={handleInputChange} placeholder="e.g. netflix-premium-bd" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SEO Description</label>
              <textarea name="seoDescription" value={formData.seoDescription} onChange={handleInputChange} maxLength={160} rows={3} placeholder="Max 160 characters" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SEO Keywords</label>
              <input type="text" name="seoKeywords" value={formData.seoKeywords} onChange={handleInputChange} placeholder="keyword1, keyword2, keyword3" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Features List</label>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm w-6 text-center flex-shrink-0">{index + 1}.</span>
                    <input type="text" value={feature} onChange={e => { const updated = [...features]; updated[index] = e.target.value; setFeatures(updated); }} placeholder={`Feature ${index + 1}`} className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter up to 5 feature descriptions</p>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer group relative z-10">
                <div className="relative">
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 shadow-inner"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5 z-20"></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Featured Product</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
              <button type="button" onClick={handleClose} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all" disabled={loading}>Cancel</button>
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{editingCategory ? 'Edit Category' : 'Manage Categories'}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{editingCategory ? 'Edit Category' : 'Add New Category'}</h4>
                <div className="flex items-center gap-2">
                  <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Category name" className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="relative">
                    <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xl hover:bg-white/20 transition-all h-10 flex items-center">{categoryForm.icon || '📦'}</button>
                    {showIconPicker && (
                      <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-white/20 rounded-lg p-2 grid grid-cols-4 gap-1 z-50 shadow-xl">
                        {ICON_OPTIONS.map(icon => (
                          <button key={icon} type="button" onClick={() => { setCategoryForm(prev => ({ ...prev, icon })); setShowIconPicker(false); }} className="w-9 h-9 flex items-center justify-center text-lg hover:bg-white/10 rounded transition-all">{icon}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <select value={categoryForm.gradient} onChange={e => setCategoryForm(prev => ({ ...prev, gradient: e.target.value }))} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="from-gray-500 to-slate-500">Default</option>
                    <option value="from-red-500 to-orange-500">Red</option>
                    <option value="from-blue-500 to-cyan-500">Blue</option>
                    <option value="from-green-500 to-emerald-500">Green</option>
                    <option value="from-purple-500 to-pink-500">Purple</option>
                    <option value="from-yellow-500 to-amber-500">Yellow</option>
                  </select>
                  <button type="button" onClick={handleSaveCategory} disabled={categoryLoading} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50">{categoryLoading ? 'Saving...' : editingCategory ? 'Update' : 'Add'}</button>
                </div>
                {editingCategory && (
                  <button type="button" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', icon: '📦', gradient: 'from-gray-500 to-slate-500' }); }} className="text-xs text-blue-400 hover:text-blue-300">&larr; Cancel editing</button>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Existing Categories ({categories.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.length === 0 ? <p className="text-gray-500 text-sm">No categories yet.</p> : categories.map(cat => (
                    <div key={cat._id || cat.name} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon || '📦'}</span>
                        <span className="text-sm font-medium text-white">{cat.name}</span>
                        <span className="text-xs text-gray-500">({cat.productCount || 0})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon || '📦', gradient: cat.gradient || 'from-gray-500 to-slate-500' }); }} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30">Edit</button>
                        <button type="button" onClick={() => handleDeleteCategory(cat._id!)} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../lib/axios';
import { roundCurrency } from '../../utils/formatPrice';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  priceBDT?: number;
  priceUSDT?: number;
  stock?: number;
  imageUrl?: string;
  images?: string[];
  details?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoSlug?: string;
  featured?: boolean;
  available?: boolean;
  showStock?: boolean;
  showImageSlider?: boolean;
}

interface Category {
  _id?: string;
  name: string;
}

const ICON_OPTIONS = ['📦', '🎬', '🎨', '🔒', '📱', '🛠️', '💸', '📊', '🎮', '📚', '🎵', '⚡', '🔐', '🌐', '💎', '🎯'];
const GRADIENT_OPTIONS = [
  { label: 'Gray', value: 'from-gray-500 to-slate-500' },
  { label: 'Red', value: 'from-red-500 to-orange-500' },
  { label: 'Blue', value: 'from-blue-500 to-cyan-500' },
  { label: 'Green', value: 'from-green-500 to-emerald-500' },
  { label: 'Indigo', value: 'from-indigo-500 to-blue-500' },
  { label: 'Violet', value: 'from-violet-500 to-blue-500' },
  { label: 'Yellow', value: 'from-yellow-500 to-amber-500' },
  { label: 'Pink', value: 'from-pink-500 to-rose-500' },
  { label: 'Teal', value: 'from-teal-500 to-emerald-500' },
];

export default function AdminProductEdit() {
  const params = useParams();
  const navigate = useNavigate();
  const productId = params?.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📦');
  const [selectedGradient, setSelectedGradient] = useState('from-gray-500 to-slate-500');
  const [features, setFeatures] = useState<string[]>(['', '', '', '', '']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageDragging, setImageDragging] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    details: '',
    category: '',
    price: 0,
    priceBDT: 0,
    priceUSDT: 0,
    stock: 0,
    imageUrl: '',
    images: [],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoSlug: '',
    featured: false,
    available: true,
    showStock: true,
    showImageSlider: true,
  });

  const [exchangeRate, setExchangeRate] = useState(110);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await api.get(`/admin/products/${productId}`);
      if (res.data.success && res.data.data) {
        setProduct(res.data.data);
        const editImages = res.data.data.images?.filter(Boolean) || [];
        setImages(editImages);
        setCurrentPreviewIndex(0);
        setFormData({
          name: res.data.data.name || '',
          description: res.data.data.description || '',
          details: res.data.data.details || '',
          category: res.data.data.category || '',
          price: res.data.data.price || 0,
          priceBDT: res.data.data.priceBDT || 0,
          priceUSDT: res.data.data.priceUSDT || 0,
          stock: res.data.data.stock || 0,
          imageUrl: res.data.data.imageUrl || '',
          images: editImages,
          seoTitle: res.data.data.seoTitle || '',
          seoDescription: res.data.data.seoDescription || '',
          seoKeywords: res.data.data.seoKeywords || '',
          seoSlug: res.data.data.seoSlug || '',
          featured: res.data.data.featured || false,
          available: res.data.data.available !== false,
          showStock: Boolean(res.data.data.showStock),
          showImageSlider: res.data.data.showImageSlider !== false,
        });
        const featureLines = (res.data.data.description || '')
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean);
        setFeatures(Array.from({ length: 5 }, (_, i) => featureLines[i] || ''));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchCategories();
    }
  }, [productId, fetchProduct, fetchCategories]);

  // Fetch exchange rate from payment settings
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await api.get('/payment-settings');
        if (res.data.success && res.data.data?.exchangeRate) {
          setExchangeRate(res.data.data.exchangeRate);
        }
      } catch {
        // ignore
      }
    };
    fetchExchangeRate();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'priceBDT') {
      const bdt = Number(value) || 0;
      const usdt = bdt > 0 ? roundCurrency(bdt / exchangeRate, 2) : 0;
      setFormData((prev) => ({
        ...prev,
        priceBDT: bdt,
        priceUSDT: usdt,
        price: usdt,
      }));
      return;
    }

    const newValue =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked === true
        : type === 'number'
          ? Number(value)
          : value;

    if (name === 'available' && newValue === false) {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        showStock: false,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === 'category' && value === 'custom') {
      setShowCustomCategory(true);
      return;
    }
    if (name === 'category') {
      setShowCustomCategory(false);
      setCustomCategory('');
      setSelectedIcon('📦');
      setSelectedGradient('from-gray-500 to-slate-500');
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const formDataImg = new FormData();
      formDataImg.append('file', file);

      const res = await api.post('/admin/upload', formDataImg, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const newUrl = res.data.url;
        setImages((prev) => {
          const newIdx = prev.length;
          setCurrentPreviewIndex(newIdx);
          return [...prev, newUrl];
        });
        setFormData((prev) => ({
          ...prev,
          imageUrl: newUrl,
        }));
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: res.data.error || 'Upload failed' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'Upload failed' });
    } finally {
      setImageUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid File', message: 'Please upload an image file' });
      }
    }
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    const urlToDelete = images[indexToDelete];
    if (!urlToDelete) return;

    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      if (urlToDelete.includes('cloudinary.com')) {
        await api.post('/admin/delete-image', { imageUrl: urlToDelete });
      }
      const newImages = images.filter((_, i) => i !== indexToDelete);
      setImages(newImages);
      setFormData((prev) => ({ ...prev, imageUrl: newImages[0] || '', images: newImages }));
      if (currentPreviewIndex >= newImages.length) {
        setCurrentPreviewIndex(Math.max(0, newImages.length - 1));
      }
    } catch {
      // Still update form even if Cloudinary delete fails
      const newImages = images.filter((_, i) => i !== indexToDelete);
      setImages(newImages);
      setFormData((prev) => ({
        ...prev,
        imageUrl: newImages[0] || '',
        images: newImages,
      }));
      if (currentPreviewIndex >= newImages.length) {
        setCurrentPreviewIndex(Math.max(0, newImages.length - 1));
      }
    }
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
          setFeatures(d.features.map((f: string, i: number) => f || features[i] || ''));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Invalid Product ID', message: 'Invalid product ID' });
      return;
    }
    try {
      setSaving(true);
      let finalCategory = formData.category || '';
      if (formData.category === 'custom' && customCategory.trim()) {
        const catRes = await api.post('/admin/categories', {
          name: customCategory.trim(),
          icon: selectedIcon,
          gradient: selectedGradient,
        });
        if (catRes.data.success) {
          finalCategory = catRes.data.data?.name || customCategory.trim();
        } else if (catRes.data.error?.includes('already exists')) {
          finalCategory = customCategory.trim();
        }
      }
      const featureText = features
        .map((f) => f.trim())
        .filter(Boolean)
        .join('\n');
      const payload: Partial<Product> = {
        ...formData,
        category: finalCategory,
        description: featureText,
        details: formData.details || '',
        images,
        price: Number(formData.priceUSDT) || 0,
        showStock: formData.showStock === true,
        showImageSlider: formData.showImageSlider !== false,
      };
      const res = await api.put(`/admin/products/${productId}`, payload);
      if (res.data.success) {
        navigate('/admin/products');
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Update Failed', message: `Failed to update product: ${res.data.error || 'Unknown error'}` });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Update Failed', message: 'Failed to update product' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {alertConfig && <EnhancedAlert {...alertConfig} onClose={() => setAlertConfig(null)} />}
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/products')}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            &larr; Back to Products
          </button>
          <h1 className="text-3xl font-bold text-white">Edit Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGenerateSeo}
                disabled={generating}
                className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
              >
                {generating ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> AI</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> AI</>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Details (Description)</label>
            <textarea
              name="details"
              value={formData.details || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Features List */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Features List</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm w-6 text-center">{index + 1}.</span>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[index] = e.target.value;
                      setFeatures(updated);
                    }}
                    placeholder={`Feature ${index + 1}`}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            {!showCustomCategory ? (
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                <option value="custom">+ Create New Category</option>
              </select>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Category name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={selectedIcon}
                    onChange={(e) => setSelectedIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <div className="space-y-2">
                    <select
                      value={selectedGradient}
                      onChange={(e) => setSelectedGradient(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {GRADIENT_OPTIONS.map((gradient) => (
                        <option key={gradient.value} value={gradient.value}>
                          {gradient.label}
                        </option>
                      ))}
                    </select>
                    <div className={`h-2.5 w-full rounded-full bg-gradient-to-r ${selectedGradient}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Creating: <span className="text-blue-300">{customCategory || 'Enter category name'}</span>{' '}
                    {selectedIcon}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory('');
                      setSelectedIcon('📦');
                      setSelectedGradient('from-gray-500 to-slate-500');
                      setFormData((prev) => ({ ...prev, category: '' }));
                    }}
                    className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price (BDT)</label>
              <input
                type="number"
                name="priceBDT"
                value={formData.priceBDT || 0}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price (USDT)</label>
              <input
                type="number"
                name="priceUSDT"
                value={formData.priceUSDT || 0}
                readOnly
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-700/60 border border-gray-600 rounded-lg text-white cursor-not-allowed"
              />
            </div>
          </div>

          {/* Stock & Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock || 0}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="available"
                    checked={formData.available !== false}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 rounded-full peer-checked:bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300 shadow-inner" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5" />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Available
                </span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="showStock"
                    checked={formData.showStock === true}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 rounded-full peer-checked:bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 shadow-inner" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5" />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Show Stock
                </span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="showImageSlider"
                    checked={formData.showImageSlider !== false}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 rounded-full peer-checked:bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 shadow-inner" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5" />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Image Slider
                </span>
              </label>
            </div>
          </div>

          {/* Product Images */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Product Images</label>
            <div className="space-y-3">
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  imageDragging ? 'border-blue-400 bg-blue-400/10' : 'border-white/20 bg-white/5 hover:border-white/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={imageFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400 mb-1">
                    {imageDragging ? 'Drop image here' : 'Drag & drop product images here'}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">or</p>
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {imageUploading ? 'Uploading...' : 'Browse Files'}
                  </button>
                </div>
              </div>
              <input
                type="url"
                value={formData.imageUrl || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({ ...prev, imageUrl: val }));
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    setImages((prev) => {
                      if (prev.includes(val)) return prev;
                      setCurrentPreviewIndex(prev.length);
                      return [...prev, val];
                    });
                  }
                }}
                placeholder="Or enter image URL and press Tab/Enter"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Image gallery preview */}
              {images.length > 0 && (
                <div className="space-y-3">
                  {/* Main preview with navigation */}
                  <div className="relative rounded-lg border border-white/10 bg-black/40 overflow-hidden">
                    <img
                      src={images[currentPreviewIndex]}
                      alt={`Product image ${currentPreviewIndex + 1}`}
                      className="w-full h-40 object-contain"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPreviewIndex((prev) => (prev - 1 + images.length) % images.length)
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPreviewIndex((prev) => (prev + 1) % images.length)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentPreviewIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === currentPreviewIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs">
                      {currentPreviewIndex + 1} / {images.length}
                    </div>
                  </div>

                  {/* Thumbnail strip */}
                  <div className="flex flex-wrap gap-2">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group/thumb">
                        <button
                          type="button"
                          onClick={() => setCurrentPreviewIndex(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === currentPreviewIndex
                              ? 'border-blue-400 ring-1 ring-blue-400/50'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                        {idx === 0 && (
                          <div className="absolute -top-1.5 -left-1.5 px-1 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded leading-none shadow z-10">
                            Cover
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const reordered = [...images];
                                const [moved] = reordered.splice(idx, 1);
                                reordered.unshift(moved);
                                setImages(reordered);
                                setFormData((prev) => ({
                                  ...prev,
                                  imageUrl: reordered[0] || '',
                                  images: reordered,
                                }));
                                setCurrentPreviewIndex(0);
                              }}
                              className="px-1.5 py-0.5 bg-amber-500/90 hover:bg-amber-500 text-white text-[8px] font-bold rounded transition-colors leading-none"
                              title="Set as cover thumbnail"
                            >
                              Set Cover
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover/thumb:opacity-100"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-1">
                Recommended image size: 1200x675 (16:9), WebP/JPG, under 300KB. You can add multiple images.
              </p>
            </div>
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SEO Title</label>
              <input
                type="text"
                name="seoTitle"
                value={formData.seoTitle || ''}
                onChange={handleInputChange}
                maxLength={60}
                placeholder="Max 60 characters"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SEO Slug</label>
              <input
                type="text"
                name="seoSlug"
                value={formData.seoSlug || ''}
                onChange={handleInputChange}
                placeholder="e.g. netflix-premium-bd"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">SEO Description</label>
            <textarea
              name="seoDescription"
              value={formData.seoDescription || ''}
              onChange={handleInputChange}
              maxLength={160}
              rows={3}
              placeholder="Max 160 characters"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">SEO Keywords</label>
            <input
              type="text"
              name="seoKeywords"
              value={formData.seoKeywords || ''}
              onChange={handleInputChange}
              placeholder="keyword1, keyword2, keyword3"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex space-x-6">
            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured || false}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-700 rounded-full peer-checked:bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 shadow-inner" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow peer-checked:translate-x-5" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                Featured Product
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import {
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ImageIcon,
  X,
  Upload,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

interface PromoOffer {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  enabled: boolean;
  link?: string;
  type: 'image' | 'lottie';
}

export default function SpecialPromoAdmin() {
  const navigate = useNavigate();
  const [promoOffers, setPromoOffers] = useState<PromoOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  const [editType, setEditType] = useState<'image' | 'lottie'>('image');

  // Upload states
  const [editUploading, setEditUploading] = useState(false);
  const [editDragging, setEditDragging] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    fetchPromoOffers();
  }, []);

  const fetchPromoOffers = async () => {
    try {
      const res = await api.get('/admin/settings/promo-offers');
      if (res.data.success) {
        const sorted = res.data.data.sort((a: PromoOffer, b: PromoOffer) => a.order - b.order);
        setPromoOffers(sorted);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const updatePromoOffer = async (id: string) => {
    try {
      const res = await api.put(`/admin/settings/promo-offers/${id}`, {
        title: editTitle,
        description: editDescription,
        imageUrl: editImageUrl,
        link: editLink || undefined,
        order: editOrder,
        type: editType,
      });

      if (res.data.success) {
        setEditingId(null);
        setShowEditModal(false);
        fetchPromoOffers();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to update promo offer' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update promo offer' });
    }
  };

  const closeEditModal = () => {
    setEditingId(null);
    setShowEditModal(false);
  };

  const deletePromoOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo offer?')) {
      return;
    }

    try {
      // Find the offer to get its image URL
      const offerToDelete = promoOffers.find(offer => offer._id === id);

      // Delete image from Cloudinary if it's a Cloudinary URL
      if (offerToDelete?.imageUrl?.includes('cloudinary.com')) {
        try {
          await api.post('/admin/delete-image', { imageUrl: offerToDelete.imageUrl });
        } catch {
          // ignore
        }
      }

      // Delete the promo offer from database
      const res = await api.delete(`/admin/settings/promo-offers/${id}`);

      if (res.data.success) {
        fetchPromoOffers();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to delete promo offer' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete promo offer' });
    }
  };

  const toggleEnabled = async (offer: PromoOffer) => {
    try {
      const res = await api.put(`/admin/settings/promo-offers/${offer._id}`, {
        title: offer.title,
        description: offer.description,
        imageUrl: offer.imageUrl,
        link: offer.link,
        order: offer.order,
        enabled: !offer.enabled,
        type: offer.type,
      });

      if (res.data.success) {
        fetchPromoOffers();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to toggle promo offer' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to toggle promo offer' });
    }
  };

  const moveOffer = async (index: number, direction: 'up' | 'down') => {
    const newOffers = [...promoOffers];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newOffers.length) return;

    // Swap orders
    const tempOrder = newOffers[index].order;
    newOffers[index].order = newOffers[newIndex].order;
    newOffers[newIndex].order = tempOrder;

    // Swap positions in array
    [newOffers[index], newOffers[newIndex]] = [newOffers[newIndex], newOffers[index]];

    try {
      await Promise.all([
        api.put(`/admin/settings/promo-offers/${newOffers[index]._id}`, {
          title: newOffers[index].title,
          description: newOffers[index].description,
          imageUrl: newOffers[index].imageUrl,
          link: newOffers[index].link,
          order: newOffers[index].order,
          type: newOffers[index].type,
        }),
        api.put(`/admin/settings/promo-offers/${newOffers[newIndex]._id}`, {
          title: newOffers[newIndex].title,
          description: newOffers[newIndex].description,
          imageUrl: newOffers[newIndex].imageUrl,
          link: newOffers[newIndex].link,
          order: newOffers[newIndex].order,
          type: newOffers[newIndex].type,
        }),
      ]);
      fetchPromoOffers();
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to reorder promo offers' });
    }
  };

  const handleImageUpload = async (file: File) => {
    setEditUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Pass fileType if it's a Lottie file
      const isLottie = file.name.endsWith('.json') || file.name.endsWith('.lottie');
      if (isLottie) {
        formData.append('fileType', 'lottie');
      }

      const response = await api.post('/admin/upload', formData);

      if (response.data.success) {
        setEditImageUrl(response.data.url);
        if (isLottie) setEditType('lottie');
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: response.data.error || 'Upload failed' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'Upload failed' });
    } finally {
      setEditUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const isLottie = file.name.endsWith('.json') || file.name.endsWith('.lottie');

      if (isLottie || file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid File', message: 'Please upload an image or Lottie file' });
      }
    }
  };

  const startEdit = (offer: PromoOffer) => {
    setEditingId(offer._id);
    setEditTitle(offer.title);
    setEditDescription(offer.description);
    setEditImageUrl(offer.imageUrl);
    setEditLink(offer.link || '');
    setEditOrder(offer.order);
    setEditType(offer.type || 'image');
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Special Promo Management</h1>
        </div>
      </div>

      {/* Add New Promo Offer Button */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Promo Offers</h2>
                </div>
                <button
                  onClick={() => navigate('/admin/special-offer/special-promo/new')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Add New Promo Offer
                </button>
              </div>
      </div>

      {/* Promo Offers List */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
          Promo Offers ({promoOffers.length})
        </h2>

        {promoOffers.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm sm:text-base">No promo offers added yet. Add your first promo offer above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {promoOffers.map((offer, index) => (
              <div key={offer._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                {/* Image/Lottie Preview */}
                <div className="h-40 sm:h-32 bg-white/10 flex items-center justify-center relative">
                  {offer.type === 'lottie' ? (
                    <DotLottieReact
                      src={offer.imageUrl}
                      loop
                      autoplay
                      className="w-full h-full"
                    />
                  ) : (
                    <>
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <ImageIcon className="w-8 h-8 text-gray-400 hidden" />
                    </>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3">
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">{offer.title}</h3>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{offer.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {offer.type === 'lottie' && (
                        <span className="text-purple-400 font-medium">Lottie (JSON)</span>
                      )}
                      <span>Order: {offer.order}</span>
                      <span className={offer.enabled ? 'text-green-400' : 'text-red-400'}>
                        {offer.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-3 pb-3 mt-auto">
                  <div className="flex gap-2 border-t border-white/10 pt-2 justify-between">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveOffer(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 rounded-lg active:scale-90"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveOffer(index, 'down')}
                        disabled={index === promoOffers.length - 1}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-white/5 rounded-lg active:scale-90"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleEnabled(offer)}
                        className={`p-2 ${offer.enabled ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'} rounded-lg active:scale-90`}
                        title={offer.enabled ? 'Disable' : 'Enable'}
                      >
                        {offer.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => startEdit(offer)}
                        className="p-2 text-blue-400 bg-blue-400/10 hover:text-blue-300 rounded-lg active:scale-90"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deletePromoOffer(offer._id)}
                        className="p-2 text-red-400 bg-red-400/10 hover:text-red-300 rounded-lg active:scale-90"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-white/10 p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Edit Promo Offer</h3>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Description *</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Media *</label>
                <div className="space-y-2">
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors ${
                      editDragging
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/30'
                    }`}
                    onDragOver={(e) => handleDragOver(e, false)}
                    onDragLeave={(e) => handleDragLeave(e, false)}
                    onDrop={(e) => handleDrop(e, false)}
                  >
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*,.json,.lottie"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, false);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">
                        {editDragging ? 'Drop file here' : 'Drag & drop image or Lottie here'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">or</p>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={editUploading}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editUploading ? 'Uploading...' : 'Browse Files'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Or enter image URL"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  {editImageUrl && (
                    <div className="mt-2">
                      {editType === 'lottie' ? (
                        <div className="h-20 w-20 flex items-center justify-center bg-purple-500/20 rounded-lg border border-purple-500/30 overflow-hidden">
                          <DotLottieReact
                            src={editImageUrl}
                            loop
                            autoplay
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <img
                          src={editImageUrl}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-lg border border-white/10"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Media Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editType === 'image'}
                      onChange={() => setEditType('image')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-300">Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editType === 'lottie'}
                      onChange={() => setEditType('lottie')}
                      className="w-4 h-4 text-purple-500"
                    />
                    <span className="text-xs sm:text-sm text-gray-300">Lottie Animation (JSON)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Link (optional)</label>
                <input
                  type="text"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="/special-offer"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Order</label>
                <input
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => updatePromoOffer(editingId)}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 order-1 sm:order-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

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

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { ArrowLeft, Upload, X, DotLottieReact } from 'lucide-react';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

export default function AddSpecialPromo() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [order, setOrder] = useState(0);
  const [type, setType] = useState<'image' | 'lottie'>('image');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const isLottie = file.name.endsWith('.json') || file.name.endsWith('.lottie');
      if (isLottie) {
        formData.append('fileType', 'lottie');
      }
      const response = await api.post('/admin/upload', formData);
      if (response.data.success) {
        setImageUrl(response.data.url);
        if (isLottie) setType('lottie');
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: response.data.error || 'Upload failed' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
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

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !imageUrl.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/settings/promo-offers', {
        title,
        description,
        imageUrl,
        link: link || undefined,
        order,
        type,
      });
      if (res.data.success) {
        navigate('/admin/special-offer/special-promo');
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: res.data.error || 'Failed to add promo offer' });
      }
    } catch {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to add promo offer' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <EnhancedAlert
        isOpen={alertConfig?.isOpen ?? false}
        type={alertConfig?.type ?? 'info'}
        title={alertConfig?.title ?? ''}
        message={alertConfig?.message ?? ''}
        onConfirm={() => setAlertConfig(null)}
        confirmText={alertConfig?.confirmText}
        onClose={() => setAlertConfig(null)}
      />

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/special-offer/special-promo')}
            className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Add New Promo Offer</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Create a new promotional offer for the hero section</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6 max-w-2xl">
        <div className="space-y-4 sm:space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Special Promo"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Limited time offer"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Media */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Media *</label>
            <div className="space-y-2">
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors ${
                  dragging
                    ? 'border-blue-400 bg-blue-400/10'
                    : 'border-white/20 bg-white/5 hover:border-white/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.json,.lottie"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-1 sm:mb-2" />
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">
                    {dragging ? 'Drop file here' : 'Drag & drop image or Lottie here'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">or</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Browse Files'}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or enter image URL"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
              {imageUrl && (
                <div className="mt-2">
                  {type === 'lottie' ? (
                    <div className="h-20 w-20 flex items-center justify-center bg-purple-500/20 rounded-lg border border-purple-500/30 overflow-hidden">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg border border-white/10"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Media Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'image'}
                  onChange={() => setType('image')}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-gray-300">Image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'lottie'}
                  onChange={() => setType('lottie')}
                  className="w-4 h-4 text-purple-500"
                />
                <span className="text-sm text-gray-300">Lottie Animation (JSON)</span>
              </label>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Link (optional)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/special-offer"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
          <button
            onClick={() => navigate('/admin/special-offer/special-promo')}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || !imageUrl.trim() || submitting}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
          >
            {submitting ? 'Adding...' : 'Add Promo Offer'}
          </button>
        </div>
      </div>
    </div>
  );
}

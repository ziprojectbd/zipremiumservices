import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  Link,
  Clock,
  Image as ImageIcon,
  Settings,
  ToggleLeft,
  ToggleRight,
  Play
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import api from '../../lib/axios';
import EnhancedAlert from '../../components/public/EnhancedAlert';
import type { AlertConfig } from '../../components/public/EnhancedAlert';

interface PopupManagement {
  _id: string;
  imageUrl: string;
  altText: string;
  offerUrl?: string;
  showDuration: number;
  order: number;
  type: 'image' | 'lottie';
  createdAt: string;
  updatedAt: string;
}

export default function PopupManagement() {
  const [images, setImages] = useState<PopupManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageOfferUrl, setNewImageOfferUrl] = useState('');
  const [newImageDuration, setNewImageDuration] = useState(3);
  const [newImageType, setNewImageType] = useState<'image' | 'lottie'>('image');
  const [newUploading, setNewUploading] = useState(false);
  const [newDragging, setNewDragging] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  // Edit form states
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageAlt, setEditImageAlt] = useState('');
  const [editImageOfferUrl, setEditImageOfferUrl] = useState('');
  const [editImageDuration, setEditImageDuration] = useState(3);
  const [editImageType, setEditImageType] = useState<'image' | 'lottie'>('image');

  // Load images from database on mount
  useEffect(() => {
    fetchImages();
    fetchPopupSettings();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await api.get('/admin/popup-images');
      const data = response.data;
      if (data.success) {
        setImages(data.data);
      }
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchPopupSettings = async () => {
    try {
      const response = await api.get('/admin/popup-settings');
      const data = response.data;
      if (data.success) {
        setPopupEnabled(data.data.enabled);
      }
    } catch (error) {
      // ignore
    }
  };

  const togglePopup = async () => {
    setToggling(true);
    try {
      const response = await api.put('/admin/popup-settings', { enabled: !popupEnabled });
      const data = response.data;
      if (data.success) {
        setPopupEnabled(data.data.enabled);
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update popup settings' });
      }
    } catch (error) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update popup settings' });
    } finally {
      setToggling(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setNewUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Pass fileType if it's a Lottie file
      if (newImageType === 'lottie') {
        formData.append('fileType', 'lottie');
      }

      const response = await api.post('/admin/upload', formData);
      const result = response.data;

      if (result.success) {
        setNewImageUrl(result.url);
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: result.error || 'Upload failed' });
      }
    } catch (error) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'Upload failed' });
    } finally {
      setNewUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/') || file.name.endsWith('.json') || file.name.endsWith('.lottie')) {
        handleImageUpload(file);
      } else {
        setAlertConfig({ isOpen: true, type: 'warning', title: 'Invalid File', message: 'Please upload an image or Lottie JSON file' });
      }
    }
  };

  // Reset new form
  const resetNewForm = () => {
    setNewImageUrl('');
    setNewImageAlt('');
    setNewImageOfferUrl('');
    setNewImageDuration(3);
    setNewImageType('image');
    setShowNewModal(false);
  };

  // Add new image
  const addImage = async () => {
    if (!newImageUrl.trim()) return;

    try {
      const response = await api.post('/admin/popup-images', {
        imageUrl: newImageUrl,
        altText: newImageAlt || 'New Image',
        offerUrl: newImageOfferUrl || undefined,
        showDuration: newImageDuration,
        type: newImageType
      });

      const data = response.data;
      if (data.success) {
        resetNewForm();
        fetchImages();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: data.error || 'Failed to add popup image' });
      }
    } catch (error) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to add popup image' });
    }
  };

  // Update image
  const updateImage = async (id: string, updates: Partial<PopupManagement>) => {
    try {
      const response = await api.put('/admin/popup-images', { id, ...updates });
      const data = response.data;
      if (data.success) {
        setEditingImage(null);
        fetchImages();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: data.error || 'Failed to update popup image' });
      }
    } catch (error) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to update popup image' });
    }
  };

  // Delete image
  const deleteImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup image?')) {
      return;
    }

    try {
      // Find the image to get its URL
      const imageToDelete = images.find((img: PopupManagement) => img._id === id);

      // Delete image from Cloudinary if it's a Cloudinary URL
      if (imageToDelete?.imageUrl?.includes('cloudinary.com')) {
        try {
          await api.post('/admin/delete-image', { imageUrl: imageToDelete.imageUrl });
        } catch (error) {
          // ignore
        }
      }

      // Delete the popup image from database
      const response = await api.delete(`/admin/popup-images?id=${id}`);
      const data = response.data;
      if (data.success) {
        fetchImages();
      } else {
        setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: data.error || 'Failed to delete popup image' });
      }
    } catch (error) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to delete popup image' });
    }
  };

  // Reorder images
  const moveImage = async (id: string, direction: 'up' | 'down') => {
    const index = images.findIndex((img: PopupManagement) => img._id === id);
    if (index === -1) return;

    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= images.length) return;

    // Swap orders
    const tempOrder = newImages[index].order;
    newImages[index].order = newImages[newIndex].order;
    newImages[newIndex].order = tempOrder;

    try {
      await Promise.all([
        api.put('/admin/popup-images', { id: newImages[index]._id, order: newImages[index].order }),
        api.put('/admin/popup-images', { id: newImages[newIndex]._id, order: newImages[newIndex].order }),
      ]);
      fetchImages();
    } catch (error) {
      setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'Failed to reorder popup images' });
    }
  };

  // Start edit
  const startEdit = (image: PopupManagement) => {
    setEditingImage(image._id);
    setEditImageUrl(image.imageUrl);
    setEditImageAlt(image.altText);
    setEditImageOfferUrl(image.offerUrl || '');
    setEditImageDuration(image.showDuration);
    setEditImageType(image.type || 'image');
    setShowEditModal(true);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingImage) return;

    await updateImage(editingImage, {
      imageUrl: editImageUrl,
      altText: editImageAlt,
      offerUrl: editImageOfferUrl || undefined,
      showDuration: editImageDuration,
      type: editImageType
    });
    setShowEditModal(false);
  };

  return (
    <>
      {alertConfig && <EnhancedAlert {...alertConfig} onClose={() => setAlertConfig(null)} />}
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Popup Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300">
                Popup System:
              </span>
              <button
                onClick={togglePopup}
                disabled={toggling}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  popupEnabled
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {popupEnabled ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                {popupEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Add New Image Button */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Popup Media</h2>
              <p className="text-gray-400 mt-1">Manage popup images and Lottie animations</p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <Plus className="w-5 h-5" />
              Add New Media
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              Popup Media ({images.length})
            </h2>

            {images.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No media added yet. Add your first popup media above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image: PopupManagement, index: number) => (
                  <div key={image._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors">
                    {/* Image Preview */}
                    <div className="h-32 bg-black/20 flex items-center justify-center overflow-hidden">
                      {image.type === 'lottie' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <DotLottieReact
                            src={image.imageUrl}
                            loop
                            autoplay
                            className="w-full h-full"
                          />
                        </div>
                      ) : (
                        <>
                          <img
                            src={image.imageUrl}
                            alt={image.altText}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <ImageIcon className="w-8 h-8 text-gray-600 hidden" />
                        </>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base mb-1 truncate">{image.altText}</h3>
                        <div className="flex items-center gap-2">
                          {image.type === 'lottie' && (
                            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">Lottie</span>
                          )}
                          {image.showDuration && (
                            <p className="text-gray-500 text-xs">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {image.showDuration}s
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="px-3 pb-3">
                      <div className="flex gap-1 sm:gap-2 border-t border-white/10 pt-2 justify-between">
                        <button
                          onClick={() => moveImage(image._id, 'up')}
                          disabled={index === 0}
                          className="p-2 sm:p-2.5 text-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start"
                          title="Move Up"
                        >
                          <span className="text-xs sm:text-sm">↑</span>
                        </button>
                        <button
                          onClick={() => moveImage(image._id, 'down')}
                          disabled={index === images.length - 1}
                          className="p-2 sm:p-2.5 text-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start"
                          title="Move Down"
                        >
                          <span className="text-xs sm:text-sm">↓</span>
                        </button>

                        <button
                          onClick={() => startEdit(image)}
                          className="p-2 sm:p-2.5 text-blue-400 hover:text-blue-300 flex items-center justify-center sm:justify-start"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                        <button
                          onClick={() => deleteImage(image._id)}
                          className="p-2 sm:p-2.5 text-red-400 hover:text-red-300 flex items-center justify-center sm:justify-start"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Image Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add New Media</h3>
              <button
                onClick={resetNewForm}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Media File *
                </label>
                <div className="space-y-2">
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      newDragging
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-white/20 bg-white/5 hover:border-white/30'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={newFileInputRef}
                      accept="image/*,.json,.lottie"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400 mb-1">
                        {newDragging ? 'Drop file here' : 'Drag & drop file here'}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">or</p>
                      <button
                        type="button"
                        onClick={() => newFileInputRef.current?.click()}
                        disabled={newUploading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {newUploading ? 'Uploading...' : 'Browse Files'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or enter media URL"
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-500"
                  />
                  {newImageUrl && (
                    <div className="mt-2">
                      {newImageType === 'lottie' ? (
                        <div className="h-20 w-20 flex items-center justify-center bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                          <span className="text-[10px] font-bold text-cyan-400">LOTTIE</span>
                        </div>
                      ) : (
                        <img
                          src={newImageUrl}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-lg border border-white/20"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Media Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newImageType === 'image'}
                      onChange={() => setNewImageType('image')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newImageType === 'lottie'}
                      onChange={() => setNewImageType('lottie')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Lottie Animation</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  placeholder="Image description"
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  <Link className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Offer URL (optional)
                </label>
                <input
                  type="text"
                  value={newImageOfferUrl}
                  onChange={(e) => setNewImageOfferUrl(e.target.value)}
                  placeholder="/special-offer"
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newImageDuration}
                  onChange={(e) => setNewImageDuration(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetNewForm}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addImage}
                disabled={!newImageUrl.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Add Media
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {showEditModal && editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Media</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Media URL
                </label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="Media URL"
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={editImageAlt}
                  onChange={(e) => setEditImageAlt(e.target.value)}
                  placeholder="Image description"
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  Media Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editImageType === 'image'}
                      onChange={() => setEditImageType('image')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editImageType === 'lottie'}
                      onChange={() => setEditImageType('lottie')}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Lottie Animation</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  <Link className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Offer URL (optional)
                </label>
                <input
                  type="text"
                  value={editImageOfferUrl}
                  onChange={(e) => setEditImageOfferUrl(e.target.value)}
                  placeholder="/special-offer"
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={editImageDuration}
                  onChange={(e) => setEditImageDuration(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 sm:py-3 border border-white/20 rounded-lg bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

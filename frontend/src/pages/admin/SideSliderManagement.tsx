import { useEffect, useState } from 'react';
import api from '../../lib/axios';

// ============================================================
// FORM SCHEMA FOR NAVIGATION ITEMS
// ============================================================
const NAVIGATION_SCHEMA = {
  name: { type: 'text', label: 'Name', required: true, placeholder: 'Enter item name' },
  slug: { type: 'text', label: 'Slug', required: true, placeholder: 'url-friendly-slug' },
  icon: { type: 'select', label: 'Icon', options: ['gift', 'arrow-left-right', 'repeat', 'coins', 'book-open'] },
  badge: { type: 'text', label: 'Badge', placeholder: 'Optional badge text' },
  color: {
    type: 'select',
    label: 'Color',
    options: [
      { value: 'from-pink-500 to-rose-500', label: 'Pink to Rose' },
      { value: 'from-blue-500 to-cyan-500', label: 'Blue to Cyan' },
      { value: 'from-green-500 to-emerald-500', label: 'Green to Emerald' },
      { value: 'from-yellow-400 to-orange-500', label: 'Yellow to Orange' },
      { value: 'from-purple-500 to-indigo-500', label: 'Purple to Indigo' },
    ],
  },
  description: { type: 'text', label: 'Description', placeholder: 'Enter description' },
  enabled: { type: 'checkbox', label: 'Enabled' },
  order: { type: 'number', label: 'Order' },
};

// Default values for new item
const getDefaultItem = (order: number) => ({
  name: '',
  slug: '',
  icon: 'gift',
  badge: '',
  color: 'from-blue-500 to-cyan-500',
  description: '',
  enabled: true,
  order,
});

export default function SideSliderManagement() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modal state
  const [modalState, setModalState] = useState<{ mode: 'add' } | { mode: 'edit'; index: number } | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get(`/admin/settings/side-slider?t=${Date.now()}`);
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/settings/side-slider', settings);
      if (res.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        await fetchSettings();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // MODAL HANDLERS
  // ============================================================

  const openAddModal = () => {
    const order = settings?.navigation?.length + 1 || 1;
    setFormData(getDefaultItem(order));
    setFormError(null);
    setModalState({ mode: 'add' });
  };

  const openEditModal = (index: number) => {
    const item = settings?.navigation[index];
    if (item) {
      setFormData({ ...item });
      setFormError(null);
      setModalState({ mode: 'edit', index });
    }
  };

  const closeModal = () => {
    setModalState(null);
    setFormData(null);
    setFormError(null);
  };

  const updateFormField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  const handleFormSubmit = async () => {
    if (!formData.name?.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!formData.slug?.trim()) {
      setFormError('Slug is required');
      return;
    }

    setSubmitting(true);
    try {
      const newSettings = modalState?.mode === 'add'
        ? { ...settings, navigation: [...(settings.navigation || []), { ...formData }] }
        : {
            ...settings,
            navigation: settings.navigation.map((item: any, i: number) =>
              i === (modalState as any).index ? formData : item
            ),
          };

      setSettings(modalState?.mode === 'add'
        ? newSettings
        : {
            ...settings,
            navigation: settings.navigation.map((item: any, i: number) =>
              i === (modalState as any).index ? formData : item
            ),
          });

      const res = await api.put('/admin/settings/side-slider', newSettings);
      if (res.data.success) {
        await fetchSettings();
      }
      closeModal();
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // DELETE ITEM
  // ============================================================

  const deleteItem = async (index: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const newNavigation = settings.navigation.filter((_: any, i: number) => i !== index);
      setSettings({ ...settings, navigation: newNavigation });

      const res = await api.put('/admin/settings/side-slider', { ...settings, navigation: newNavigation });
      if (res.data.success) {
        await fetchSettings();
      }
    } catch {
      await fetchSettings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // ============================================================
  // RENDER FORM FIELD
  // ============================================================
  const renderFormField = (fieldName: string, fieldDef: any, value: any, onChange: (val: any) => void) => {
    switch (fieldDef.type) {
      case 'text':
        return (
          <div key={fieldName}>
            <label className="text-xs text-gray-400 mb-1 block">
              {fieldDef.label}
              {fieldDef.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={fieldDef.placeholder || ''}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        );
      case 'select':
        return (
          <div key={fieldName}>
            <label className="text-xs text-gray-400 mb-1 block">{fieldDef.label}</label>
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              {fieldDef.options.map((opt: any) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return (
                  <option key={optValue} value={optValue}>
                    {optLabel}
                  </option>
                );
              })}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div key={fieldName} className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <label className="text-xs text-gray-400">{fieldDef.label}</label>
          </div>
        );
      case 'number':
        return (
          <div key={fieldName}>
            <label className="text-xs text-gray-400 mb-1 block">{fieldDef.label}</label>
            <input
              type="number"
              value={value || 0}
              onChange={(e) => onChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const modalTitle = modalState?.mode === 'add' ? 'Add New Navigation Item' : 'Edit Navigation Item';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Side Slider Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure mobile side slider navigation and content</p>
        </div>
        <div className="flex gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/15 border border-green-400/30 text-green-300">
              Saved successfully
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main 2-column grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Navigation Items */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Navigation Items</h3>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-600/30 transition-all active:scale-[0.98]"
            >
              + Add Item
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 bg-white/5 rounded-lg mb-2 text-xs font-semibold text-gray-400">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Slug</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {settings?.navigation?.map((item: any, index: number) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 items-center">
                <div className="sm:col-span-3">
                  <span className="sm:hidden text-xs text-gray-400 block mb-1">Name</span>
                  <span className="text-sm font-medium text-white">{item.name}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="sm:hidden text-xs text-gray-400 block mb-1">Slug</span>
                  <span className="text-sm text-gray-300">{item.slug}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="sm:hidden text-xs text-gray-400 block mb-1">Description</span>
                  <span className="text-sm text-gray-400 truncate">{item.description}</span>
                </div>
                <div className="sm:col-span-3 flex gap-2 justify-end">
                  <button
                    onClick={() => openEditModal(index)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(index)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {modalState && formData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">{modalTitle}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Error */}
              {formError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {formError}
                </div>
              )}

              {/* Dynamic Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(NAVIGATION_SCHEMA).map(([fieldName, fieldDef]) =>
                  renderFormField(fieldName, fieldDef as any, formData[fieldName], (value) => updateFormField(fieldName, value))
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Activity */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Live Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.liveActivity?.enabled}
                  onChange={(e) => setSettings({ ...settings, liveActivity: { ...settings.liveActivity, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <label className="text-sm text-white">Enable Live Activity</label>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Orders (JSON)</label>
              <textarea
                value={JSON.stringify(settings?.liveActivity?.orders || [], null, 2)}
                onChange={(e) => {
                  try {
                    const orders = JSON.parse(e.target.value);
                    setSettings({ ...settings, liveActivity: { ...settings.liveActivity, orders } });
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                rows={6}
              />
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Trust Badges</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Safe Badge</h4>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.trustBadges?.safe?.enabled}
                    onChange={(e) => setSettings({ ...settings, trustBadges: { ...settings.trustBadges, safe: { ...settings.trustBadges.safe, enabled: e.target.checked } } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <label className="text-sm text-white">Enabled</label>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input
                  type="text"
                  value={settings?.trustBadges?.safe?.label || ''}
                  onChange={(e) => setSettings({ ...settings, trustBadges: { ...settings.trustBadges, safe: { ...settings.trustBadges.safe, label: e.target.value } } })}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Fast Badge</h4>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.trustBadges?.fast?.enabled}
                    onChange={(e) => setSettings({ ...settings, trustBadges: { ...settings.trustBadges, fast: { ...settings.trustBadges.fast, enabled: e.target.checked } } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <label className="text-sm text-white">Enabled</label>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label</label>
                <input
                  type="text"
                  value={settings?.trustBadges?.fast?.label || ''}
                  onChange={(e) => setSettings({ ...settings, trustBadges: { ...settings.trustBadges, fast: { ...settings.trustBadges.fast, label: e.target.value } } })}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Services */}
        <div className="lg:col-span-2 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Premium Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.premiumServices?.enabled}
                  onChange={(e) => setSettings({ ...settings, premiumServices: { ...settings.premiumServices, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <label className="text-sm text-white">Enabled</label>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Logo URL</label>
              <input
                type="text"
                value={settings?.premiumServices?.logo || ''}
                onChange={(e) => setSettings({ ...settings, premiumServices: { ...settings.premiumServices, logo: e.target.value } })}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title</label>
              <input
                type="text"
                value={settings?.premiumServices?.title || ''}
                onChange={(e) => setSettings({ ...settings, premiumServices: { ...settings.premiumServices, title: e.target.value } })}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Subtitle</label>
              <input
                type="text"
                value={settings?.premiumServices?.subtitle || ''}
                onChange={(e) => setSettings({ ...settings, premiumServices: { ...settings.premiumServices, subtitle: e.target.value } })}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

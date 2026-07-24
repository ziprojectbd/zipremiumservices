import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, GripVertical, ChevronUp, ChevronDown, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  title: string;
  color: string;
  hoverColor: string;
  links: FooterLink[];
}

const colorOptions = [
  { value: 'text-pink-300', hover: 'hover:text-pink-400', label: 'Pink' },
  { value: 'text-indigo-300', hover: 'hover:text-indigo-400', label: 'Indigo' },
  { value: 'text-emerald-300', hover: 'hover:text-emerald-400', label: 'Emerald' },
  { value: 'text-yellow-300', hover: 'hover:text-yellow-400', label: 'Yellow' },
  { value: 'text-blue-300', hover: 'hover:text-blue-400', label: 'Blue' },
  { value: 'text-purple-300', hover: 'hover:text-purple-400', label: 'Purple' },
  { value: 'text-red-300', hover: 'hover:text-red-400', label: 'Red' },
  { value: 'text-green-300', hover: 'hover:text-green-400', label: 'Green' },
];

export default function FooterManagement() {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState<{ sectionIndex: number; linkIndex: number } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const res = await api.get('/admin/footer');
      if (res.data.success) {
        setSections(res.data.data.sections || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const saveFooterData = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/footer', { sections });
      if (res.data.success) {
        showNotification('success', 'Footer data saved successfully!');
      } else {
        showNotification('error', 'Error saving footer data: ' + (res.data.error || ''));
      }
    } catch {
      showNotification('error', 'Error saving footer data');
    } finally {
      setSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const addSection = () => {
    const newSection: FooterSection = {
      title: 'New Section',
      color: 'text-blue-300',
      hoverColor: 'hover:text-blue-400',
      links: []
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: keyof FooterSection, value: any) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setSections(updatedSections);
  };

  const addLink = (sectionIndex: number) => {
    const newLink: FooterLink = { name: 'New Link', href: '/new-link' };
    const updatedSections = [...sections];
    updatedSections[sectionIndex].links.push(newLink);
    setSections(updatedSections);
  };

  const removeLink = (sectionIndex: number, linkIndex: number) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].links = updatedSections[sectionIndex].links.filter((_, i) => i !== linkIndex);
    setSections(updatedSections);
  };

  const updateLink = (sectionIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].links[linkIndex] = {
      ...updatedSections[sectionIndex].links[linkIndex],
      [field]: value
    };
    setSections(updatedSections);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < sections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      setSections(newSections);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-12 bg-white/10 rounded-lg w-1/3 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-white/5 rounded-lg border border-white/10"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/5 rounded-2xl shadow-xl border border-white/10">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Footer Management
              </h1>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Design and customize your website footer with beautiful sections and links
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={addSection}
              className="px-4 sm:px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-3 font-medium border border-white/10"
            >
              <Plus className="w-5 h-5" />
              <span>Add Section</span>
            </button>
            <button
              onClick={saveFooterData}
              disabled={saving}
              className="px-4 sm:px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium border border-white/10"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up backdrop-blur-lg border ${
              notification.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          )}

          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-white/10 rounded-lg border border-white/10">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    {editingSection === sectionIndex ? (
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                        onBlur={() => setEditingSection(null)}
                        className="text-xl font-bold bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="text-xl font-bold text-white cursor-pointer hover:text-gray-300 transition-colors truncate"
                        onClick={() => setEditingSection(sectionIndex)}
                      >
                        {section.title}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => moveSection(sectionIndex, 'up')}
                      disabled={sectionIndex === 0}
                      className="p-2.5 bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                    >
                      <ChevronUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                    <button
                      onClick={() => moveSection(sectionIndex, 'down')}
                      disabled={sectionIndex === sections.length - 1}
                      className="p-2.5 bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                    >
                      <ChevronDown className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                    <button
                      onClick={() => setEditingSection(sectionIndex)}
                      className="p-2.5 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeSection(sectionIndex)}
                      className="p-2.5 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Color Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Section Color Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {colorOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          updateSection(sectionIndex, 'color', option.value);
                          updateSection(sectionIndex, 'hoverColor', option.hover);
                        }}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          section.color === option.value
                            ? 'border-blue-500/50 bg-white/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${option.value}`}></div>
                          <span className="text-sm font-medium text-white">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Links Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Links</h4>
                    <button
                      onClick={() => addLink(sectionIndex)}
                      className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {section.links.map((link, linkIndex) => (
                      <div
                        key={linkIndex}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                          </div>
                          {editingLink?.sectionIndex === sectionIndex && editingLink?.linkIndex === linkIndex ? (
                            <div className="flex-1 flex flex-col sm:flex-row gap-3">
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => updateLink(sectionIndex, linkIndex, 'name', e.target.value)}
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Link name"
                              />
                              <input
                                type="text"
                                value={link.href}
                                onChange={(e) => updateLink(sectionIndex, linkIndex, 'href', e.target.value)}
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Link URL"
                              />
                              <button
                                onClick={() => setEditingLink(null)}
                                className="p-2.5 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate mb-1">{link.name}</p>
                                <p className="text-gray-400 text-sm truncate">{link.href}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingLink({ sectionIndex, linkIndex })}
                                  className="p-2.5 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeLink(sectionIndex, linkIndex)}
                                  className="p-2.5 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sections.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-3xl border border-white/10 mb-6">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Sections Yet</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Create your first footer section to start building your website's footer
              </p>
              <button
                onClick={addSection}
                className="px-6 sm:px-8 py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-3 mx-auto font-medium text-lg border border-white/10"
              >
                <Plus className="w-6 h-6" />
                <span>Create Your First Section</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

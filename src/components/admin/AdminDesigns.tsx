import React, { useState, useRef } from 'react';
import {
  Plus,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  Layers,
  ArrowUp,
  ArrowDown,
  X,
  Edit2,
} from 'lucide-react';
import type { DesignItem, DesignImage } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminDesignsProps {
  designs: DesignItem[];
  onRefresh: () => void;
}

export const AdminDesigns: React.FC<AdminDesignsProps> = ({ designs, onRefresh }) => {
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<DesignImage[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'square' | 'landscape' | 'tall'>('portrait');
  const [previewIndex, setPreviewIndex] = useState(0);

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);

  // Quick URL Add fallback
  const [manualUrlInput, setManualUrlInput] = useState('');

  const openNewDesignModal = () => {
    setEditingDesignId(null);
    setTitle('');
    setImages([]);
    setIsPublished(true);
    setAspectRatio('portrait');
    setPreviewIndex(0);
    setStatusMessage(null);
    setIsEditorOpen(true);
  };

  const openEditDesignModal = (design: DesignItem) => {
    setEditingDesignId(design.id);
    setTitle(design.title || '');
    setImages(design.images.map((img) => ({ ...img })));
    setIsPublished(design.isPublished);
    setAspectRatio(design.aspectRatio || 'portrait');
    setPreviewIndex(0);
    setStatusMessage(null);
    setIsEditorOpen(true);
  };

  // Upload handler via /api/admin/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (replacingImageIndex !== null) {
        // Replace target image
        const newUrl = data.files[0].url;
        setImages((prev) => {
          const updated = [...prev];
          updated[replacingImageIndex] = {
            ...updated[replacingImageIndex],
            url: newUrl,
          };
          return updated;
        });
        setReplacingImageIndex(null);
      } else {
        // Append new images
        const newImages: DesignImage[] = data.files.map((f: any, idx: number) => ({
          id: `img_${Date.now()}_${idx}`,
          url: f.url,
          alt: '',
          caption: '',
        }));
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload files' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    const newImage: DesignImage = {
      id: `img_${Date.now()}`,
      url: manualUrlInput.trim(),
      alt: '',
      caption: '',
    };
    setImages((prev) => [...prev, newImage]);
    setManualUrlInput('');
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
    if (previewIndex === fromIdx) setPreviewIndex(toIdx);
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    if (previewIndex >= images.length - 1) {
      setPreviewIndex(Math.max(0, images.length - 2));
    }
  };

  const handleSaveDesign = async (publishStatus?: boolean) => {
    if (images.length === 0) {
      setStatusMessage({ type: 'error', text: 'At least one image is required to save.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const publishFlag = publishStatus !== undefined ? publishStatus : isPublished;

    const payload = {
      title,
      images,
      isPublished: publishFlag,
      aspectRatio,
    };

    try {
      let res;
      if (editingDesignId) {
        res = await fetch(`/api/admin/designs/${editingDesignId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/designs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save design');
      }

      setIsEditorOpen(false);
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (design: DesignItem) => {
    try {
      const res = await fetch(`/api/admin/designs/${design.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isPublished: !design.isPublished }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this design post?')) return;

    try {
      const res = await fetch(`/api/admin/designs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleReorderDesign = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= designs.length) return;

    const newOrder = [...designs];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((d) => d.id);

    try {
      const res = await fetch('/api/admin/designs-reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424]/10 pb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#242424]">Design Management</h2>
          <p className="text-xs font-mono text-[#242424]/60">
            Total Designs: {designs.length} | Published: {designs.filter((d) => d.isPublished).length}
          </p>
        </div>

        <button
          id="add-new-design-btn"
          type="button"
          onClick={openNewDesignModal}
          className="px-5 py-2.5 bg-[#242424] hover:bg-[#383838] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-md flex items-center space-x-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Design</span>
        </button>
      </div>

      {/* Existing Designs Grid */}
      {designs.length === 0 ? (
        <div className="p-12 border border-dashed border-[#242424]/15 rounded-lg text-center text-[#242424]/50 font-mono text-xs bg-white/40">
          No designs created yet. Click &quot;Add Design&quot; above to upload your first visual artefact.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {designs.map((design, index) => {
            const coverImage = design.images[0]?.url;
            return (
              <div
                key={design.id}
                className="bg-white border border-[#242424]/10 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-[#242424]/20 transition-all shadow-sm"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-4/3 bg-[#FFF8EE] overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={design.title || 'Design cover'}
                      className="w-full h-full object-cover select-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#242424]/40 font-mono text-xs">
                      No Image
                    </div>
                  )}

                  {/* Carousel Count Badge */}
                  {design.images.length > 1 && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur border border-[#242424]/10 text-[10px] font-mono text-[#242424] flex items-center space-x-1 shadow-sm font-medium">
                      <Layers className="w-3 h-3 text-[#242424]/70" />
                      <span>{design.images.length} images</span>
                    </div>
                  )}

                  {/* Publish Status Pill */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold border ${
                        design.isPublished
                          ? 'bg-[#DDF3E8] text-[#242424] border-[#242424]/10'
                          : 'bg-[#FFF1C9] text-[#242424] border-[#242424]/10'
                      }`}
                    >
                      {design.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Card Info & Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#242424]/60">Order #{index + 1}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleReorderDesign(index, 'up')}
                        aria-label="Move design up in order"
                        className="p-1 text-[#242424]/50 hover:text-[#242424] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === designs.length - 1}
                        onClick={() => handleReorderDesign(index, 'down')}
                        aria-label="Move design down in order"
                        className="p-1 text-[#242424]/50 hover:text-[#242424] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {design.title && (
                    <p className="text-xs font-medium text-[#242424] truncate">{design.title}</p>
                  )}

                  {/* Action Buttons: Edit | Unpublish/Publish | Delete */}
                  <div className="pt-2 border-t border-[#242424]/10 flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => openEditDesignModal(design)}
                      className="text-[#242424]/80 hover:text-[#242424] flex items-center space-x-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(design)}
                      className="text-[#242424]/60 hover:text-[#242424] transition-colors"
                    >
                      {design.isPublished ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDesign(design.id)}
                      className="text-rose-600 hover:text-rose-800 flex items-center space-x-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Design Creator & Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-[#242424]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#242424]/10 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#242424]/10 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#242424]">
                  {editingDesignId ? 'Edit Design Post' : 'Add New Design Post'}
                </h3>
                <p className="text-xs font-mono text-[#242424]/60">
                  {images.length > 1
                    ? `Carousel Post (${images.length} images)`
                    : images.length === 1
                    ? 'Single Image Post'
                    : 'No images added yet'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-[#242424]/60 hover:text-[#242424] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#242424]">
              {statusMessage && (
                <div
                  className={`p-3 text-xs font-mono rounded-md border flex items-center space-x-2 ${
                    statusMessage.type === 'error'
                      ? 'bg-[#F8DDE6]/80 border-rose-300 text-rose-900'
                      : 'bg-[#DDF3E8]/80 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Optional Internal Title for Admin Organization */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70">
                  Admin Label / Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monolith Architectural Monograph"
                  className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
                />
              </div>

              {/* Upload Drop Zone & Controls */}
              <div className="space-y-3">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 flex items-center justify-between">
                  <span>Images ({images.length})</span>
                  <span className="text-[10px] text-[#242424]/50">
                    Upload one or multiple images (becomes a carousel)
                  </span>
                </label>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-[#E7DDF7]/60 hover:bg-[#E7DDF7] text-[#242424] text-xs font-mono rounded-md flex items-center space-x-2 transition-colors disabled:opacity-50 border border-[#242424]/10 font-medium"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Images</span>
                      </>
                    )}
                  </button>

                  {/* Quick URL Adder */}
                  <div className="flex-1 min-w-[240px] flex items-center space-x-2">
                    <input
                      type="url"
                      value={manualUrlInput}
                      onChange={(e) => setManualUrlInput(e.target.value)}
                      placeholder="Or paste image URL directly..."
                      className="flex-1 px-3 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-3 py-2 bg-[#DCEEFF]/60 hover:bg-[#DCEEFF] text-[#242424] text-xs font-mono rounded-md border border-[#242424]/10 transition-colors font-medium"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Images Carousel Management List */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <span className="text-xs font-mono text-[#242424]/70 block">
                    Reorder, replace, or annotate images:
                  </span>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        className="p-3 bg-[#FFF8EE]/60 border border-[#242424]/10 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <img
                            src={img.url}
                            alt="preview"
                            className="w-14 h-14 object-cover rounded-md bg-white border border-[#242424]/10 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <span className="text-xs font-mono text-[#242424]/70">
                              Image {idx + 1} of {images.length}
                            </span>
                            <input
                              type="text"
                              value={img.alt || ''}
                              onChange={(e) => {
                                const newAlt = e.target.value;
                                setImages((prev) => {
                                  const updated = [...prev];
                                  updated[idx].alt = newAlt;
                                  return updated;
                                });
                              }}
                              placeholder="Accessibility alt text (optional)"
                              className="w-full px-2.5 py-1 text-xs bg-white border border-[#242424]/15 rounded text-[#242424] placeholder:text-[#242424]/40 focus:outline-none focus:border-[#242424] font-mono"
                            />
                          </div>
                        </div>

                        {/* Reorder and Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="p-1.5 text-[#242424]/50 hover:text-[#242424] disabled:opacity-20 transition-colors"
                            title="Move left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="p-1.5 text-[#242424]/50 hover:text-[#242424] disabled:opacity-20 transition-colors"
                            title="Move right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplacingImageIndex(idx);
                              replaceFileInputRef.current?.click();
                            }}
                            className="px-2.5 py-1 text-[11px] font-mono bg-white hover:bg-black/5 text-[#242424] border border-[#242424]/15 rounded transition-colors font-medium"
                          >
                            Replace
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 transition-colors"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Visual Preview Before Publishing */}
              {images.length > 0 && (
                <div className="border-t border-[#242424]/10 pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#242424]/70 flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visual Preview Before Publishing</span>
                    </span>
                    {images.length > 1 && (
                      <span className="text-xs font-mono text-[#242424]/50">
                        {previewIndex + 1} / {images.length}
                      </span>
                    )}
                  </div>

                  <div className="relative w-full max-h-72 bg-[#FFF8EE] rounded-md flex items-center justify-center p-2 overflow-hidden border border-[#242424]/10">
                    <img
                      src={images[previewIndex]?.url}
                      alt="Preview"
                      className="max-h-64 object-contain rounded shadow-sm"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPreviewIndex((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-3 p-2 bg-white/80 border border-[#242424]/10 rounded-full text-[#242424] hover:bg-white shadow-sm transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewIndex((prev) => (prev + 1) % images.length)}
                          className="absolute right-3 p-2 bg-white/80 border border-[#242424]/10 rounded-full text-[#242424] hover:bg-white shadow-sm transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Status Radio / Checkbox */}
              <div className="border-t border-[#242424]/10 pt-4 flex items-center space-x-6 text-xs font-mono">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="publish_status"
                    checked={isPublished}
                    onChange={() => setIsPublished(true)}
                    className="accent-[#242424]"
                  />
                  <span className="text-[#242424]">Publish Immediately</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="publish_status"
                    checked={!isPublished}
                    onChange={() => setIsPublished(false)}
                    className="accent-[#242424]"
                  />
                  <span className="text-[#242424]/60">Save as Draft (Private)</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#242424]/10 flex items-center justify-between bg-[#FFF8EE]/30">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-xs font-mono text-[#242424]/60 hover:text-[#242424] transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveDesign(false)}
                  className="px-4 py-2 border border-[#242424]/15 hover:border-[#242424] text-[#242424] text-xs font-mono rounded-md transition-colors bg-white"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveDesign(true)}
                  className="px-6 py-2 bg-[#242424] hover:bg-[#383838] text-white font-bold text-xs font-mono uppercase tracking-wider rounded-md flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Publish Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

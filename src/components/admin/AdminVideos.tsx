import React, { useState, useRef } from 'react';
import {
  Plus,
  Upload,
  Trash2,
  Play,
  Check,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  X,
  Edit2,
  Video as VideoIcon,
} from 'lucide-react';
import type { VideoItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminVideosProps {
  videos: VideoItem[];
  onRefresh: () => void;
}

export const AdminVideos: React.FC<AdminVideosProps> = ({ videos, onRefresh }) => {
  const { getAuthHeaders } = useAuth();
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait' | 'square'>('landscape');

  // Status Feedback
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openNewVideoModal = () => {
    setEditingVideoId(null);
    setTitle('');
    setVideoUrl('');
    setThumbnailUrl('');
    setAlt('');
    setIsPublished(true);
    setAspectRatio('landscape');
    setStatusMessage(null);
    setIsEditorOpen(true);
  };

  const openEditVideoModal = (video: VideoItem) => {
    setEditingVideoId(video.id);
    setTitle(video.title || '');
    setVideoUrl(video.videoUrl);
    setThumbnailUrl(video.thumbnailUrl);
    setAlt(video.alt || '');
    setIsPublished(video.isPublished);
    setAspectRatio(video.aspectRatio || 'landscape');
    setStatusMessage(null);
    setIsEditorOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('files', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video upload failed');

      setVideoUrl(data.files[0].url);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload video' });
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('files', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thumbnail upload failed');

      setThumbnailUrl(data.files[0].url);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload thumbnail' });
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = '';
    }
  };

  const handleSaveVideo = async (publishStatus?: boolean) => {
    if (!videoUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Video source (file or URL) is required.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const publishFlag = publishStatus !== undefined ? publishStatus : isPublished;

    const payload = {
      title,
      videoUrl,
      thumbnailUrl,
      alt,
      isPublished: publishFlag,
      aspectRatio,
    };

    try {
      let res;
      if (editingVideoId) {
        res = await fetch(`/api/admin/videos/${editingVideoId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save video');

      setIsEditorOpen(false);
      onRefresh();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (video: VideoItem) => {
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isPublished: !video.isPublished }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this video item?')) return;

    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
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

  const handleReorderVideo = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const newOrder = [...videos];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((v) => v.id);

    try {
      const res = await fetch('/api/admin/videos-reorder', {
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
          <h2 className="font-display text-2xl font-bold text-[#242424]">Video Management</h2>
          <p className="text-xs font-mono text-[#242424]/60">
            Total Videos: {videos.length} | Published: {videos.filter((v) => v.isPublished).length}
          </p>
        </div>

        <button
          id="add-new-video-btn"
          type="button"
          onClick={openNewVideoModal}
          className="px-5 py-2.5 bg-[#242424] hover:bg-[#383838] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-md flex items-center space-x-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Video</span>
        </button>
      </div>

      {/* Existing Videos Grid */}
      {videos.length === 0 ? (
        <div className="p-12 border border-dashed border-[#242424]/15 rounded-lg text-center text-[#242424]/50 font-mono text-xs bg-white/40">
          No motion videos added yet. Click &quot;Add Video&quot; above to upload your first video.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="bg-white border border-[#242424]/10 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-[#242424]/20 transition-all shadow-sm"
            >
              {/* Video Preview / Thumbnail */}
              <div className="relative aspect-video bg-[#FFF8EE] overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.alt || video.title || 'Thumbnail'}
                    className="w-full h-full object-cover select-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#242424]/40 font-mono text-xs space-y-2">
                    <VideoIcon className="w-6 h-6" />
                    <span>No Thumbnail</span>
                  </div>
                )}

                {/* Centered Play Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-white/80 border border-[#242424]/15 flex items-center justify-center text-[#242424] shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-[#242424] translate-x-0.5" />
                  </div>
                </div>

                {/* Publish Status Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold border ${
                      video.isPublished
                        ? 'bg-[#DDF3E8] text-[#242424] border-[#242424]/10'
                        : 'bg-[#FFF1C9] text-[#242424] border-[#242424]/10'
                    }`}
                  >
                    {video.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Card Details & Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#242424]/60">Order #{index + 1}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleReorderVideo(index, 'up')}
                      aria-label="Move video up"
                      className="p-1 text-[#242424]/50 hover:text-[#242424] disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === videos.length - 1}
                      onClick={() => handleReorderVideo(index, 'down')}
                      aria-label="Move video down"
                      className="p-1 text-[#242424]/50 hover:text-[#242424] disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {video.title && (
                  <p className="text-xs font-medium text-[#242424] truncate">{video.title}</p>
                )}

                {/* Edit | Unpublish | Delete */}
                <div className="pt-2 border-t border-[#242424]/10 flex items-center justify-between text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => openEditVideoModal(video)}
                    className="text-[#242424]/80 hover:text-[#242424] flex items-center space-x-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePublish(video)}
                    className="text-[#242424]/60 hover:text-[#242424] transition-colors"
                  >
                    {video.isPublished ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-rose-600 hover:text-rose-800 flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Add / Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-[#242424]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-[#242424]/10 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#242424]/10 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#242424]">
                  {editingVideoId ? 'Edit Video Item' : 'Add New Video'}
                </h3>
                <p className="text-xs font-mono text-[#242424]/60">
                  Upload video and preview poster thumbnail
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

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70">
                  Admin Label / Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kinetic Typographic Identity"
                  className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
                />
              </div>

              {/* Video File Upload / URL */}
              <div className="space-y-3">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 flex items-center justify-between">
                  <span>Video Source</span>
                  <span className="text-[10px] text-[#242424]/50">MP4, WebM, MOV</span>
                </label>

                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingVideo}
                    onClick={() => videoFileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#E7DDF7]/60 hover:bg-[#E7DDF7] text-[#242424] text-xs font-mono rounded-md flex items-center space-x-2 transition-colors disabled:opacity-50 border border-[#242424]/10 font-medium"
                  >
                    {isUploadingVideo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading Video...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Video File</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Or paste video URL (e.g. /uploads/video.mp4 or CDN link)"
                    className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
                  />
                </div>
              </div>

              {/* Video Thumbnail Upload / URL */}
              <div className="space-y-3">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 flex items-center justify-between">
                  <span>Thumbnail Preview Image</span>
                  <span className="text-[10px] text-[#242424]/50">JPG, PNG, WebP</span>
                </label>

                <input
                  ref={thumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingThumbnail}
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#DCEEFF]/60 hover:bg-[#DCEEFF] text-[#242424] text-xs font-mono rounded-md flex items-center space-x-2 transition-colors disabled:opacity-50 border border-[#242424]/10 font-medium"
                  >
                    {isUploadingThumbnail ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading Poster...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Thumbnail Image</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Or paste thumbnail image URL..."
                    className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
                  />
                </div>
              </div>

              {/* Alt text */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70">
                  Accessibility Alt Text
                </label>
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Short visual description of the motion work"
                  className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
                />
              </div>

              {/* Live Preview Player */}
              {videoUrl && (
                <div className="border-t border-[#242424]/10 pt-5 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                    Live Video Player Preview
                  </span>
                  <div className="aspect-video bg-black rounded-md overflow-hidden border border-[#242424]/15 flex items-center justify-center shadow-inner">
                    <video
                      src={videoUrl}
                      poster={thumbnailUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Status Radio */}
              <div className="border-t border-[#242424]/10 pt-4 flex items-center space-x-6 text-xs font-mono">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="video_publish_status"
                    checked={isPublished}
                    onChange={() => setIsPublished(true)}
                    className="accent-[#242424]"
                  />
                  <span className="text-[#242424]">Publish Immediately</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="video_publish_status"
                    checked={!isPublished}
                    onChange={() => setIsPublished(false)}
                    className="accent-[#242424]"
                  />
                  <span className="text-[#242424]/60">Save as Draft</span>
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
                  onClick={() => handleSaveVideo(false)}
                  className="px-4 py-2 border border-[#242424]/15 hover:border-[#242424] text-[#242424] text-xs font-mono rounded-md transition-colors bg-white"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveVideo(true)}
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
                      <span>Publish Video</span>
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

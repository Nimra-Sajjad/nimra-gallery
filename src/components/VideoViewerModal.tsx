import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoItem } from '../types';

interface VideoViewerModalProps {
  video: VideoItem | null;
  onClose: () => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  hasNextVideo?: boolean;
  hasPrevVideo?: boolean;
}

export const VideoViewerModal: React.FC<VideoViewerModalProps> = ({
  video,
  onClose,
  onNextVideo,
  onPrevVideo,
  hasNextVideo,
  hasPrevVideo,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Auto play on video change & stop on unmount
  useEffect(() => {
    if (video && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .catch(() => {
          // Auto-play was prevented by browser policy, user can tap play
        });
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, [video?.id]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!video) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNextVideo && onNextVideo) {
        onNextVideo();
      } else if (e.key === 'ArrowLeft' && hasPrevVideo && onPrevVideo) {
        onPrevVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [video, onClose, hasNextVideo, onNextVideo, hasPrevVideo, onPrevVideo]);

  // Touch Swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance && hasNextVideo && onNextVideo) {
      onNextVideo();
    } else if (distance < -minSwipeDistance && hasPrevVideo && onPrevVideo) {
      onPrevVideo();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!video) return null;

  return (
    <div
      id="video-viewer-overlay"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: '#DCEEFF' }}
      className="fixed inset-0 z-50 flex flex-col justify-between select-none animate-in fade-in duration-300 backdrop-blur-sm"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Header with Close Button */}
      <div className="w-full px-6 py-6 flex items-center justify-end z-20">
        <button
          id="close-video-viewer-btn"
          type="button"
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.pause();
            }
            onClose();
          }}
          aria-label="Close video"
          className="p-2.5 rounded-full text-[#242424] hover:bg-black/5 transition-all focus:outline-none border border-[#242424]/10 bg-white/50 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Video Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden">
        {/* Previous Video (Desktop) */}
        {hasPrevVideo && onPrevVideo && (
          <button
            id="prev-video-btn"
            type="button"
            onClick={onPrevVideo}
            aria-label="Previous video"
            className="hidden sm:flex absolute left-6 z-20 p-3 rounded-full text-[#242424] bg-white/70 hover:bg-white border border-[#242424]/10 shadow-sm transition-all focus:outline-none"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* Video Player */}
        <div className="relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center">
          <video
            ref={videoRef}
            key={video.videoUrl}
            src={video.videoUrl}
            poster={video.thumbnailUrl}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[80vh] object-contain rounded shadow-[0_20px_60px_rgba(0,0,0,0.15)] bg-black/90 focus:outline-none border border-[#242424]/10"
          />
        </div>

        {/* Next Video (Desktop) */}
        {hasNextVideo && onNextVideo && (
          <button
            id="next-video-btn"
            type="button"
            onClick={onNextVideo}
            aria-label="Next video"
            className="hidden sm:flex absolute right-6 z-20 p-3 rounded-full text-[#242424] bg-white/70 hover:bg-white border border-[#242424]/10 shadow-sm transition-all focus:outline-none"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Subtle bottom spacing */}
      <div className="w-full h-8" />
    </div>
  );
};

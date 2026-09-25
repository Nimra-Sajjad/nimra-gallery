import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DesignItem } from '../types';
import { getPastelForDesign, extractPastelFromImage } from '../utils/pastelColors';

interface DesignViewerModalProps {
  design: DesignItem | null;
  onClose: () => void;
  onNextPost?: () => void;
  onPrevPost?: () => void;
  hasNextPost?: boolean;
  hasPrevPost?: boolean;
}

export const DesignViewerModal: React.FC<DesignViewerModalProps> = ({
  design,
  onClose,
  onNextPost,
  onPrevPost,
  hasNextPost,
  hasPrevPost,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dominantPastel, setDominantPastel] = useState<string>('#FFF8EE');
  const imageRef = useRef<HTMLImageElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Reset image index when design changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [design?.id]);

  const images = design?.images || [];
  const totalImages = images.length;
  const currentImage = images[currentImageIndex];

  // Derive soft pastel backdrop for this artwork
  useEffect(() => {
    if (!design) return;
    const fallback = getPastelForDesign(design.id, currentImageIndex);
    setDominantPastel(fallback);

    // Extract genuine dominant pastel if image loaded
    if (imageRef.current) {
      extractPastelFromImage(imageRef.current, fallback).then((color) => {
        setDominantPastel(color);
      });
    }
  }, [design, currentImageIndex, currentImage?.url]);

  const handleImageLoad = () => {
    if (!design) return;
    const fallback = getPastelForDesign(design.id, currentImageIndex);
    extractPastelFromImage(imageRef.current, fallback).then((color) => {
      setDominantPastel(color);
    });
  };

  const handleNextImage = useCallback(() => {
    if (totalImages <= 1) {
      if (hasNextPost && onNextPost) onNextPost();
      return;
    }
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages, hasNextPost, onNextPost]);

  const handlePrevImage = useCallback(() => {
    if (totalImages <= 1) {
      if (hasPrevPost && onPrevPost) onPrevPost();
      return;
    }
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages, hasPrevPost, onPrevPost]);

  // Keyboard navigation
  useEffect(() => {
    if (!design) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [design, onClose, handleNextImage, handlePrevImage]);

  // Touch Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      handleNextImage();
    } else if (distance < -minSwipeDistance) {
      handlePrevImage();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!design || !currentImage) return null;

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`);

  return (
    <div
      id="design-viewer-overlay"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: dominantPastel }}
      className="fixed inset-0 z-50 flex flex-col justify-between select-none animate-in fade-in duration-300 transition-colors duration-700 ease-out backdrop-blur-sm"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar: Minimal Counter & Close */}
      <div className="w-full px-6 py-6 flex items-center justify-between text-[#242424] z-10">
        <div className="text-xs font-mono tracking-widest text-[#242424]/80 font-medium">
          {totalImages > 1 ? (
            <span>
              {formatNumber(currentImageIndex + 1)} / {formatNumber(totalImages)}
            </span>
          ) : (
            <span className="opacity-0">01 / 01</span>
          )}
        </div>

        <button
          id="close-design-viewer-btn"
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="p-2.5 rounded-full text-[#242424] hover:bg-black/5 transition-all focus:outline-none border border-[#242424]/10 bg-white/40"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden">
        {/* Previous Arrow (Desktop) */}
        {(totalImages > 1 || hasPrevPost) && (
          <button
            id="prev-image-btn"
            type="button"
            onClick={handlePrevImage}
            aria-label="Previous image"
            className="hidden sm:flex absolute left-6 z-20 p-3 rounded-full text-[#242424] bg-white/70 hover:bg-white border border-[#242424]/10 shadow-sm transition-all focus:outline-none"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        {/* The Image Itself - Pure, Centered, High-Resolution, Framed on Soft Pastel */}
        <div className="relative max-w-full max-h-[82vh] flex items-center justify-center">
          <img
            ref={imageRef}
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.alt || 'Design image'}
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
            className="max-h-[82vh] max-w-[92vw] object-contain select-none transition-all duration-300 shadow-[0_16px_50px_rgba(0,0,0,0.12)] rounded-sm border border-[#242424]/10 bg-white/20"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Next Arrow (Desktop) */}
        {(totalImages > 1 || hasNextPost) && (
          <button
            id="next-image-btn"
            type="button"
            onClick={handleNextImage}
            aria-label="Next image"
            className="hidden sm:flex absolute right-6 z-20 p-3 rounded-full text-[#242424] bg-white/70 hover:bg-white border border-[#242424]/10 shadow-sm transition-all focus:outline-none"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Bottom Minimal Dots / Navigation indicator */}
      <div className="w-full px-6 py-5 flex items-center justify-center space-x-2 z-10">
        {totalImages > 1 &&
          images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentImageIndex(idx)}
              aria-label={`Go to image ${idx + 1}`}
              className={`h-1.5 transition-all duration-300 rounded-full focus:outline-none ${
                idx === currentImageIndex ? 'w-8 bg-[#242424]' : 'w-2 bg-[#242424]/30 hover:bg-[#242424]/60'
              }`}
            />
          ))}
      </div>
    </div>
  );
};


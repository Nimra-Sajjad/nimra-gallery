import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import type { DesignItem } from '../types';
import { DesignViewerModal } from '../components/DesignViewerModal';

interface DesignsPageProps {
  designs: DesignItem[];
}

export const DesignsPage: React.FC<DesignsPageProps> = ({ designs }) => {
  const [selectedDesignIndex, setSelectedDesignIndex] = useState<number | null>(null);

  const selectedDesign = selectedDesignIndex !== null ? designs[selectedDesignIndex] : null;

  const handleOpenViewer = (index: number) => {
    setSelectedDesignIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedDesignIndex(null);
  };

  const handleNextPost = () => {
    if (selectedDesignIndex === null) return;
    setSelectedDesignIndex((prev) => (prev !== null ? (prev + 1) % designs.length : 0));
  };

  const handlePrevPost = () => {
    if (selectedDesignIndex === null) return;
    setSelectedDesignIndex((prev) => (prev !== null ? (prev - 1 + designs.length) % designs.length : 0));
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 animate-in fade-in duration-500">
      {designs.length === 0 ? (
        <div className="min-h-[50vh] flex items-center justify-center text-[#242424]/50 font-mono text-sm tracking-wider">
          NO WORKS PUBLISHED YET
        </div>
      ) : (
        /* Pinterest-inspired fluid masonry layout */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {designs.map((design, index) => {
            const coverImage = design.images[0];
            const isCarousel = design.images.length > 1;

            if (!coverImage) return null;

            return (
              <div
                key={design.id}
                className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded bg-white/70 border border-[#242424]/8 shadow-sm transition-all duration-300 hover:scale-[1.015] hover:shadow-md hover:border-[#242424]/20"
                onClick={() => handleOpenViewer(index)}
              >
                {/* Pure Design Presentation - No extraneous metadata or text */}
                <img
                  src={coverImage.url}
                  alt={coverImage.alt || 'Visual design artefact'}
                  className="w-full h-auto object-cover select-none transition-opacity duration-300 group-hover:opacity-95"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Multi-image subtle badge in soft pastel styling */}
                {isCarousel && (
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#242424] border border-[#242424]/10 text-[10px] font-mono tracking-widest flex items-center space-x-1.5 shadow-sm pointer-events-none">
                    <Layers className="w-3 h-3 text-[#242424]/70" />
                    <span className="font-semibold">{design.images.length}</span>
                  </div>
                )}

                {/* Subtle vignette hover overlay */}
                <div className="absolute inset-0 bg-black/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Viewer with dynamic dominant pastel backdrop */}
      <DesignViewerModal
        design={selectedDesign}
        onClose={handleCloseViewer}
        onNextPost={handleNextPost}
        onPrevPost={handlePrevPost}
        hasNextPost={designs.length > 1}
        hasPrevPost={designs.length > 1}
      />
    </main>
  );
};


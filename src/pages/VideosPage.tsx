import React, { useState } from 'react';
import { Play } from 'lucide-react';
import type { VideoItem } from '../types';
import { VideoViewerModal } from '../components/VideoViewerModal';

interface VideosPageProps {
  videos: VideoItem[];
}

export const VideosPage: React.FC<VideosPageProps> = ({ videos }) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  const selectedVideo = selectedVideoIndex !== null ? videos[selectedVideoIndex] : null;

  const handleOpenVideo = (index: number) => {
    setSelectedVideoIndex(index);
  };

  const handleCloseVideo = () => {
    setSelectedVideoIndex(null);
  };

  const handleNextVideo = () => {
    if (selectedVideoIndex === null) return;
    setSelectedVideoIndex((prev) => (prev !== null ? (prev + 1) % videos.length : 0));
  };

  const handlePrevVideo = () => {
    if (selectedVideoIndex === null) return;
    setSelectedVideoIndex((prev) => (prev !== null ? (prev - 1 + videos.length) % videos.length : 0));
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 animate-in fade-in duration-500">
      {videos.length === 0 ? (
        <div className="min-h-[50vh] flex items-center justify-center text-[#242424]/50 font-mono text-sm tracking-wider">
          NO MOTION WORKS PUBLISHED YET
        </div>
      ) : (
        /* Pinterest-inspired fluid masonry layout matching Designs */
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded bg-white/70 border border-[#242424]/8 shadow-sm transition-all duration-300 hover:scale-[1.015] hover:shadow-md hover:border-[#242424]/20"
              onClick={() => handleOpenVideo(index)}
            >
              {/* Video Thumbnail */}
              <div className="relative w-full overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.alt || 'Video thumbnail'}
                    className="w-full h-auto object-cover select-none transition-opacity duration-300 group-hover:opacity-95"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full aspect-video bg-[#E7DDF7]/50 flex items-center justify-center">
                    <span className="text-xs font-mono text-[#242424]/60">VIDEO</span>
                  </div>
                )}

                {/* Minimalist Centered Play Icon in Soft Pastel Glass */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-md border border-black/10 shadow-sm flex items-center justify-center text-[#242424] opacity-90 group-hover:opacity-100 group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                    <Play className="w-5 h-5 fill-[#242424] translate-x-0.5" />
                  </div>
                </div>

                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-black/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Video Modal with soft pastel background */}
      <VideoViewerModal
        video={selectedVideo}
        onClose={handleCloseVideo}
        onNextVideo={handleNextVideo}
        onPrevVideo={handlePrevVideo}
        hasNextVideo={videos.length > 1}
        hasPrevVideo={videos.length > 1}
      />
    </main>
  );
};


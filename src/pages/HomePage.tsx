import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { PortfolioInfo, DesignItem, VideoItem } from '../types';

interface HomePageProps {
  info: PortfolioInfo;
  designs: DesignItem[];
  videos: VideoItem[];
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ info, designs, videos, onNavigate }) => {
  const topDesignPreview = designs[0]?.images[0]?.url;
  const topVideoPreview = videos[0]?.thumbnailUrl;

  // Interactive pastel ambiance subtle transition based on pointer
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const pastelSkillsBg = [
    'bg-[#E7DDF7]/80 text-[#242424] border-[#242424]/10',
    'bg-[#DCEEFF]/80 text-[#242424] border-[#242424]/10',
    'bg-[#DDF3E8]/80 text-[#242424] border-[#242424]/10',
    'bg-[#FFE1D2]/80 text-[#242424] border-[#242424]/10',
    'bg-[#F8DDE6]/80 text-[#242424] border-[#242424]/10',
    'bg-[#FFF1C9]/80 text-[#242424] border-[#242424]/10',
  ];

  return (
    <div className="relative w-full overflow-hidden transition-colors duration-700">
      {/* Ambient subtle pastel gradient aura that transitions as user interacts */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, #E7DDF7 0%, #DCEEFF 35%, #FFE1D2 70%, transparent 100%)`,
        }}
      />

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-20 lg:py-24 animate-in fade-in duration-500">
        {/* Editorial Title & Identity Header */}
        <section className="border-b border-[#242424]/10 pb-16 md:pb-24">
          <div className="space-y-6 max-w-5xl">
            <p className="text-xs font-mono tracking-[0.28em] text-[#242424]/60 uppercase">
              {info.title || 'Creative Designer / Developer'}
            </p>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#242424] leading-[0.95]">
              {info.name || 'Nimra Sajjad'}
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-[#242424]/80 font-normal leading-relaxed max-w-3xl pt-2">
              {info.intro}
            </p>
          </div>
        </section>

        {/* Narrative & Selected Skills Section */}
        <section className="py-16 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-[#242424]/10">
          <div className="md:col-span-4">
            <span className="text-xs font-mono tracking-[0.25em] text-[#242424]/60 uppercase">
              Discipline & Approach
            </span>
          </div>

          <div className="md:col-span-8 space-y-12">
            <p className="text-base sm:text-lg text-[#242424]/85 leading-relaxed font-light">
              {info.aboutText}
            </p>

            {/* Skills Grid / Tags in Bright Soft Pastels */}
            <div className="space-y-4">
              <span className="text-xs font-mono tracking-[0.2em] text-[#242424]/60 uppercase block">
                Core Capabilities
              </span>
              <div className="flex flex-wrap gap-2.5">
                {info.skills.map((skill, index) => {
                  const styleClass = pastelSkillsBg[index % pastelSkillsBg.length];
                  return (
                    <span
                      key={index}
                      className={`px-4 py-2 text-xs font-medium tracking-wider border rounded-full transition-transform hover:scale-105 duration-200 ${styleClass}`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Direct Visual Pathways to Public Pages */}
        <section className="py-16 md:py-24">
          <div className="mb-10">
            <span className="text-xs font-mono tracking-[0.25em] text-[#242424]/60 uppercase">
              Explore Portfolio
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pathway: Designs */}
            <button
              type="button"
              onClick={() => onNavigate('designs')}
              className="group text-left border border-[#242424]/10 hover:border-[#242424]/30 rounded-md p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between h-[360px] bg-[#E7DDF7]/30 hover:bg-[#E7DDF7]/60 hover:shadow-sm focus:outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono tracking-widest text-[#242424]/60">
                    01 / GALLERY
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-[#242424]/40 group-hover:text-[#242424] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#242424]">
                  Designs
                </h2>
                <p className="text-xs text-[#242424]/60 font-mono">
                  {designs.length} Curated Works
                </p>
              </div>

              {topDesignPreview ? (
                <div className="w-full h-40 overflow-hidden rounded bg-white/60 border border-[#242424]/5">
                  <img
                    src={topDesignPreview}
                    alt="Design Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-white/50 rounded flex items-center justify-center text-xs font-mono text-[#242424]/60">
                  View Works
                </div>
              )}
            </button>

            {/* Pathway: Videos */}
            <button
              type="button"
              onClick={() => onNavigate('videos')}
              className="group text-left border border-[#242424]/10 hover:border-[#242424]/30 rounded-md p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between h-[360px] bg-[#DCEEFF]/30 hover:bg-[#DCEEFF]/60 hover:shadow-sm focus:outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono tracking-widest text-[#242424]/60">
                    02 / MOTION
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-[#242424]/40 group-hover:text-[#242424] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#242424]">
                  Videos
                </h2>
                <p className="text-xs text-[#242424]/60 font-mono">
                  {videos.length} Motion Studies
                </p>
              </div>

              {topVideoPreview ? (
                <div className="w-full h-40 overflow-hidden rounded bg-white/60 border border-[#242424]/5">
                  <img
                    src={topVideoPreview}
                    alt="Video Preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-white/50 rounded flex items-center justify-center text-xs font-mono text-[#242424]/60">
                  Watch Motion
                </div>
              )}
            </button>

            {/* Pathway: Contact */}
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="group text-left border border-[#242424]/10 hover:border-[#242424]/30 rounded-md p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between h-[360px] bg-[#FFE1D2]/30 hover:bg-[#FFE1D2]/60 hover:shadow-sm focus:outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono tracking-widest text-[#242424]/60">
                    03 / INQUIRY
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-[#242424]/40 group-hover:text-[#242424] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#242424]">
                  Contact
                </h2>
                <p className="text-xs text-[#242424]/60 font-mono">
                  Initiate Dialogue
                </p>
              </div>

              <div className="w-full h-40 border border-dashed border-[#242424]/20 rounded-sm p-4 flex flex-col justify-end space-y-1 bg-white/40 text-[#242424]">
                <span className="text-xs font-mono text-[#242424]/60">DIRECT DISPATCH</span>
                <span className="text-xs font-medium truncate">{info.contactEmail}</span>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};


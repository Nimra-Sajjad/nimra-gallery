import React, { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavigationProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, onRouteChange }) => {
  const { pastelTone, cyclePastelTone } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'HOME' },
    { id: 'designs', label: 'DESIGNS' },
    { id: 'videos', label: 'VIDEOS' },
    { id: 'contact', label: 'CONTACT' },
  ];

  const handleNavigate = (id: string) => {
    onRouteChange(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toneNames = {
    cream: 'Cream',
    lavender: 'Lavender',
    powderBlue: 'Powder Blue',
    peach: 'Soft Peach',
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/40 border-b border-[#242424]/8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-brand-btn"
          type="button"
          onClick={() => handleNavigate('home')}
          className="group text-left focus:outline-none"
        >
          <span className="font-display font-bold tracking-widest text-lg sm:text-xl text-[#242424] transition-colors">
            NIMRA GALLERY
          </span>
        </button>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center space-x-10">
          <nav className="flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.id;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  type="button"
                  onClick={() => handleNavigate(link.id)}
                  className={`text-xs font-semibold tracking-[0.2em] transition-all duration-200 uppercase py-1 relative focus:outline-none ${
                    isActive
                      ? 'text-[#242424] font-bold'
                      : 'text-[#242424]/60 hover:text-[#242424]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#242424]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Minimal Subtle Pastel Ambient Shifter */}
          <div className="pl-5 border-l border-[#242424]/10 flex items-center">
            <button
              id="pastel-tone-btn"
              type="button"
              onClick={cyclePastelTone}
              title={`Current Pastel Tone: ${toneNames[pastelTone]}. Click to shift mood.`}
              aria-label="Shift pastel tone"
              className="group flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#242424]/10 bg-white/50 hover:bg-white/90 text-[#242424] text-[11px] font-mono tracking-wider transition-all focus:outline-none"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10 transition-colors duration-300"
                style={{
                  backgroundColor:
                    pastelTone === 'cream'
                      ? '#FFF8EE'
                      : pastelTone === 'lavender'
                      ? '#E7DDF7'
                      : pastelTone === 'powderBlue'
                      ? '#DCEEFF'
                      : '#FFE1D2',
                }}
              />
              <span className="text-[#242424]/75 group-hover:text-[#242424]">
                {toneNames[pastelTone]}
              </span>
              <Sparkles className="w-3 h-3 text-[#242424]/40 group-hover:text-[#242424]" />
            </button>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center space-x-3 md:hidden">
          <button
            id="mobile-pastel-tone-btn"
            type="button"
            onClick={cyclePastelTone}
            aria-label="Shift pastel tone"
            className="p-2 text-[#242424]/70 hover:text-[#242424] focus:outline-none"
          >
            <span
              className="block w-4 h-4 rounded-full border border-black/15"
              style={{
                backgroundColor:
                  pastelTone === 'cream'
                    ? '#FFF8EE'
                    : pastelTone === 'lavender'
                    ? '#E7DDF7'
                    : pastelTone === 'powderBlue'
                    ? '#DCEEFF'
                    : '#FFE1D2',
              }}
            />
          </button>

          <button
            id="mobile-menu-toggle-btn"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 text-[#242424] focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#242424]/10 bg-white/95 backdrop-blur-xl px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.id;
              return (
                <button
                  key={link.id}
                  id={`mobile-nav-${link.id}`}
                  type="button"
                  onClick={() => handleNavigate(link.id)}
                  className={`text-left text-sm font-semibold tracking-[0.2em] py-2 uppercase transition-colors ${
                    isActive
                      ? 'text-[#242424] font-bold pl-2 border-l-2 border-[#242424]'
                      : 'text-[#242424]/60 hover:text-[#242424]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};


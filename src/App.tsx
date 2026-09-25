import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { DesignsPage } from './pages/DesignsPage';
import { VideosPage } from './pages/VideosPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import type { PortfolioInfo, DesignItem, VideoItem } from './types';

// Fallback initial data in case network is pending
const fallbackInfo: PortfolioInfo = {
  name: 'Nimra Sajjad',
  title: 'Creative Designer / Developer',
  intro: 'Visual designer and creative developer exploring the interplay of minimalist architecture, experimental typography, and tactile digital systems.',
  aboutText: 'Focused on creating high-contrast visual identities, clean editorial layouts, and kinetic web atmospheres. Combining methodical design discipline with contemporary web technologies to build memorable digital artefacts.',
  skills: [
    'Visual Identity & Systems',
    'Creative Web Development',
    'Editorial Design',
    'Motion & Kinetic Typography',
    'Art Direction',
    'Spatial UI / UX',
  ],
  contactEmail: 'nimrasajjad000@gmail.com',
  contactPhone: '+1 (555) 234-8901',
  socialLinks: [
    { id: '1', platform: 'Instagram', label: 'Instagram', url: 'https://instagram.com' },
    { id: '2', platform: 'Behance', label: 'Behance', url: 'https://behance.net' },
    { id: '3', platform: 'Dribbble', label: 'Dribbble', url: 'https://dribbble.com' },
    { id: '4', platform: 'GitHub', label: 'GitHub', url: 'https://github.com' },
  ],
};

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (path === 'admin' || hash === 'admin') return 'admin';
    if (path === 'designs' || hash === 'designs') return 'designs';
    if (path === 'videos' || hash === 'videos') return 'videos';
    if (path === 'contact' || hash === 'contact') return 'contact';
    return 'home';
  });

  const [info, setInfo] = useState<PortfolioInfo>(fallbackInfo);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load public portfolio data
  const fetchPublicPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        if (data.info) setInfo(data.info);
        if (data.designs) setDesigns(data.designs);
        if (data.videos) setVideos(data.videos);
      }
    } catch (err) {
      console.warn('Using local fallback portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicPortfolio();
  }, [fetchPublicPortfolio]);

  // Sync route with URL history & hash
  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    const newPath = route === 'home' ? '/' : `/${route}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ route }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (path === 'admin' || hash === 'admin') {
        setCurrentRoute('admin');
      } else if (path === 'designs' || hash === 'designs') {
        setCurrentRoute('designs');
      } else if (path === 'videos' || hash === 'videos') {
        setCurrentRoute('videos');
      } else if (path === 'contact' || hash === 'contact') {
        setCurrentRoute('contact');
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Admin page is completely separate
  if (currentRoute === 'admin') {
    return (
      <AdminPage
        onReturnToPublic={() => {
          fetchPublicPortfolio();
          navigateTo('home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#E7DDF7] selection:text-[#242424]">
      {/* Public Navigation - ONLY Home, Designs, Videos, Contact, Mode Toggle. NO ADMIN LINK! */}
      <Navigation currentRoute={currentRoute} onRouteChange={navigateTo} />

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {isLoading ? (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#242424]/30 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {currentRoute === 'home' && (
              <HomePage
                info={info}
                designs={designs}
                videos={videos}
                onNavigate={navigateTo}
              />
            )}

            {currentRoute === 'designs' && <DesignsPage designs={designs} />}

            {currentRoute === 'videos' && <VideosPage videos={videos} />}

            {currentRoute === 'contact' && <ContactPage info={info} />}
          </>
        )}
      </div>

      {/* Strict Requirement: There should be NO FOOTER ANYWHERE! */}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

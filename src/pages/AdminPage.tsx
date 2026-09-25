import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Video,
  User,
  LogOut,
  ExternalLink,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminDesigns } from '../components/admin/AdminDesigns';
import { AdminVideos } from '../components/admin/AdminVideos';
import { AdminMyInfo } from '../components/admin/AdminMyInfo';
import { AdminInquiries } from '../components/admin/AdminInquiries';
import type { PortfolioInfo, DesignItem, VideoItem, ContactMessage } from '../types';

type AdminTab = 'designs' | 'videos' | 'myinfo' | 'inquiries';

interface AdminPageProps {
  onReturnToPublic: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onReturnToPublic }) => {
  const { isAuthenticated, isLoading: authLoading, logout, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('designs');

  // Loaded Admin Data
  const [info, setInfo] = useState<PortfolioInfo | null>(null);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await fetch('/api/admin/data', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInfo(data.info);
        setDesigns(data.designs || []);
        setVideos(data.videos || []);
        setMessages(data.messages || []);
      } else if (res.status === 401) {
        logout();
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [getAuthHeaders, logout]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated, fetchAdminData]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8EE] text-[#242424] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#242424]/60" />
      </div>
    );
  }

  // If not authenticated, show Admin Login view
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={fetchAdminData} onExitToPublic={onReturnToPublic} />;
  }

  return (
    <div className="min-h-screen bg-[#FFF8EE] text-[#242424] antialiased font-sans select-none">
      {/* Top Admin Header Bar */}
      <header className="border-b border-[#242424]/10 bg-white/80 backdrop-blur-md px-6 lg:px-12 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-display font-bold tracking-widest text-lg text-[#242424]">
            NIMRA GALLERY
          </span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#E7DDF7] text-[10px] font-mono tracking-widest uppercase text-[#242424] border border-[#242424]/10 font-medium">
            Dashboard
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Quick link to public view */}
          <button
            type="button"
            onClick={onReturnToPublic}
            className="text-xs font-mono text-[#242424]/70 hover:text-[#242424] flex items-center space-x-1.5 transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={fetchAdminData}
            title="Refresh Data"
            className="p-1.5 text-[#242424]/60 hover:text-[#242424]"
          >
            <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Logout Button */}
          <button
            id="admin-logout-btn"
            type="button"
            onClick={logout}
            className="px-3 py-1.5 border border-[#242424]/15 hover:border-[#242424] rounded-md text-xs font-mono text-[#242424] bg-white/50 flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
        {/* Navigation Tabs in simplified pastel controls */}
        <nav className="flex items-center space-x-2 sm:space-x-3 border-b border-[#242424]/10 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('designs')}
            className={`px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-md flex items-center space-x-2 transition-all shrink-0 ${
              activeTab === 'designs'
                ? 'bg-[#242424] text-white font-semibold shadow-sm'
                : 'text-[#242424]/70 hover:text-[#242424] hover:bg-black/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Designs ({designs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-md flex items-center space-x-2 transition-all shrink-0 ${
              activeTab === 'videos'
                ? 'bg-[#242424] text-white font-semibold shadow-sm'
                : 'text-[#242424]/70 hover:text-[#242424] hover:bg-black/5'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos ({videos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('myinfo')}
            className={`px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-md flex items-center space-x-2 transition-all shrink-0 ${
              activeTab === 'myinfo'
                ? 'bg-[#242424] text-white font-semibold shadow-sm'
                : 'text-[#242424]/70 hover:text-[#242424] hover:bg-black/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-md flex items-center space-x-2 transition-all shrink-0 ${
              activeTab === 'inquiries'
                ? 'bg-[#242424] text-white font-semibold shadow-sm'
                : 'text-[#242424]/70 hover:text-[#242424] hover:bg-black/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Inquiries ({messages.length})</span>
          </button>
        </nav>

        {/* Tab Content Display */}
        {isDataLoading && !info ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#242424]/60" />
          </div>
        ) : (
          <div>
            {activeTab === 'designs' && (
              <AdminDesigns designs={designs} onRefresh={fetchAdminData} />
            )}

            {activeTab === 'videos' && (
              <AdminVideos videos={videos} onRefresh={fetchAdminData} />
            )}

            {activeTab === 'myinfo' && info && (
              <AdminMyInfo info={info} onRefresh={fetchAdminData} />
            )}

            {activeTab === 'inquiries' && (
              <AdminInquiries messages={messages} onRefresh={fetchAdminData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

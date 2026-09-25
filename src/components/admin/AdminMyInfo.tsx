import React, { useState } from 'react';
import { Plus, Trash2, Check, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import type { PortfolioInfo, SocialLink } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminMyInfoProps {
  info: PortfolioInfo;
  onRefresh: () => void;
}

export const AdminMyInfo: React.FC<AdminMyInfoProps> = ({ info, onRefresh }) => {
  const { getAuthHeaders, user } = useAuth();

  // Form State for Public Portfolio Info
  const [formData, setFormData] = useState<PortfolioInfo>({
    name: info.name || '',
    title: info.title || '',
    intro: info.intro || '',
    aboutText: info.aboutText || '',
    skills: [...(info.skills || [])],
    contactEmail: info.contactEmail || '',
    contactPhone: info.contactPhone || '',
    socialLinks: info.socialLinks ? info.socialLinks.map((s) => ({ ...s })) : [],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Password / Credentials change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email || '');

  // Feedback states
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoStatus, setInfoStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credsStatus, setCredsStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Skill management
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (formData.skills.includes(newSkill.trim())) return;
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()],
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Social link management
  const handleAddSocial = () => {
    if (!newSocialPlatform.trim() || !newSocialUrl.trim()) return;
    const newLink: SocialLink = {
      id: `soc_${Date.now()}`,
      platform: newSocialPlatform.trim(),
      label: newSocialPlatform.trim(),
      url: newSocialUrl.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, newLink],
    }));
    setNewSocialPlatform('');
    setNewSocialUrl('');
  };

  const handleRemoveSocial = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((s) => s.id !== id),
    }));
  };

  // Save Public Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setInfoStatus(null);

    try {
      const res = await fetch('/api/admin/info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update portfolio info');

      setInfoStatus({
        type: 'success',
        text: 'Information updated successfully! Changes are immediately live on the public website.',
      });
      onRefresh();
    } catch (err: any) {
      setInfoStatus({ type: 'error', text: err.message || 'Error saving information' });
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Update Admin Credentials
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setCredsStatus({ type: 'error', text: 'Current password is required to verify changes.' });
      return;
    }

    setIsSavingCreds(true);
    setCredsStatus(null);

    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          currentPassword,
          newEmail: newEmail !== user?.email ? newEmail : undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credentials');

      setCredsStatus({
        type: 'success',
        text: 'Admin credentials updated securely.',
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setCredsStatus({ type: 'error', text: err.message || 'Failed to update credentials' });
    } finally {
      setIsSavingCreds(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#242424]/10 pb-6">
        <h2 className="font-display text-2xl font-bold text-[#242424]">My Info Management</h2>
        <p className="text-xs font-mono text-[#242424]/60">
          Edit content displayed on the public Home/About and Contact pages
        </p>
      </div>

      {infoStatus && (
        <div
          className={`p-4 rounded-lg text-xs font-mono flex items-center space-x-2 border shadow-sm ${
            infoStatus.type === 'error'
              ? 'bg-[#F8DDE6]/80 border-rose-300 text-rose-900'
              : 'bg-[#DDF3E8]/80 border-emerald-300 text-emerald-900'
          }`}
        >
          {infoStatus.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
          ) : (
            <Check className="w-4 h-4 shrink-0 text-emerald-700" />
          )}
          <span>{infoStatus.text}</span>
        </div>
      )}

      {/* Main Info Form */}
      <form onSubmit={handleSaveInfo} className="space-y-10">
        {/* Section 1: Home & About */}
        <div className="space-y-6 bg-white border border-[#242424]/10 p-6 sm:p-8 rounded-lg shadow-sm">
          <h3 className="font-display text-lg font-bold text-[#242424] border-b border-[#242424]/10 pb-3">
            1. Home / About Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                Professional Title / Identity
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
              Short Introduction (Headline Paragraph)
            </label>
            <textarea
              rows={3}
              required
              value={formData.intro}
              onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
              Discipline &amp; Approach (Small About Text)
            </label>
            <textarea
              rows={4}
              required
              value={formData.aboutText}
              onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono resize-none leading-relaxed"
            />
          </div>

          {/* Skills Management */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
              Core Skills &amp; Capabilities
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#E7DDF7]/50 border border-[#242424]/10 rounded-full text-xs text-[#242424] flex items-center space-x-1.5 font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#242424]/50 hover:text-rose-600 transition-colors ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type skill (e.g. Creative Direction) and press Add"
                className="flex-1 px-4 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-[#242424] hover:bg-[#383838] text-xs font-mono text-white rounded-md transition-colors"
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Info & Socials */}
        <div className="space-y-6 bg-white border border-[#242424]/10 p-6 sm:p-8 rounded-lg shadow-sm">
          <h3 className="font-display text-lg font-bold text-[#242424] border-b border-[#242424]/10 pb-3">
            2. Contact Coordinates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                Public Contact Email
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-[#242424]/15 rounded-md text-sm text-[#242424] focus:outline-none focus:border-[#242424] font-mono"
              />
            </div>
          </div>

          {/* Social Links Manager */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
              Social Media Coordinates
            </label>

            <div className="space-y-2">
              {formData.socialLinks.map((social) => (
                <div
                  key={social.id}
                  className="flex items-center justify-between p-3 bg-[#FFF8EE]/60 border border-[#242424]/10 rounded-md text-xs font-mono text-[#242424]"
                >
                  <span className="font-bold text-[#242424]">{social.platform}</span>
                  <span className="text-[#242424]/60 truncate max-w-xs">{social.url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(social.id)}
                    className="p-1 text-[#242424]/50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              <input
                type="text"
                value={newSocialPlatform}
                onChange={(e) => setNewSocialPlatform(e.target.value)}
                placeholder="Platform (e.g. Behance)"
                className="sm:col-span-2 px-3 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
              />
              <input
                type="url"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="URL (e.g. https://behance.net/nimra)"
                className="sm:col-span-2 px-3 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
              />
              <button
                type="button"
                onClick={handleAddSocial}
                className="px-3 py-2 bg-[#242424] hover:bg-[#383838] text-xs font-mono text-white rounded-md flex items-center justify-center space-x-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Public Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingInfo}
            className="px-8 py-3 bg-[#242424] hover:bg-[#383838] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-md flex items-center space-x-2 transition-all disabled:opacity-50 shadow-sm"
          >
            {isSavingInfo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Updates...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Public Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Section 3: Admin Security & Credentials */}
      <div className="space-y-6 bg-white border border-[#242424]/10 p-6 sm:p-8 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 border-b border-[#242424]/10 pb-3">
          <KeyRound className="w-4 h-4 text-[#242424]/70" />
          <h3 className="font-display text-lg font-bold text-[#242424]">
            Admin Account &amp; Security Credentials
          </h3>
        </div>

        {credsStatus && (
          <div
            className={`p-3 rounded-lg text-xs font-mono flex items-center space-x-2 border ${
              credsStatus.type === 'error'
                ? 'bg-[#F8DDE6]/80 border-rose-300 text-rose-900'
                : 'bg-[#DDF3E8]/80 border-emerald-300 text-emerald-900'
            }`}
          >
            {credsStatus.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-700" />
            )}
            <span>{credsStatus.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                Admin Login Email
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
                New Password (Optional)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className="w-full px-4 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
              />
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <label className="text-[11px] font-mono uppercase tracking-widest text-[#242424]/70 block">
              Current Password (Required for confirmation)
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-white border border-[#242424]/15 rounded-md text-xs font-mono text-[#242424] focus:outline-none focus:border-[#242424]"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingCreds}
            className="px-5 py-2.5 bg-[#242424] hover:bg-[#383838] text-white text-xs font-mono uppercase tracking-wider rounded-md transition-colors disabled:opacity-50 font-medium"
          >
            {isSavingCreds ? 'Updating...' : 'Update Admin Credentials'}
          </button>
        </form>
      </div>
    </div>
  );
};

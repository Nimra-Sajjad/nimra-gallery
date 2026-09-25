import React, { useState } from 'react';
import { Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onExitToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onExitToPublic }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nimragallery.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EE] text-[#242424] flex flex-col justify-center items-center px-6 select-none relative overflow-hidden">
      {/* Soft pastel ambient background aura */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#E7DDF7]/30 via-transparent to-[#DCEEFF]/30" />

      <div className="relative z-10 w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Heading */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#242424]/60 uppercase block">
            ADMINISTRATOR PORTAL
          </span>
          <h1 className="font-display text-3xl font-bold tracking-wider text-[#242424]">
            NIMRA GALLERY
          </h1>
          <p className="text-xs text-[#242424]/60 font-mono">
            Private Management Workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 border border-[#242424]/10 rounded-lg p-8 space-y-6 shadow-sm backdrop-blur-md">
          {error && (
            <div className="p-3.5 bg-[#F8DDE6]/70 border border-rose-300 rounded-md text-[#242424] text-xs font-mono flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-email"
                className="block text-[11px] font-mono uppercase tracking-widest text-[#242424]/70"
              >
                Admin Identifier
              </label>
              <input
                id="admin-email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nimragallery.com"
                className="w-full px-4 py-3 bg-white border border-[#242424]/15 rounded-md text-[#242424] placeholder:text-[#242424]/40 text-sm focus:outline-none focus:border-[#242424] font-mono transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-mono uppercase tracking-widest text-[#242424]/70"
              >
                Security Key / Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-[#242424]/15 rounded-md text-[#242424] placeholder:text-[#242424]/40 text-sm focus:outline-none focus:border-[#242424] font-mono transition-colors"
              />
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#242424] hover:bg-[#383838] text-white font-mono text-xs uppercase tracking-[0.2em] font-bold rounded-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Preset hint for test review convenience */}
          <div className="p-3 bg-[#E7DDF7]/30 border border-[#242424]/10 rounded-md text-[11px] font-mono text-[#242424]/80 space-y-1">
            <span className="text-[#242424] font-bold block">Demo Credentials:</span>
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-[#242424] select-all font-medium">admin@nimragallery.com</span>
            </div>
            <div className="flex justify-between">
              <span>Password:</span>
              <span className="text-[#242424] select-all font-bold">admin123</span>
            </div>
            <p className="text-[10px] text-[#242424]/50 pt-1">
              (Credentials can be updated anytime in My Info &gt; Admin Account)
            </p>
          </div>
        </div>

        {/* Exit back to public site */}
        <div className="text-center">
          <button
            type="button"
            onClick={onExitToPublic}
            className="text-xs font-mono text-[#242424]/60 hover:text-[#242424] tracking-wider transition-colors"
          >
            ← Return to Public Gallery
          </button>
        </div>
      </div>
    </div>
  );
};


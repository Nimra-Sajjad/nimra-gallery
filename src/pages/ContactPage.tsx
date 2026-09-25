import React, { useState } from 'react';
import { ArrowUpRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { PortfolioInfo } from '../types';

interface ContactPageProps {
  info: PortfolioInfo;
}

export const ContactPage: React.FC<ContactPageProps> = ({ info }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      setErrorMessage('Please complete all fields.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to dispatch message.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again or reach out directly.');
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Calm pastel ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#DCEEFF]/30 via-[#FFE1D2]/20 to-transparent" />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-24 animate-in fade-in duration-500">
        {/* Title */}
        <div className="border-b border-[#242424]/10 pb-12">
          <p className="text-xs font-mono tracking-[0.25em] text-[#242424]/60 uppercase mb-3">
            Inquiries & Collaborations
          </p>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#242424] uppercase">
            LET&apos;S TALK
          </h1>
        </div>

        <div className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          {/* Contact Info & Socials Column */}
          <div className="md:col-span-5 space-y-10">
            {/* Note */}
            <div className="space-y-2">
              <p className="text-base text-[#242424]/80 leading-relaxed font-light">
                Have an upcoming project, design collaboration, or creative direction inquiry? Send a note or connect directly below.
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] text-[#242424]/60 uppercase block">
                Direct Email
              </span>
              <a
                id="contact-email-link"
                href={`mailto:${info.contactEmail}`}
                className="text-lg sm:text-xl font-medium text-[#242424] hover:text-[#242424]/70 transition-colors inline-block break-all"
              >
                {info.contactEmail}
              </a>
            </div>

            {/* Phone */}
            {info.contactPhone && (
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-[0.2em] text-[#242424]/60 uppercase block">
                  Telephone
                </span>
                <a
                  id="contact-phone-link"
                  href={`tel:${info.contactPhone}`}
                  className="text-lg sm:text-xl font-medium text-[#242424] hover:text-[#242424]/70 transition-colors inline-block"
                >
                  {info.contactPhone}
                </a>
              </div>
            )}

            {/* Social Links */}
            {info.socialLinks && info.socialLinks.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono tracking-[0.2em] text-[#242424]/60 uppercase block">
                  Social Coordinates
                </span>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {info.socialLinks.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center space-x-1 text-sm font-medium text-[#242424]/80 hover:text-[#242424] transition-colors"
                    >
                      <span>{social.label || social.platform}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Minimal Contact Form */}
          <div className="md:col-span-7">
            {status === 'success' ? (
              <div className="p-8 border border-[#242424]/15 rounded-md bg-white/70 shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#DDF3E8] text-[#242424] flex items-center justify-center border border-[#242424]/10">
                  <Check className="w-5 h-5" />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#242424]">
                  Message Dispatched
                </h2>
                <p className="text-sm text-[#242424]/80">
                  Thank you for reaching out. Your inquiry has been transmitted directly to Nimra.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-5 py-2.5 text-xs font-mono uppercase tracking-widest border border-[#242424]/20 hover:border-[#242424] text-[#242424] rounded-md transition-colors bg-white/50"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-white/60 p-6 sm:p-8 rounded-lg border border-[#242424]/10 shadow-sm">
                {status === 'error' && (
                  <div className="p-4 border border-rose-200 bg-[#F6C9C5]/40 text-[#242424] text-xs font-mono flex items-center space-x-2 rounded-md">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name input */}
                <div className="space-y-2">
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-mono tracking-widest text-[#242424]/70 uppercase"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name or studio"
                    className="w-full px-4 py-3 text-sm bg-white/80 border border-[#242424]/15 rounded-md text-[#242424] placeholder:text-[#242424]/40 focus:outline-none focus:border-[#242424] focus:ring-1 focus:ring-[#242424]/10 transition-colors"
                  />
                </div>

                {/* Email input */}
                <div className="space-y-2">
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-mono tracking-widest text-[#242424]/70 uppercase"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@domain.com"
                    className="w-full px-4 py-3 text-sm bg-white/80 border border-[#242424]/15 rounded-md text-[#242424] placeholder:text-[#242424]/40 focus:outline-none focus:border-[#242424] focus:ring-1 focus:ring-[#242424]/10 transition-colors"
                  />
                </div>

                {/* Message input */}
                <div className="space-y-2">
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-mono tracking-widest text-[#242424]/70 uppercase"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your project, exhibition, or creative inquiry..."
                    className="w-full px-4 py-3 text-sm bg-white/80 border border-[#242424]/15 rounded-md text-[#242424] placeholder:text-[#242424]/40 focus:outline-none focus:border-[#242424] focus:ring-1 focus:ring-[#242424]/10 transition-colors resize-none"
                  />
                </div>

                {/* Send Button */}
                <button
                  id="contact-submit-btn"
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#242424] hover:bg-[#383838] text-white text-xs font-mono uppercase tracking-[0.2em] font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none disabled:opacity-50 shadow-sm"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <span>Send Inquiry</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};


import React, { useState } from 'react';
import { Trash2, Mail } from 'lucide-react';
import type { ContactMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminInquiriesProps {
  messages: ContactMessage[];
  onRefresh: () => void;
}

export const AdminInquiries: React.FC<AdminInquiriesProps> = ({ messages, onRefresh }) => {
  const { getAuthHeaders } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inquiry?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete message error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      <div className="border-b border-[#242424]/10 pb-6">
        <h2 className="font-display text-2xl font-bold text-[#242424]">Contact Inquiries</h2>
        <p className="text-xs font-mono text-[#242424]/60">
          Messages received from visitors via the public Contact page form ({messages.length} total)
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="p-12 border border-dashed border-[#242424]/15 rounded-lg text-center text-[#242424]/50 font-mono text-xs bg-white/40">
          No inquiries received yet. When visitors send messages on the Contact page, they will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white border border-[#242424]/10 rounded-lg p-6 space-y-4 shadow-sm hover:border-[#242424]/20 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242424]/10 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-bold text-base text-[#242424]">{msg.name}</span>
                    <span className="text-xs font-mono text-[#242424]/60">({msg.email})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#242424]/50">
                    Received: {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`mailto:${msg.email}?subject=Re: Inquiry on Nimra Gallery`}
                    className="px-3 py-1.5 bg-[#E7DDF7] hover:bg-[#d8c8f0] text-[#242424] text-xs font-mono rounded-md flex items-center space-x-1.5 transition-colors border border-[#242424]/10 font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </a>

                  <button
                    type="button"
                    disabled={deletingId === msg.id}
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 disabled:opacity-50 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#242424]/85 whitespace-pre-wrap font-light leading-relaxed">
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


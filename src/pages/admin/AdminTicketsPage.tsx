import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SupportTicket } from '../../types';
import { LifeBuoy, MessageSquare, Send, CheckCircle2, UserCheck, Paperclip } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const AdminTicketsPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState<string>('in_progress');
  const [isSending, setIsSending] = useState(false);

  const loadTickets = () => {
    api.getTickets().then((res) => {
      setTickets(res.tickets || []);
      if (res.tickets?.length > 0 && !selectedTicketId) {
        setSelectedTicketId(res.tickets[0].id);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicketId || !replyText.trim()) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('senderId', user.id);
    formData.append('senderName', user.fullName);
    formData.append('senderRole', 'staff');
    formData.append('message', replyText.trim());

    try {
      await api.replyTicket(selectedTicketId, formData);
      if (status !== activeTicket?.status) {
        await api.updateTicketStatus(selectedTicketId, status);
      }
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicketId) return;
    try {
      await api.updateTicketStatus(selectedTicketId, newStatus);
      loadTickets();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Support Desk Queue & Triage</h1>
        <p className="text-xs text-slate-400 mt-1">
          Respond to customer support tickets, assign staff engineers, and resolve technical issues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-white">Queue ({tickets.length})</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-colors ${
                  selectedTicketId === t.id
                    ? 'bg-amber-950/30 border-amber-500/80 text-white'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-amber-400 font-semibold">{t.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs font-semibold truncate text-slate-200">{t.subject}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{t.customerName} ({t.customerEmail})</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                  <span>{t.category}</span>
                  <span>·</span>
                  <span className="capitalize">{t.priority}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[500px]">
          {activeTicket ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeTicket.subject}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customer: <span className="text-white font-medium">{activeTicket.customerName}</span> ({activeTicket.customerEmail}) · Category: {activeTicket.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={activeTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-amber-400 font-medium focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_customer">Waiting on Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3 py-4 max-h-[380px] overflow-y-auto pr-1">
                  {activeTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                        m.senderRole === 'staff'
                          ? 'bg-amber-950/30 border border-amber-900/60 ml-4'
                          : 'bg-slate-950 border border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-200">
                          {m.senderName} {m.senderRole === 'staff' ? '(Staff Reply)' : ''}
                        </span>
                        <span className="text-slate-500">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply box */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 space-y-2">
                <textarea
                  rows={3}
                  placeholder="Draft official support reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Post Staff Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p>Select a ticket to inspect messages and triage.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SupportTicket } from '../../types';
import { LifeBuoy, Plus, MessageSquare, Send, Paperclip, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  navigate: (path: string) => void;
}

export const SupportTicketsPage: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Ticket Form
  const [category, setCategory] = useState<any>('Hosting');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<any>('medium');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  // Reply Form
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const loadTickets = () => {
    if (user?.id) {
      setLoading(true);
      api.getTickets(user.id)
        .then((res) => {
          setTickets(res.tickets || []);
          if (res.tickets?.length > 0 && !selectedTicketId) {
            setSelectedTicketId(res.tickets[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user]);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    const formData = new FormData();
    formData.append('customerId', user.id);
    formData.append('category', category);
    formData.append('subject', subject.trim());
    formData.append('priority', priority);
    formData.append('message', message.trim());
    if (attachment) formData.append('attachment', attachment);

    try {
      const res = await api.createTicket(formData);
      setShowNewModal(false);
      setSubject('');
      setMessage('');
      setAttachment(null);
      loadTickets();
      setSelectedTicketId(res.ticket.id);
    } catch (err: any) {
      alert(`Error creating ticket: ${err.message}`);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicketId || !replyText.trim()) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('senderId', user.id);
    formData.append('senderName', user.fullName);
    formData.append('senderRole', 'customer');
    formData.append('message', replyText.trim());
    if (replyFile) formData.append('attachment', replyFile);

    try {
      const res = await api.replyTicket(selectedTicketId, formData);
      setReplyText('');
      setReplyFile(null);
      loadTickets();
    } catch (err: any) {
      alert(`Error sending reply: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Support Tickets & Engineering Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            24/7 technical assistance for domain registration, hosting environments, DNS, and payment reconciliation.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-white">Your Tickets</span>
            <span className="text-[11px] text-slate-500">{tickets.length} total</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {tickets.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No support tickets found.</p>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-colors ${
                    selectedTicketId === t.id
                      ? 'bg-blue-950/30 border-blue-500/80 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-blue-400 font-semibold">{t.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold truncate text-slate-200">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span>{t.category}</span>
                    <span>·</span>
                    <span className="capitalize">{t.priority} priority</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between min-h-[500px]">
          {activeTicket ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                {/* Thread Header */}
                <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{activeTicket.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-semibold uppercase">
                        {activeTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Category: {activeTicket.category} · Priority: {activeTicket.priority} · Assigned: {activeTicket.assignedStaffName || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Messages List */}
                <div className="space-y-3 py-4 max-h-[380px] overflow-y-auto pr-1">
                  {activeTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                        m.senderRole === 'staff'
                          ? 'bg-blue-950/40 border border-blue-900/60 ml-4'
                          : 'bg-slate-950 border border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-200">
                          {m.senderName} {m.senderRole === 'staff' ? '(Nexora Support Engineer)' : ''}
                        </span>
                        <span className="text-slate-500">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      {m.attachmentName && (
                        <div className="pt-1">
                          <span className="text-[10px] text-blue-400 underline">Attachment: {m.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 space-y-2">
                <textarea
                  rows={3}
                  placeholder="Type your message to support engineers..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{replyFile ? replyFile.name : 'Attach file / logs'}</span>
                    <input
                      type="file"
                      onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p>Select a ticket to view the conversation thread.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <form
            onSubmit={handleCreateTicket}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm">Open Support Ticket</span>
              <button type="button" onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  {['Domain', 'Hosting', 'Payment', 'Website Deployment', 'SSL', 'DNS', 'Renewal', 'Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low (General Query)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="high">High (Service Degradation)</option>
                  <option value="critical">Critical (Downtime)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Subject</label>
              <input
                type="text"
                required
                placeholder="Brief summary of your question or issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Detailed Message</label>
              <textarea
                required
                rows={4}
                placeholder="Please describe the issue with any error codes or domain names..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachment ? attachment.name : 'Attach log file or screenshot (optional)'}</span>
                <input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

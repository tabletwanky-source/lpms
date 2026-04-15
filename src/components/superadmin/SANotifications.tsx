import React, { useEffect, useState } from 'react';
import { Send, Bell, CircleAlert as AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { superAdminApi } from '../../lib/superAdminApi';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
}

export default function SANotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from('global_notifications')
      .select('*')
      .order('sent_at', { ascending: false });
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { notification } = await superAdminApi.sendNotification(form.title, form.message);
      setNotifications(prev => [notification as Notification, ...prev]);
      setForm({ title: '', message: '' });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Global Announcements</h1>
        <p className="text-slate-500 text-sm mt-0.5">Broadcast messages to all platform users.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Send size={15} className="text-slate-500" /> Send New Announcement
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Title *</label>
            <input
              type="text"
              placeholder="e.g. New Feature Available"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message *</label>
            <textarea
              rows={4}
              placeholder="Write your announcement here..."
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${
              sent ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {sent ? 'Sent!' : sending ? 'Sending...' : 'Send to All Users'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Bell size={15} className="text-slate-500" /> History
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
            No announcements sent yet.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Bell size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <div className="text-sm text-slate-500 mt-0.5 whitespace-pre-line">{n.message}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(n.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

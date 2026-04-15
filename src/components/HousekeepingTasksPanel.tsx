import React, { useState, useEffect } from 'react';
import { Plus, X, CircleCheck as CheckCircle2, Clock, Wrench, RefreshCw, Trash2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { HousekeepingTask, Room, User } from '../types';

interface HousekeepingTasksPanelProps {
  rooms: Room[];
  currentUser: User;
}

const TASK_LABELS: Record<HousekeepingTask['task'], string> = {
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  inspection: 'Inspection',
  turndown: 'Turndown',
};

const STATUS_STYLES: Record<HousekeepingTask['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_ICONS: Record<HousekeepingTask['status'], React.ReactNode> = {
  pending: <Clock size={12} />,
  in_progress: <RefreshCw size={12} />,
  completed: <CheckCircle2 size={12} />,
};

export default function HousekeepingTasksPanel({ rooms, currentUser }: HousekeepingTasksPanelProps) {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    room_number: '',
    employee_name: '',
    task: 'cleaning' as HousekeepingTask['task'],
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [whatsAppTask, setWhatsAppTask] = useState<HousekeepingTask | null>(null);
  const [notifyPhone, setNotifyPhone] = useState('');

  const isAdmin = currentUser.role === 'Admin';

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .order('assigned_at', { ascending: false });
    if (data) setTasks(data as HousekeepingTask[]);
    setLoading(false);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .insert({ ...form, hotel_id: user.id })
      .select()
      .maybeSingle();

    if (!error && data) {
      setTasks(prev => [data as HousekeepingTask, ...prev]);
      setForm({ room_number: '', employee_name: '', task: 'cleaning', notes: '' });
      setIsModalOpen(false);
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: HousekeepingTask['status']) {
    const completed_at = status === 'completed' ? new Date().toISOString() : null;
    const { error } = await supabase
      .from('housekeeping_tasks')
      .update({ status, completed_at })
      .eq('id', id);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completed_at } : t));
      if (status === 'completed') {
        const task = tasks.find(t => t.id === id);
        if (task) { setWhatsAppTask(task); setNotifyPhone(''); }
      }
    }
  }

  function sendWhatsApp() {
    if (!notifyPhone || !whatsAppTask) return;
    const phone = notifyPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Dear Guest, Room ${whatsAppTask.room_number} is ready and has been freshly ${whatsAppTask.task === 'cleaning' ? 'cleaned' : whatsAppTask.task === 'turndown' ? 'prepared for turndown' : 'serviced'}. Welcome! 🏨`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    setWhatsAppTask(null);
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return;
    const { error } = await supabase.from('housekeeping_tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  }

  const pending = tasks.filter(t => t.status === 'pending');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Housekeeping Tasks</h2>
          <p className="text-slate-500 text-sm">{pending.length} pending · {inProgress.length} in progress · {completed.length} completed</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
          >
            <Plus size={16} /> Assign Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          <Wrench size={36} strokeWidth={1.5} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No tasks assigned yet.</p>
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-sm font-bold text-slate-700 hover:underline"
            >
              Assign the first task
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Room</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assigned To</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-3 font-bold text-slate-900">{task.room_number}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-semibold text-slate-700">{TASK_LABELS[task.task]}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{task.employee_name || '—'}</td>
                  <td className="px-5 py-3">
                    {isAdmin ? (
                      <select
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value as HousekeepingTask['status'])}
                        className={`text-xs font-bold border rounded-lg px-2 py-1 outline-none cursor-pointer ${STATUS_STYLES[task.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold border rounded-lg px-2 py-1 ${STATUS_STYLES[task.status]}`}>
                        {STATUS_ICONS[task.status]}
                        {task.status.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">{task.notes || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && (
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Wrench size={18} className="text-slate-600" />
                  Assign Housekeeping Task
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={createTask} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Room Number</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                    value={form.room_number}
                    onChange={e => setForm(p => ({ ...p, room_number: e.target.value }))}
                  >
                    <option value="">Select room...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.number}>Room {r.number} — {r.type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Task Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                    value={form.task}
                    onChange={e => setForm(p => ({ ...p, task: e.target.value as HousekeepingTask['task'] }))}
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inspection">Inspection</option>
                    <option value="turndown">Turndown</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Assign To (Employee Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. Maria Santos"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                    value={form.employee_name}
                    onChange={e => setForm(p => ({ ...p, employee_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Notes (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Any special instructions..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none resize-none"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-all text-sm"
                  >
                    {saving ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {whatsAppTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWhatsAppTask(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <MessageCircle size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Notify Guest via WhatsApp</h3>
                    <p className="text-xs text-slate-500">Room {whatsAppTask.room_number} — {whatsAppTask.task} complete</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Guest Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={notifyPhone}
                    onChange={e => setNotifyPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">Include country code (e.g. +1 for USA, +44 for UK)</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWhatsAppTask(null)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
                  >
                    Skip
                  </button>
                  <button
                    onClick={sendWhatsApp}
                    disabled={!notifyPhone}
                    className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={15} />
                    Send via WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

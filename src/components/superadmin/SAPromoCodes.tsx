import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, CircleAlert as AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { superAdminApi, PromoCode } from '../../lib/superAdminApi';
import { supabase } from '../../lib/supabase';

const DEFAULT_FORM = { code: '', discount: 10, type: 'percentage' as const, expires_at: '', max_uses: 0 };

export default function SAPromoCodes() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    setPromos((data ?? []) as PromoCode[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) { setError('Code is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const { promo } = await superAdminApi.createPromo({
        code: form.code,
        discount: Number(form.discount),
        type: form.type,
        expires_at: form.expires_at || undefined,
        max_uses: Number(form.max_uses) || 0,
      });
      setPromos(prev => [promo, ...prev]);
      setShowForm(false);
      setForm(DEFAULT_FORM);
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this promo code?')) return;
    await superAdminApi.deletePromo(id);
    setPromos(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggle(id: string, current: boolean) {
    await superAdminApi.togglePromo(id, !current);
    setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Promo Codes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Create discount codes for hotel subscriptions.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
        >
          <Plus size={16} /> Create Code
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <h3 className="font-bold text-slate-900">New Promo Code</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HOTEL50"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as typeof form.type }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Discount {form.type === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.discount}
                  onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max Uses (0 = unlimited)</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_uses}
                  onChange={e => setForm(p => ({ ...p, max_uses: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 disabled:opacity-60 transition-all">
                {saving ? 'Creating...' : 'Create Code'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null); setForm(DEFAULT_FORM); }}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-all">
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
          <Tag size={36} strokeWidth={1.5} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No promo codes yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Code</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Discount</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Uses</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Expires</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-sm">{p.code}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-900">
                      {p.type === 'percentage' ? `${p.discount}%` : `$${p.discount}`}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">{p.type}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-slate-600">
                    {p.used_count} / {p.max_uses === 0 ? '∞' : p.max_uses}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500">
                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggle(p.id, p.is_active)} className="flex items-center gap-1.5 text-sm font-bold transition-colors">
                      {p.is_active
                        ? <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600">Active</span></>
                        : <><ToggleLeft size={20} className="text-slate-300" /><span className="text-slate-400">Inactive</span></>
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

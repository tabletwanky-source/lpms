import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, UserCheck, UserX, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { superAdminApi, AdminUser } from '../../lib/superAdminApi';

const PLANS = ['Free', 'Basic', 'Pro', 'Enterprise'];

const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-slate-100 text-slate-600',
  Basic: 'bg-blue-50 text-blue-700 border border-blue-200',
  Pro: 'bg-amber-50 text-amber-700 border border-amber-200',
  Enterprise: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-red-50 text-red-600',
};

export default function SAUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { users } = await superAdminApi.getUsers();
        setUsers(users);
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function changePlan(id: string, plan: string) {
    setUpdating(id + '-plan');
    try {
      await superAdminApi.updateUserPlan(id, plan);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, plan } : u));
    } catch {}
    setUpdating(null);
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'suspended' : 'active';
    setUpdating(id + '-status');
    try {
      await superAdminApi.updateUserStatus(id, next);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: next } : u));
    } catch {}
    setUpdating(null);
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
    u.managerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} registered accounts</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by email, hotel, or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Hotel</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Plan</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">No users found.</td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(u.managerName || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{u.managerName || '—'}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{u.hotelName || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative inline-block">
                        <select
                          value={u.plan}
                          onChange={e => changePlan(u.id, e.target.value)}
                          disabled={updating === u.id + '-plan'}
                          className={`appearance-none pr-6 pl-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer outline-none transition-all ${PLAN_COLORS[u.plan] || PLAN_COLORS.Free}`}
                        >
                          {PLANS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[u.status] || STATUS_STYLES.active}`}>
                        {u.status === 'active' ? <UserCheck size={10} className="mr-1" /> : <UserX size={10} className="mr-1" />}
                        {u.status?.charAt(0).toUpperCase() + u.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleStatus(u.id, u.status)}
                        disabled={updating === u.id + '-status'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                          u.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {updating === u.id + '-status' ? '...' : u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

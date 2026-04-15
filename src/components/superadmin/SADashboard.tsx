import React, { useEffect, useState } from 'react';
import { Users, DollarSign, FileText, Tag, CalendarCheck, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { superAdminApi } from '../../lib/superAdminApi';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalInvoices: number;
  totalPromos: number;
  totalBookings: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  sent_at: string;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="text-2xl font-extrabold text-slate-900 mb-0.5">{value}</div>
    <div className="text-sm text-slate-500 font-medium">{label}</div>
  </motion.div>
);

export default function SADashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, { data: notifs }] = await Promise.all([
          superAdminApi.getStats(),
          supabase.from('global_notifications').select('*').order('sent_at', { ascending: false }).limit(5),
        ]);
        setStats(s);
        setNotifications(notifs ?? []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Global platform metrics at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} color="bg-blue-500" delay={0} />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`} color="bg-emerald-500" delay={0.05} />
        <StatCard icon={FileText} label="Invoices" value={stats?.totalInvoices ?? 0} color="bg-slate-700" delay={0.1} />
        <StatCard icon={Tag} label="Promo Codes" value={stats?.totalPromos ?? 0} color="bg-amber-500" delay={0.15} />
        <StatCard icon={CalendarCheck} label="Booking Requests" value={stats?.totalBookings ?? 0} color="bg-rose-500" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-500" /> Platform Health
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Active Users', pct: Math.min(100, Math.round(((stats?.totalUsers ?? 1) / Math.max(stats?.totalUsers ?? 1, 1)) * 100)), color: 'bg-blue-500' },
              { label: 'Revenue Target', pct: Math.min(100, Math.round(((stats?.totalRevenue ?? 0) / 5000) * 100)), color: 'bg-emerald-500' },
              { label: 'Booking Conversion', pct: stats?.totalBookings ? Math.min(100, 72) : 0, color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Recent Announcements</h2>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No announcements sent yet.</div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{n.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(n.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { superAdminApi } from '../../lib/superAdminApi';

interface DayData {
  date: string;
  users: number;
  revenue: number;
}

function BarChart({ data, valueKey, color, label, prefix }: {
  data: DayData[];
  valueKey: 'users' | 'revenue';
  color: string;
  label: string;
  prefix?: string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const total = data.reduce((s, d) => s + d[valueKey], 0);
  const last7 = data.slice(-7).reduce((s, d) => s + d[valueKey], 0);
  const prev7 = data.slice(-14, -7).reduce((s, d) => s + d[valueKey], 0);
  const change = prev7 === 0 ? 100 : Math.round(((last7 - prev7) / prev7) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label} (30 days)</div>
          <div className="text-2xl font-extrabold text-slate-900">
            {prefix}{valueKey === 'revenue' ? total.toFixed(2) : total}
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
          change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          <TrendingUp size={12} className={change < 0 ? 'rotate-180' : ''} />
          {change >= 0 ? '+' : ''}{change}% vs prev 7d
        </div>
      </div>

      <div className="flex items-end gap-0.5 h-28">
        {data.map((d, i) => {
          const height = max === 0 ? 0 : Math.max(2, Math.round((d[valueKey] / max) * 100));
          return (
            <motion.div
              key={d.date}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.02, ease: 'easeOut' }}
              className={`flex-1 rounded-t-sm ${color} cursor-default`}
              title={`${d.date}: ${prefix || ''}${valueKey === 'revenue' ? d[valueKey].toFixed(2) : d[valueKey]}`}
              style={{ minHeight: d[valueKey] > 0 ? 4 : 0 }}
            />
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-slate-400">
        <span>{data[0]?.date ? new Date(data[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>{data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

export default function SAAnalytics() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { last30Days } = await superAdminApi.getAnalytics();
        setData(last30Days);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const cumulativeUsers = data.reduce((acc, d) => {
    acc.push((acc[acc.length - 1] || 0) + d.users);
    return acc;
  }, [] as number[]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Platform growth and revenue — last 30 days.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart data={data} valueKey="users" color="bg-blue-500" label="New Users" />
        <BarChart data={data} valueKey="revenue" color="bg-emerald-500" label="Revenue" prefix="$" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users size={16} className="text-slate-500" /> Cumulative User Growth
        </h2>
        <div className="flex items-end gap-0.5 h-20">
          {cumulativeUsers.map((v, i) => {
            const max = cumulativeUsers[cumulativeUsers.length - 1] || 1;
            const height = Math.max(2, Math.round((v / max) * 100));
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.02 }}
                className="flex-1 bg-slate-800 rounded-t-sm"
                style={{ opacity: 0.4 + (v / max) * 0.6 }}
                title={`Day ${i + 1}: ${v} total users`}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block" />
            Total registered users over time
          </span>
          <span className="font-semibold text-slate-900">{cumulativeUsers[cumulativeUsers.length - 1] ?? 0} total</span>
        </div>
      </div>
    </div>
  );
}

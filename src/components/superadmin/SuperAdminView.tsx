import React, { useState } from 'react';
import { LayoutDashboard, Users, Tag, ChartBar as BarChart3, Bell, Settings, LogOut, Shield, ChevronRight, Hotel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SADashboard from './SADashboard';
import SAUsers from './SAUsers';
import SAPromoCodes from './SAPromoCodes';
import SAAnalytics from './SAAnalytics';
import SANotifications from './SANotifications';
import SASettings from './SASettings';

type SAView = 'Dashboard' | 'Users' | 'PromoCodes' | 'Analytics' | 'Notifications' | 'Settings';

const NAV: { id: SAView; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'Dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'Users', label: 'Users', icon: Users },
  { id: 'PromoCodes', label: 'Promo Codes', icon: Tag },
  { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'Notifications', label: 'Announcements', icon: Bell },
  { id: 'Settings', label: 'System Settings', icon: Settings },
];

function ViewRenderer({ view }: { view: SAView }) {
  switch (view) {
    case 'Dashboard': return <SADashboard />;
    case 'Users': return <SAUsers />;
    case 'PromoCodes': return <SAPromoCodes />;
    case 'Analytics': return <SAAnalytics />;
    case 'Notifications': return <SANotifications />;
    case 'Settings': return <SASettings />;
    default: return <SADashboard />;
  }
}

interface SuperAdminViewProps {
  onExit: () => void;
}

export default function SuperAdminView({ onExit }: SuperAdminViewProps) {
  const [view, setView] = useState<SAView>('Dashboard');

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-800">
        <div className="px-5 py-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm leading-none">SUPER ADMIN</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">Owner Dashboard</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                view === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={16} className={view === item.id ? 'text-amber-400' : ''} />
              {item.label}
              {view === item.id && <ChevronRight size={14} className="ml-auto text-slate-500" />}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Hotel size={16} />
            Back to Hotel App
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="bg-slate-950 px-8 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="text-slate-400 text-sm">
            <span className="text-slate-600">super admin</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-white font-medium">{NAV.find(n => n.id === view)?.label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Live
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ViewRenderer view={view} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

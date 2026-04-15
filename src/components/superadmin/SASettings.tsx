import React, { useEffect, useState } from 'react';
import { Save, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react';
import { superAdminApi } from '../../lib/superAdminApi';

interface Settings {
  registration_open: string;
  maintenance_mode: string;
  app_name: string;
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div>
        <div className="font-semibold text-slate-900 text-sm">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function SASettings() {
  const [settings, setSettings] = useState<Settings>({
    registration_open: 'true',
    maintenance_mode: 'false',
    app_name: 'LUMINA',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { settings: s } = await superAdminApi.getSettings();
        setSettings(prev => ({ ...prev, ...s }));
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await superAdminApi.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Control global platform behavior.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-0">
        <div className="pb-4 mb-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Application Name</label>
          <input
            type="text"
            value={settings.app_name}
            onChange={e => setSettings(p => ({ ...p, app_name: e.target.value }))}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all font-bold"
          />
        </div>

        <Toggle
          label="Open Registration"
          description="Allow new hotels to sign up for the platform."
          checked={settings.registration_open === 'true'}
          onChange={v => setSettings(p => ({ ...p, registration_open: String(v) }))}
        />
        <Toggle
          label="Maintenance Mode"
          description="Temporarily disable access for all non-admin users. A maintenance message will be shown."
          checked={settings.maintenance_mode === 'true'}
          onChange={v => setSettings(p => ({ ...p, maintenance_mode: String(v) }))}
        />
      </div>

      {settings.maintenance_mode === 'true' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-800 text-sm">Maintenance Mode Active</div>
            <div className="text-xs text-amber-600 mt-0.5">All users except the super admin will see a maintenance page until this is disabled.</div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
          saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        {saving ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : saved ? (
          <CheckCircle2 size={16} />
        ) : (
          <Save size={16} />
        )}
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Upload, Check, CircleAlert as AlertCircle, Hotel, User, Mail, Camera, X } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types';

interface SettingsViewProps {
  user: AppUser;
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
}

export default function SettingsView({ user, logoUrl, onLogoChange }: SettingsViewProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setUploadError('Not authenticated'); setUploading(false); return; }

    const ext = file.name.split('.').pop();
    const path = `${authUser.id}/logo.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('hotel-logos')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setPreview(logoUrl);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('hotel-logos')
      .getPublicUrl(path);

    onLogoChange(publicUrl);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
    setUploading(false);
  }

  function removeLogo() {
    setPreview(null);
    onLogoChange('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hotel Settings</h1>
        <p className="text-slate-500 text-sm">Manage your hotel's profile and branding.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Hotel Profile</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Hotel size={18} className="text-indigo-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hotel Name</div>
              <div className="font-bold text-slate-900">{user.hotelName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <User size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manager</div>
              <div className="font-bold text-slate-900">{user.managerName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</div>
              <div className="font-bold text-slate-900">{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Hotel Logo</h2>
          <p className="text-sm text-slate-500 mt-1">Your logo appears on invoices and receipts. Max 5MB (JPG, PNG, WebP).</p>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="Hotel logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Camera size={28} className="text-slate-300" />
                )}
              </div>
              {preview && (
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoUpload}
              />

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading ? 'Uploading...' : preview ? 'Replace Logo' : 'Upload Logo'}
              </button>

              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl"
                >
                  <AlertCircle size={15} />
                  {uploadError}
                </motion.div>
              )}

              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl"
                >
                  <Check size={15} />
                  Logo uploaded successfully
                </motion.div>
              )}

              <p className="text-xs text-slate-400">
                Your logo will be stored securely and displayed on all printed invoices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Subscription</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">{user.plan} Plan</div>
              <div className="text-sm text-slate-500">
                {user.plan === 'Free' ? 'Limited to 10 rooms and basic features' :
                 user.plan === 'Basic' ? 'Up to 50 rooms, priority support' :
                 'Unlimited rooms, all features'}
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              user.plan === 'Pro' ? 'bg-emerald-100 text-emerald-700' :
              user.plan === 'Basic' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {user.plan}
            </span>
          </div>
          {user.plan !== 'Pro' && (
            <a
              href="/pricing"
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              Upgrade Plan
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

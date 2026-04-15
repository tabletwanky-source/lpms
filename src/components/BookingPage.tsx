import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Hotel, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HotelInfo {
  name: string;
  email: string;
  phone?: string;
  logo?: string;
}

export default function BookingPage() {
  const params = new URLSearchParams(window.location.search);
  const hotelId = params.get('hotel_id');

  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    guest_name: '',
    email: '',
    phone: '',
    room_type: 'Single' as 'Single' | 'Double' | 'Suite' | 'Deluxe',
    check_in: '',
    check_out: '',
    num_guests: 1,
    special_requests: '',
  });

  useEffect(() => {
    if (!hotelId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.auth.admin?.getUserById?.(hotelId).catch(() => ({ data: null })) ?? { data: null };
      if (data?.user?.user_metadata) {
        const meta = data.user.user_metadata;
        setHotelInfo({
          name: meta.hotel_name || 'Hotel',
          email: data.user.email || '',
          phone: meta.phone || '',
          logo: meta.logo_url || '',
        });
      } else {
        setHotelInfo({ name: 'Hotel', email: '', phone: '' });
      }
      setLoading(false);
    })();
  }, [hotelId]);

  const nights = (() => {
    if (!form.check_in || !form.check_out) return 0;
    const diff = new Date(form.check_out).getTime() - new Date(form.check_in).getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  })();

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelId) { setError('Invalid booking link — no hotel ID.'); return; }
    if (nights === 0) { setError('Check-out must be after check-in.'); return; }

    setSubmitting(true);
    setError(null);

    const { error: dbError } = await supabase
      .from('public_bookings')
      .insert({
        hotel_id: hotelId,
        ...form,
        num_guests: Number(form.num_guests),
      });

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotelId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <Hotel size={48} className="mx-auto mb-4 text-slate-300" />
          <h1 className="text-xl font-bold text-slate-700">Invalid booking link</h1>
          <p className="text-slate-400 mt-2">Please contact the hotel directly for a valid booking link.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center mx-4"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Booking Request Sent!</h1>
          <p className="text-slate-500 mt-2">
            Thank you, <span className="font-semibold text-slate-700">{form.guest_name}</span>.
            Your request has been received. The hotel will confirm your booking shortly.
          </p>
          <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Room:</span><span className="font-semibold">{form.room_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Check-in:</span><span className="font-semibold">{form.check_in}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Check-out:</span><span className="font-semibold">{form.check_out}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Nights:</span><span className="font-semibold">{nights}</span></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              {hotelInfo?.logo ? (
                <img src={hotelInfo.logo} alt="Hotel logo" className="w-14 h-14 rounded-xl object-contain bg-white p-1" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                  <Hotel size={28} className="text-white/70" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{hotelInfo?.name || 'Hotel'}</h1>
                {hotelInfo?.email && <p className="text-slate-400 text-sm">{hotelInfo.email}</p>}
                {hotelInfo?.phone && <p className="text-slate-400 text-sm">{hotelInfo.phone}</p>}
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <h2 className="text-lg font-semibold">Online Room Booking</h2>
              <p className="text-slate-400 text-sm">Fill in the details below and we'll confirm your reservation.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Smith"
                  value={form.guest_name}
                  onChange={e => setForm(p => ({ ...p, guest_name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Room Type *</label>
                <select
                  required
                  value={form.room_type}
                  onChange={e => setForm(p => ({ ...p, room_type: e.target.value as typeof form.room_type }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                >
                  <option value="Single">Single Room</option>
                  <option value="Double">Double Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Deluxe">Deluxe Room</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Guests</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.num_guests}
                  onChange={e => setForm(p => ({ ...p, num_guests: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check-In Date *</label>
                <input
                  required
                  type="date"
                  min={today}
                  value={form.check_in}
                  onChange={e => setForm(p => ({ ...p, check_in: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check-Out Date *</label>
                <input
                  required
                  type="date"
                  min={form.check_in || today}
                  value={form.check_out}
                  onChange={e => setForm(p => ({ ...p, check_out: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all"
                />
              </div>

              {nights > 0 && (
                <div className="sm:col-span-2">
                  <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Duration:</span>
                    <span className="font-bold text-slate-900">{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Special Requests</label>
                <textarea
                  rows={3}
                  placeholder="e.g. late check-in, extra pillows, ground floor..."
                  value={form.special_requests}
                  onChange={e => setForm(p => ({ ...p, special_requests: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-xl text-sm outline-none transition-all resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60 transition-all text-base flex items-center justify-center gap-2"
            >
              {submitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Sending Request...' : 'Submit Booking Request'}
            </button>

            <p className="text-center text-xs text-slate-400">
              Your request will be reviewed by the hotel team. No payment is required at this stage.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

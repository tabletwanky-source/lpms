import React, { useState, useEffect } from 'react';
import { CircleCheck as CheckCircle2, X, Clock, Phone, Mail, Users, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { PublicBooking } from '../types';

interface PendingBookingsPanelProps {
  onApprove?: (booking: PublicBooking) => void;
}

const STATUS_STYLES: Record<PublicBooking['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_ICONS: Record<PublicBooking['status'], React.ReactNode> = {
  pending: <Clock size={12} />,
  approved: <CheckCircle2 size={12} />,
  rejected: <X size={12} />,
};

export default function PendingBookingsPanel({ onApprove }: PendingBookingsPanelProps) {
  const [bookings, setBookings] = useState<PublicBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | PublicBooking['status']>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase
      .from('public_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBookings(data as PublicBooking[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: PublicBooking['status']) {
    const { error } = await supabase
      .from('public_bookings')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      if (status === 'approved') {
        const booking = bookings.find(b => b.id === id);
        if (booking) onApprove?.(booking);
      }
    }
  }

  const nights = (b: PublicBooking) => {
    const diff = new Date(b.check_out).getTime() - new Date(b.check_in).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Online Booking Requests
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500">Approve or reject requests from your public booking page.</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? `All (${bookings.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${bookings.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          <Calendar size={36} strokeWidth={1.5} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No booking requests found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map(booking => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {booking.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{booking.guest_name}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <span className={`ml-auto sm:ml-0 inline-flex items-center gap-1 text-xs font-bold border rounded-full px-2.5 py-1 ${STATUS_STYLES[booking.status]}`}>
                        {STATUS_ICONS[booking.status]}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-slate-400 font-medium mb-0.5">Room</div>
                        <div className="font-bold text-slate-900">{booking.room_type}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-slate-400 font-medium mb-0.5">Check-in</div>
                        <div className="font-bold text-slate-900">{booking.check_in}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-slate-400 font-medium mb-0.5">Check-out</div>
                        <div className="font-bold text-slate-900">{booking.check_out}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5">
                        <div className="text-slate-400 font-medium mb-0.5">Nights</div>
                        <div className="font-bold text-slate-900">{nights(booking)}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {booking.phone && (
                        <a href={`tel:${booking.phone}`} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                          <Phone size={12} /> {booking.phone}
                        </a>
                      )}
                      {booking.email && (
                        <a href={`mailto:${booking.email}`} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                          <Mail size={12} /> {booking.email}
                        </a>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users size={12} /> {booking.num_guests} guest{booking.num_guests !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {booking.special_requests && (
                      <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                        <MessageSquare size={12} className="mt-0.5 shrink-0 text-amber-500" />
                        <span>{booking.special_requests}</span>
                      </div>
                    )}

                    {booking.phone && booking.status === 'approved' && (
                      <a
                        href={`https://wa.me/${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${booking.guest_name}, your booking at ${booking.room_type} room from ${booking.check_in} to ${booking.check_out} has been confirmed! We look forward to welcoming you.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/></svg>
                        Notify via WhatsApp
                      </a>
                    )}
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => updateStatus(booking.id, 'approved')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(booking.id, 'rejected')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

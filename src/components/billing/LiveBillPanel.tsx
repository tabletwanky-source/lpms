import React, { useState } from 'react';
import { Receipt, DollarSign, CreditCard, ChevronDown, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Reservation, Transaction, TransactionType, User } from '../../types';
import InvoiceModal from '../InvoiceModal';

interface LiveBillPanelProps {
  reservations: Reservation[];
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  currentUser: User;
  logoUrl: string | null;
}

const TYPE_OPTIONS: TransactionType[] = ['Room', 'Restaurant', 'Laundry', 'Spa', 'Deposit', 'Refund'];

const TYPE_COLORS: Record<string, string> = {
  Room: 'bg-blue-50 text-blue-700',
  Restaurant: 'bg-amber-50 text-amber-700',
  Laundry: 'bg-cyan-50 text-cyan-700',
  Spa: 'bg-rose-50 text-rose-700',
  Deposit: 'bg-emerald-50 text-emerald-700',
  Refund: 'bg-red-50 text-red-700',
};

export default function LiveBillPanel({
  reservations,
  transactions,
  onAddTransaction,
  currentUser,
  logoUrl,
}: LiveBillPanelProps) {
  const [selectedResId, setSelectedResId] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeReservations = reservations.filter(
    r => r.status === 'Checked In' || r.status === 'Confirmed' || r.status === 'Checked Out'
  );

  const selectedRes = reservations.find(r => r.id === selectedResId);
  const resBill = transactions.filter(t => t.reservationId === selectedResId);

  const totalCharged = resBill.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalPaid = Math.abs(resBill.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const balance = totalCharged - totalPaid;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes || !paymentAmount) return;
    setIsSubmitting(true);
    await onAddTransaction({
      reservationId: selectedResId,
      guestName: selectedRes.guestName,
      type: 'Deposit',
      description: `Payment received (${paymentMethod})`,
      amount: -Math.abs(parseFloat(paymentAmount)),
    });
    setPaymentAmount('');
    setShowPaymentForm(false);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-xl">
              <Receipt size={20} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Live Bill</h3>
              <p className="text-xs text-slate-500">Real-time billing per reservation</p>
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedResId}
              onChange={e => {
                setSelectedResId(e.target.value);
                setShowPaymentForm(false);
              }}
              className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer"
            >
              <option value="">Select a reservation…</option>
              {activeReservations.map(r => (
                <option key={r.id} value={r.id}>
                  {r.guestName} — Room {r.roomNumber}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {!selectedRes ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Receipt size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Select a reservation to view its bill</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Charged</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${totalCharged.toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance Due</p>
              <p className={`text-2xl font-bold mt-1 ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ${balance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold">{selectedRes.guestName}</span>
              <span className="text-slate-300">|</span>
              <span>Room {selectedRes.roomNumber}</span>
              <span className="text-slate-300">|</span>
              <span>{selectedRes.checkIn} → {selectedRes.checkOut}</span>
              <span className="text-slate-300">|</span>
              <span>{selectedRes.nights} nights</span>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setShowPaymentForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                <DollarSign size={13} />
                Record Payment
              </button>
              <button
                onClick={() => setShowInvoice(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <FileText size={13} />
                Invoice
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showPaymentForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleRecordPayment}
                className="overflow-hidden border-b border-slate-100"
              >
                <div className="p-4 bg-emerald-50 flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-emerald-800 uppercase">Amount ($)</label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-emerald-800 uppercase">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm outline-none"
                    >
                      <option>Cash</option>
                      <option>Card</option>
                      <option>Online</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                    >
                      {isSubmitting ? 'Saving…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {resBill.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CreditCard size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No charges yet for this reservation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {resBill.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{t.description}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[t.type] ?? 'bg-slate-50 text-slate-600'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.amount < 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        ) : t.status === 'Paid' ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${t.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `$${t.amount.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200">
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">Balance Due</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold text-lg ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ${balance.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {showInvoice && selectedRes && (
        <InvoiceModal
          reservation={selectedRes}
          hotelUser={currentUser}
          logoUrl={logoUrl}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}

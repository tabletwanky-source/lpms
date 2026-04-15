import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Reservation, Product, ReservationProduct, User } from '../types';

interface InvoiceModalProps {
  reservation: Reservation;
  hotelUser: User;
  logoUrl?: string | null;
  onClose: () => void;
}

export default function InvoiceModal({ reservation, hotelUser, logoUrl, onClose }: InvoiceModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<ReservationProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchLineItems();
  }, [reservation.id]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('category').order('name');
    if (data) setProducts(data);
  }

  async function fetchLineItems() {
    const { data } = await supabase
      .from('reservation_products')
      .select('*')
      .eq('reservation_id', reservation.id)
      .order('created_at');
    if (data) setLineItems(data);
  }

  async function addLineItem() {
    if (!selectedProduct) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    setAdding(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(false); return; }

    const { data, error } = await supabase
      .from('reservation_products')
      .insert({
        reservation_id: reservation.id,
        hotel_id: user.id,
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: selectedQty,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      setLineItems(prev => [...prev, data]);
      setSelectedProduct('');
      setSelectedQty(1);
    }
    setAdding(false);
  }

  async function removeLineItem(id: string) {
    const { error } = await supabase.from('reservation_products').delete().eq('id', id);
    if (!error) setLineItems(prev => prev.filter(item => item.id !== id));
  }

  function handlePrint() {
    window.print();
  }

  const extrasTotal = lineItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const grandTotal = reservation.total + extrasTotal;
  const amountPaid = reservation.amountPaid ?? 0;
  const balance = grandTotal - amountPaid;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 no-print"
      />

      <div id="invoice-print-root" className="fixed inset-0 z-[51] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          className="print-page w-full max-w-2xl bg-white rounded-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[95vh]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 no-print">
            <h3 className="font-bold text-slate-900">Invoice</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                <Printer size={16} /> Print / Save PDF
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>

          <div ref={printRef} className="overflow-y-auto flex-1">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Hotel Logo" className="h-14 w-auto object-contain mb-3" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg mb-3">
                      {hotelUser.hotelName.charAt(0)}
                    </div>
                  )}
                  <h2 className="text-xl font-black text-slate-900">{hotelUser.hotelName}</h2>
                  <p className="text-slate-500 text-sm">{hotelUser.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900 mb-1">INVOICE</div>
                  <div className="text-sm text-slate-500">Date: {today}</div>
                  <div className="text-sm text-slate-500">Ref: #{reservation.id.slice(-8).toUpperCase()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 p-5 bg-slate-50 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</div>
                  <div className="font-bold text-slate-900">{reservation.guestName}</div>
                  <div className="text-sm text-slate-500">Room {reservation.roomNumber}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Stay Details</div>
                  <div className="text-sm text-slate-700">Check-in: <span className="font-semibold">{reservation.checkIn}</span></div>
                  <div className="text-sm text-slate-700">Check-out: <span className="font-semibold">{reservation.checkOut}</span></div>
                  <div className="text-sm text-slate-700">Duration: <span className="font-semibold">{reservation.nights} nights</span></div>
                </div>
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                    <th className="text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Unit</th>
                    <th className="text-right py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="font-semibold text-slate-900">Room {reservation.roomNumber} — {reservation.roomType}</div>
                      <div className="text-xs text-slate-500">{reservation.nights} night(s) accommodation</div>
                    </td>
                    <td className="py-3 text-center text-slate-700">{reservation.nights}</td>
                    <td className="py-3 text-right font-mono text-slate-700">${(reservation.total / reservation.nights).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">${reservation.total.toFixed(2)}</td>
                  </tr>
                  {lineItems.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 group">
                      <td className="py-3 flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{item.product_name}</span>
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded transition-all no-print"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                      <td className="py-3 text-center text-slate-700">{item.quantity}</td>
                      <td className="py-3 text-right font-mono text-slate-700">${item.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">${(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Room charges</span>
                    <span className="font-mono">${reservation.total.toFixed(2)}</span>
                  </div>
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Extras & services</span>
                      <span className="font-mono">${extrasTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span className="font-mono">${grandTotal.toFixed(2)}</span>
                  </div>
                  {amountPaid > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Deposit paid</span>
                      <span className="font-mono">-${amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-base font-black rounded-xl px-3 py-2 ${balance <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span>Balance Due</span>
                    <span className="font-mono">${Math.max(0, balance).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 text-center text-slate-400 text-xs">
                Thank you for staying at {hotelUser.hotelName}. We hope to welcome you again soon.
              </div>
            </div>
          </div>

          {products.length > 0 && (
            <div className="border-t border-slate-100 p-5 shrink-0 no-print">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Add Extras to Invoice</div>
              <div className="flex gap-2">
                <select
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.price.toFixed(2)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center outline-none focus:border-indigo-500"
                  value={selectedQty}
                  onChange={e => setSelectedQty(parseInt(e.target.value) || 1)}
                />
                <button
                  onClick={addLineItem}
                  disabled={!selectedProduct || adding}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Plus, Trash2, Download, CircleCheck as CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
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
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [invoiceSaved, setInvoiceSaved] = useState(false);
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

  async function handleSaveInvoice() {
    setSavingInvoice(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingInvoice(false); return; }

    await supabase.from('invoices').insert({
      hotel_id: user.id,
      reservation_id: reservation.id,
      guest_name: reservation.guestName,
      room_number: reservation.roomNumber,
      nights: reservation.nights,
      room_total: reservation.total,
      products_total: extrasTotal,
      total: grandTotal,
      paid: amountPaid,
      balance: Math.max(0, balance),
      status: balance <= 0 ? 'paid' : 'issued',
    });

    setInvoiceSaved(true);
    setSavingInvoice(false);
    setTimeout(() => setInvoiceSaved(false), 3000);
  }

  async function getImageBase64(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function handleDownloadPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 16;
    let headerX = 14;

    if (logoUrl) {
      const b64 = await getImageBase64(logoUrl);
      if (b64) {
        doc.addImage(b64, 'PNG', 14, 10, 24, 24);
        headerX = 44;
      }
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(hotelUser.hotelName, headerX, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(hotelUser.email, headerX, y);
    y += 5;
    if (hotelUser.phone) {
      doc.text(hotelUser.phone, headerX, y);
      y += 5;
    }

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date: ${today}`, pageWidth - 14, 28, { align: 'right' });
    doc.text(`Ref: #${reservation.id.slice(-8).toUpperCase()}`, pageWidth - 14, 33, { align: 'right' });

    y += 10;
    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('BILL TO', 14, y);
    doc.text('STAY DETAILS', pageWidth / 2, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(reservation.guestName, 14, y);
    doc.text(`Check-in: ${reservation.checkIn}`, pageWidth / 2, y);
    y += 5;
    doc.text(`Room: ${reservation.roomNumber}`, 14, y);
    doc.text(`Check-out: ${reservation.checkOut}`, pageWidth / 2, y);
    y += 5;
    doc.text(`Duration: ${reservation.nights} night(s)`, pageWidth / 2, y);

    y += 12;
    doc.setDrawColor(0);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('DESCRIPTION', 14, y);
    doc.text('QTY', pageWidth - 60, y, { align: 'center' });
    doc.text('UNIT', pageWidth - 40, y, { align: 'right' });
    doc.text('AMOUNT', pageWidth - 14, y, { align: 'right' });
    y += 4;
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    const unitRate = (reservation.total / reservation.nights).toFixed(2);
    doc.text(`Room ${reservation.roomNumber} — ${reservation.roomType}`, 14, y);
    doc.text(String(reservation.nights), pageWidth - 60, y, { align: 'center' });
    doc.text(`$${unitRate}`, pageWidth - 40, y, { align: 'right' });
    doc.text(`$${reservation.total.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
    y += 6;

    lineItems.forEach(item => {
      doc.text(item.product_name, 14, y);
      doc.text(String(item.quantity), pageWidth - 60, y, { align: 'center' });
      doc.text(`$${item.unit_price.toFixed(2)}`, pageWidth - 40, y, { align: 'right' });
      doc.text(`$${(item.unit_price * item.quantity).toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
      y += 6;
    });

    y += 2;
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    const summaryX = pageWidth - 70;
    doc.setFontSize(9);
    doc.text('Room charges:', summaryX, y);
    doc.text(`$${reservation.total.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
    y += 5;
    if (extrasTotal > 0) {
      doc.text('Extras & services:', summaryX, y);
      doc.text(`$${extrasTotal.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
      y += 5;
    }
    if (amountPaid > 0) {
      doc.setTextColor(60, 140, 100);
      doc.text('Deposit paid:', summaryX, y);
      doc.text(`-$${amountPaid.toFixed(2)}`, pageWidth - 14, y, { align: 'right' });
      y += 5;
      doc.setTextColor(0);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`BALANCE DUE: $${Math.max(0, balance).toFixed(2)}`, pageWidth - 14, y + 4, { align: 'right' });

    y += 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`Thank you for staying at ${hotelUser.hotelName}.`, pageWidth / 2, y, { align: 'center' });

    doc.save(`invoice-${reservation.id.slice(-8)}.pdf`);
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
                onClick={handleSaveInvoice}
                disabled={savingInvoice}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  invoiceSaved
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-60`}
              >
                {savingInvoice ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : invoiceSaved ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <FileText size={16} />
                )}
                {invoiceSaved ? 'Saved!' : 'Save Invoice'}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-900 transition-all"
              >
                <Printer size={16} /> Print
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

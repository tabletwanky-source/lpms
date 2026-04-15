import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, Save, Package, Coffee, Utensils, Shirt, Wrench, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

const CATEGORIES = [
  { value: 'drink', label: 'Drinks', icon: Coffee },
  { value: 'food', label: 'Food', icon: Utensils },
  { value: 'laundry', label: 'Laundry', icon: Shirt },
  { value: 'service', label: 'Services', icon: Wrench },
  { value: 'other', label: 'Other', icon: ShoppingBag },
];

function categoryIcon(cat: string) {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? found.icon : Package;
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    drink: 'bg-blue-50 text-blue-600 border-blue-200',
    food: 'bg-amber-50 text-amber-600 border-amber-200',
    laundry: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    service: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    other: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return map[cat] ?? map.other;
}

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [formData, setFormData] = useState({ name: '', price: 0, category: 'drink' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name');
    if (!error && data) setProducts(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({ name: formData.name, price: formData.price, category: formData.category })
        .eq('id', editingProduct.id);
      if (error) { setError(error.message); setSaving(false); return; }
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); setSaving(false); return; }
      const { data, error } = await supabase
        .from('products')
        .insert({ hotel_id: user.id, name: formData.name, price: formData.price, category: formData.category })
        .select()
        .maybeSingle();
      if (error) { setError(error.message); setSaving(false); return; }
      if (data) setProducts(prev => [...prev, data]);
    }

    setSaving(false);
    closeModal();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) setProducts(prev => prev.filter(p => p.id !== id));
  }

  function openCreate() {
    setEditingProduct(null);
    setFormData({ name: '', price: 0, category: 'drink' });
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormData({ name: product.name, price: product.price, category: product.category });
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', price: 0, category: 'drink' });
  }

  const filtered = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory);
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: products.filter(p => p.category === cat.value),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products & Services</h1>
          <p className="text-slate-500 text-sm">Manage your hotel's chargeable items catalog.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
            activeCategory === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({products.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = products.filter(p => p.category === cat.value).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeCategory === cat.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <Package size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 mb-1">No products yet</h3>
          <p className="text-slate-500 text-sm mb-6">Add items like drinks, food, laundry, or services to charge guests.</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all">
            <Plus size={18} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(product => {
                const Icon = categoryIcon(product.category);
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${categoryColor(product.category)}`}>
                          <Icon size={15} />
                        </div>
                        <span className="font-semibold text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${categoryColor(product.category)}`}>
                        {CATEGORIES.find(c => c.value === product.category)?.label ?? product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {grouped.map(group => (
            <div key={group.value} className={`rounded-2xl border p-4 ${categoryColor(group.value)}`}>
              <group.icon size={20} className="mb-2" />
              <div className="text-2xl font-black">{group.items.length}</div>
              <div className="text-xs font-semibold mt-0.5">{group.label}</div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Coca-Cola, Room Service"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          formData.category === cat.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <cat.icon size={16} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unit Price ($)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

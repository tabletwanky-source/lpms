import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Loader as Loader2, Crown, Star } from 'lucide-react';
import { STRIPE_PRODUCTS } from '../../stripe-config';
import { supabase } from '../../lib/supabase';

interface PlanSelectorProps {
  currentPriceId?: string;
}

export default function PlanSelector({ currentPriceId }: PlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleUpgrade = async (priceId: string) => {
    try {
      setLoading(priceId);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to upgrade your plan');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const basicProduct = STRIPE_PRODUCTS.find(p => p.name === 'LUMINA BASIC')!;
  const proProduct = STRIPE_PRODUCTS.find(p => p.name === 'LUMINA PRO')!;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-slate-600">Upgrade your hotel management experience</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
            <div className="text-3xl font-bold text-slate-900">$0</div>
            <p className="text-slate-500">Forever</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Up to 10 guests</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Basic room management</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Simple reservations</span>
            </li>
          </ul>

          <button 
            disabled
            className="w-full py-3 bg-slate-100 text-slate-400 font-medium rounded-xl cursor-not-allowed"
          >
            Current Plan
          </button>
        </motion.div>

        {/* Basic Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-2xl border-2 border-blue-200 shadow-lg relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold">
              POPULAR
            </span>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="text-blue-500" size={20} />
              <h3 className="text-xl font-bold text-slate-900">{basicProduct.name}</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900">${basicProduct.price}</div>
            <p className="text-slate-500">per month</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Up to 30 guests</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Advanced room management</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Billing & invoicing</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Housekeeping management</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Basic reports</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade(basicProduct.priceId)}
            disabled={loading === basicProduct.priceId || currentPriceId === basicProduct.priceId}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === basicProduct.priceId ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : currentPriceId === basicProduct.priceId ? (
              'Current Plan'
            ) : (
              'Upgrade to Basic'
            )}
          </button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-purple-50 to-purple-100 p-8 rounded-2xl border-2 border-purple-200 shadow-lg"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="text-purple-500" size={20} />
              <h3 className="text-xl font-bold text-slate-900">{proProduct.name}</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900">${proProduct.price}</div>
            <p className="text-slate-500">per month</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Up to 60 guests</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Everything in Basic</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Advanced analytics</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Product/minibar management</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Priority support</span>
            </li>
            <li className="flex items-center gap-3">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-600">Custom branding</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade(proProduct.priceId)}
            disabled={loading === proProduct.priceId || currentPriceId === proProduct.priceId}
            className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === proProduct.priceId ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : currentPriceId === proProduct.priceId ? (
              'Current Plan'
            ) : (
              'Upgrade to Pro'
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
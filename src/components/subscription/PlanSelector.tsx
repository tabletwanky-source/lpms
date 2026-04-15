import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, Loader2, X } from 'lucide-react';
import { products, Product } from '../../stripe-config';
import { supabase } from '../../lib/supabase';

interface PlanSelectorProps {
  currentPriceId?: string | null;
  onClose?: () => void;
}

export default function PlanSelector({ currentPriceId, onClose }: PlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const createCheckoutSession = async (product: Product) => {
    setLoading(product.priceId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You could show a toast notification here instead of alert
      alert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  const getIcon = (productName: string) => {
    switch (productName) {
      case 'LMS2':
        return Crown;
      case 'LMS':
        return Zap;
      default:
        return Check;
    }
  };

  const isCurrentPlan = (priceId: string) => currentPriceId === priceId;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
        <p className="text-slate-600">Select the perfect plan for your learning management needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {products.map((product) => {
          const Icon = getIcon(product.name);
          const isCurrent = isCurrentPlan(product.priceId);
          const isLoadingThis = loading === product.priceId;
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-white rounded-2xl border-2 p-8 transition-all hover:shadow-lg ${
                product.name === 'LMS2' 
                  ? 'border-purple-200 ring-2 ring-purple-100' 
                  : 'border-slate-200 hover:border-indigo-200'
              } ${isCurrent ? 'ring-2 ring-emerald-200 border-emerald-300' : ''}`}
            >
              {product.name === 'LMS2' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                    PREMIUM
                  </div>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-4 right-4">
                  <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={12} />
                    CURRENT
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                  product.name === 'LMS2' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h3>
                <p className="text-slate-600 text-sm">{product.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    ${product.price}
                  </span>
                  <span className="text-slate-500">/month</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>Core learning features</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>Student progress tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>Basic reporting</span>
                </div>
                {product.name === 'LMS2' && (
                  <>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>Advanced analytics</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>Custom integrations</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>Priority support</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => createCheckoutSession(product)}
                disabled={isLoadingThis || isCurrent}
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
                  isCurrent 
                    ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                    : product.name === 'LMS2'
                    ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                } disabled:cursor-not-allowed`}
              >
                {isLoadingThis ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  'Get Started'
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {onClose && (
        <div className="text-center">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <X size={18} />
            Close
          </button>
        </div>
      )}
    </div>
  );
}
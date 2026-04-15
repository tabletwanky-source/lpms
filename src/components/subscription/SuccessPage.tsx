import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CircleCheck as CheckCircle, Crown, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getProductByPriceId } from '../../stripe-config';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const product = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-12 border border-slate-200">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-slate-600 mb-8 text-lg">
              Thank you for your subscription. Your account has been activated.
            </p>
          </motion.div>

          {loading ? (
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : product ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-bold text-purple-600 uppercase tracking-wider">
                  Active Plan
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{product.name}</h2>
              <p className="text-slate-600">{product.description}</p>
              <div className="mt-3 text-lg font-bold text-purple-600">
                ${product.price}/month
              </div>
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              Continue to Dashboard
              <ArrowRight size={20} />
            </button>
            
            <p className="text-sm text-slate-500">
              You can manage your subscription and billing from your account settings.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
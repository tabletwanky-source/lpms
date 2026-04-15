import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CircleCheck as CheckCircle2, ArrowLeft, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getProductByPriceId } from '../../stripe-config';

export default function SuccessPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

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

  const product = subscription ? getProductByPriceId(subscription.price_id) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={40} className="text-white" />
        </motion.div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Payment Successful! 🎉
        </h1>

        {loading ? (
          <div className="mb-6">
            <div className="animate-pulse bg-slate-200 h-4 rounded mb-2"></div>
            <div className="animate-pulse bg-slate-200 h-4 rounded w-3/4 mx-auto"></div>
          </div>
        ) : product ? (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="text-purple-500" size={20} />
              <span className="text-lg font-semibold text-slate-900">{product.name}</span>
            </div>
            <p className="text-slate-600">
              Your subscription is now active! You can now access all {product.name.toLowerCase()} features.
            </p>
          </div>
        ) : (
          <p className="text-slate-600 mb-6">
            Your payment has been processed successfully. Your account will be updated shortly.
          </p>
        )}

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full block py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-all"
          >
            Go to Dashboard
          </Link>
          
          <Link
            to="/pricing"
            className="w-full block py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Pricing
          </Link>
        </div>

        <div className="mt-8 p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">
            You will receive a confirmation email shortly. If you have any questions, 
            please contact our support team.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
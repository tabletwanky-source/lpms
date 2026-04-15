import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="order-2 lg:order-1">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Modern Hotel Management
            </h2>
            <div className="space-y-6 text-slate-600">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Streamlined Operations</h3>
                  <p>Manage reservations, guests, and billing from one unified platform.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Real-time Analytics</h3>
                  <p>Track occupancy rates, revenue, and performance metrics instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Automated Workflows</h3>
                  <p>Reduce manual tasks with smart housekeeping and billing automation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
            {isLogin ? (
              <LoginForm onToggleForm={() => setIsLogin(false)} />
            ) : (
              <SignupForm onToggleForm={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
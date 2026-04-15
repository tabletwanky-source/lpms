import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Hotel, LayoutDashboard, Calendar, Users, CreditCard, ChartBar as BarChart3, Shield, CircleCheck as CheckCircle2, ArrowRight, Star, Zap, Globe, Lock, TrendingUp, Clock, ChevronRight, Menu, X, BedDouble, ClipboardList, Receipt, Hop as Home, Sparkles } from 'lucide-react';

const NAV_LINKS = ['Features', 'Pricing', 'Testimonials'];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Real-time Dashboard',
    desc: 'Live occupancy rates, revenue metrics, and housekeeping status — all in one glance.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Calendar,
    title: 'Smart Reservations',
    desc: 'Drag-and-drop booking calendar with instant conflict detection and automated confirmation emails.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Users,
    title: 'Guest Profiles',
    desc: 'Detailed guest history, preferences, and loyalty tracking to deliver personalised experiences.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: CreditCard,
    title: 'Integrated Billing',
    desc: 'Automated invoicing, deposit tracking, and one-click Stripe payment collection.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    icon: Home,
    title: 'Housekeeping',
    desc: 'Assign staff, track room status in real-time, and ensure every room is spotless on arrival.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: BarChart3,
    title: 'Revenue Reports',
    desc: 'Daily, weekly, and monthly revenue breakdowns with occupancy trends and forecasting.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    desc: 'Perfect for solo operators getting started.',
    features: ['Up to 10 rooms', '5 active reservations', 'Basic reporting', 'Guest profiles', 'Email support'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '29',
    period: 'per month',
    desc: 'For growing hotels that need more power.',
    features: ['Up to 50 rooms', 'Unlimited reservations', 'Advanced analytics', 'Billing & invoicing', 'Priority support'],
    cta: 'Start 14-day Trial',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '79',
    period: 'per month',
    desc: 'Full suite for established hotel businesses.',
    features: ['Unlimited rooms', 'Multi-property support', 'Custom reports', 'API access', 'Dedicated account manager'],
    cta: 'Start 14-day Trial',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Amina Khalid',
    hotel: 'Riad Al Baraka, Marrakech',
    avatar: 'AK',
    stars: 5,
    quote: "Lumina replaced three separate tools we were using. Check-ins are twice as fast and our guests notice the difference immediately.",
  },
  {
    name: 'Carlos Mendoza',
    hotel: 'Hotel Vista Mar, Lisbon',
    avatar: 'CM',
    stars: 5,
    quote: "The billing module alone saved us 10 hours a week. Stripe integration works flawlessly — deposits are collected automatically.",
  },
  {
    name: 'Sarah Okonkwo',
    hotel: 'The Canopy Lodge, Cape Town',
    avatar: 'SO',
    stars: 5,
    quote: "Setup took under 20 minutes. I had my rooms loaded and the first reservation confirmed before lunch on day one.",
  },
];

const STATS = [
  { value: '2,400+', label: 'Hotels using Lumina' },
  { value: '98.9%', label: 'Uptime SLA' },
  { value: '4.9/5', label: 'Average rating' },
  { value: '< 30s', label: 'Average check-in time' },
];

const STEPS = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Add your rooms',
    desc: 'Import your room inventory in minutes. Set prices, types, and availability in bulk.',
  },
  {
    icon: BedDouble,
    step: '02',
    title: 'Manage reservations',
    desc: 'Accept bookings, assign rooms, and send automated confirmations to guests.',
  },
  {
    icon: Receipt,
    step: '03',
    title: 'Get paid instantly',
    desc: 'Generate invoices, collect deposits, and settle balances — all from one screen.',
  },
];

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  return <span>{target}{suffix}</span>;
}

function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrollY;
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollY = useScrollY();
  const navScrolled = scrollY > 20;

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased overflow-x-hidden">

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          navScrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20' : ''
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hotel size={18} className="text-white" />
            </div>
            <span className="text-white">Lumina<span className="text-blue-400"> PMS</span></span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {link}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="/auth" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </a>
            <a
              href="/auth"
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Start free
            </a>
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-900 border-b border-white/10 px-6 py-4 flex flex-col gap-4"
          >
            {NAV_LINKS.map(link => (
              <button key={link} onClick={() => scrollTo(link)} className="text-left text-slate-300 hover:text-white py-1">
                {link}
              </button>
            ))}
            <hr className="border-white/10" />
            <a href="/auth" className="text-slate-300 hover:text-white py-1">Sign in</a>
            <a href="/auth" className="bg-blue-600 text-white text-center py-3 rounded-xl font-semibold">
              Start free
            </a>
          </motion.div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-500/8 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-8"
        >
          <Sparkles size={12} />
          Built for modern hotel operators
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.08] mb-6"
        >
          Run your hotel
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            without the chaos.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10"
        >
          Lumina PMS is the all-in-one property management system that handles reservations,
          guest profiles, housekeeping, and billing — so you can focus on hospitality.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-14"
        >
          <a
            href="/auth"
            className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 text-base"
          >
            Start free — no card needed
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <button
            onClick={() => scrollTo('Features')}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base"
          >
            See features
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="relative w-full max-w-5xl mx-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-b from-blue-600/20 to-transparent rounded-3xl blur-xl" />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <div className="flex-1 mx-4 bg-slate-700/50 rounded-md h-5" />
            </div>
            <DashboardMockup />
          </div>
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.08} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <Zap size={12} /> Everything you need
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              One system. Every department.
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Replace the patchwork of tools your team is juggling with a single, intuitive platform.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div className={`group h-full bg-white/[0.03] hover:bg-white/[0.06] border ${f.border} rounded-2xl p-6 transition-all cursor-default`}>
                  <div className={`w-11 h-11 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center mb-5`}>
                    <f.icon size={22} className={f.color} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Up and running in minutes
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              No training sessions. No consultant fees. Just sign up and go.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {STEPS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.12}>
                <div className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center">
                      <step.icon size={32} className="text-blue-400" />
                    </div>
                    <span className="absolute -top-3 -right-3 w-7 h-7 bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <TrendingUp size={12} /> Simple pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Plans that scale with you
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Start free. Upgrade when you need more. Cancel anytime.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className={`relative flex flex-col h-full rounded-3xl border p-8 transition-all
                  ${plan.highlight
                    ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-600/30 scale-[1.03]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-900 text-xs font-black px-4 py-1.5 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-5xl font-black">${plan.price}</span>
                      <span className={`text-sm mb-2 ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                        /{plan.period}
                      </span>
                    </div>
                    <p className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>{plan.desc}</p>
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2
                          size={16}
                          className={plan.highlight ? 'text-emerald-300 shrink-0' : 'text-emerald-400 shrink-0'}
                        />
                        <span className={plan.highlight ? 'text-white' : 'text-slate-300'}>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/auth"
                    className={`inline-flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all text-sm
                      ${plan.highlight
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                      }`}
                  >
                    {plan.cta}
                    <ChevronRight size={16} />
                  </a>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Loved by hotel teams worldwide
            </h2>
            <p className="text-slate-400 text-lg">
              Real feedback from people running real hotels.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 flex flex-col gap-5 h-full">
                  <div className="flex gap-1">
                    {Array.from({ length: t.stars }).map((_, s) => (
                      <Star key={s} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 text-xs font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.hotel}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY STRIP ───────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Shield, label: 'SOC 2 ready', sub: 'Enterprise security' },
                { icon: Lock, label: 'End-to-end encryption', sub: 'All data in transit & at rest' },
                { icon: Globe, label: 'Global CDN', sub: '99.9% uptime SLA' },
                { icon: Clock, label: '24/7 monitoring', sub: 'Instant incident alerts' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-12 md:p-16 text-center">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              </div>
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                  Ready to modernise your hotel?
                </h2>
                <p className="text-blue-200 text-lg mb-10 max-w-lg mx-auto">
                  Join thousands of hotel operators who moved their property management to Lumina.
                  Free forever. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/auth"
                    className="group inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-black/20 text-base"
                  >
                    Create your free account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a
                    href="/auth"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all text-base"
                  >
                    Sign in
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hotel size={15} className="text-white" />
            </div>
            <span className="font-bold text-white">Lumina<span className="text-blue-400"> PMS</span></span>
          </div>
          <div className="flex items-center gap-8 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} Lumina PMS. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Support'].map(link => (
              <a key={link} href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="bg-slate-950 p-4 grid grid-cols-4 gap-3 min-h-[340px]">
      <div className="col-span-1 flex flex-col gap-3">
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-slate-500 mb-2">Occupancy</div>
          <div className="text-2xl font-black text-white">78<span className="text-base font-normal text-slate-500">%</span></div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-[78%] bg-blue-500 rounded-full" />
          </div>
        </div>
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-slate-500 mb-2">Revenue Today</div>
          <div className="text-xl font-black text-emerald-400">$3,240</div>
        </div>
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-slate-500 mb-2">Check-ins</div>
          <div className="text-xl font-black text-white">12</div>
        </div>
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-slate-500 mb-2">Check-outs</div>
          <div className="text-xl font-black text-white">7</div>
        </div>
      </div>
      <div className="col-span-3 flex flex-col gap-3">
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
          <div className="text-xs text-slate-500 mb-3">Room Status</div>
          <div className="grid grid-cols-6 gap-1.5">
            {['101','102','103','104','105','106','107','108','109','110','111','112','201','202','203','204','205','206'].map((r, i) => (
              <div
                key={r}
                className={`rounded-md p-1.5 text-center ${
                  i % 5 === 0 ? 'bg-emerald-500/20 border border-emerald-500/30' :
                  i % 4 === 0 ? 'bg-amber-500/20 border border-amber-500/30' :
                  i % 3 === 0 ? 'bg-blue-500/20 border border-blue-500/30' :
                  'bg-slate-800/60 border border-white/5'
                }`}
              >
                <div className="text-[9px] font-bold text-slate-300">{r}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            {[
              { color: 'bg-emerald-500', label: 'Available' },
              { color: 'bg-blue-500', label: 'Occupied' },
              { color: 'bg-amber-500', label: 'Dirty' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-[10px] text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 flex-1">
          <div className="text-xs text-slate-500 mb-3">Upcoming Reservations</div>
          <div className="space-y-2">
            {[
              { name: 'Sarah Johnson', room: '204', dates: 'Apr 15 – 18', status: 'Confirmed', color: 'text-emerald-400' },
              { name: 'Ahmed Al-Rashid', room: '107', dates: 'Apr 15 – 16', status: 'Checked In', color: 'text-blue-400' },
              { name: 'Elena Vasquez', room: '302', dates: 'Apr 16 – 20', status: 'Pending', color: 'text-amber-400' },
            ].map(res => (
              <div key={res.name} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                <div>
                  <div className="text-xs font-semibold text-white">{res.name}</div>
                  <div className="text-[10px] text-slate-500">Room {res.room} · {res.dates}</div>
                </div>
                <span className={`text-[10px] font-bold ${res.color}`}>{res.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

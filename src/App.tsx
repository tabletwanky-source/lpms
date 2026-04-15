/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Calendar, Users, CreditCard, Hop as Home, LogOut, Bell, Search, Settings, Plus, MoveVertical as MoreVertical, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle, Wrench, Mail, Phone, CalendarDays, DollarSign, X, ListFilter as Filter, Download, UserPlus, ChartBar as BarChart3, TrendingUp, ChartPie as PieChart, Shield, Printer, Hotel, User as UserIcon, Lock, Menu, Package, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { View, Room, Reservation, Guest, Transaction, TransactionType, Staff, User, UserRole, SubscriptionPlan } from './types';
import { MOCK_ROOMS, MOCK_RESERVATIONS, MOCK_GUESTS, MOCK_TRANSACTIONS, MOCK_STAFF } from './mockData';
import AuthPage from './components/auth/AuthPage';
import AdminView from './components/AdminView';
import PlanSelector from './components/subscription/PlanSelector';
import SuccessPage from './components/subscription/SuccessPage';
import LandingPage from './components/LandingPage';
import ProductsView from './components/ProductsView';
import InvoiceModal from './components/InvoiceModal';
import SettingsView from './components/SettingsView';
import { supabase } from './lib/supabase';
import { getProductByPriceId } from './stripe-config';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();
      
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const currentUser = user ? {
    id: user.id,
    email: user.email!,
    hotelName: user.user_metadata?.hotel_name || 'My Hotel',
    managerName: user.user_metadata?.manager_name || user.email?.split('@')[0] || 'Manager',
    role: 'Admin' as UserRole,
    plan: getCurrentPlan(),
    password: '',
    createdAt: user.created_at
  } : null;

  function getCurrentPlan(): SubscriptionPlan {
    if (!subscription?.price_id) return 'Free';
    const product = getProductByPriceId(subscription.price_id);
    if (product?.name === 'LMS2') return 'Pro';
    if (product?.name === 'LMS') return 'Basic';
    return 'Free';
  }

  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Rooms State with LocalStorage
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('lumina_rooms');
    return saved ? JSON.parse(saved) : MOCK_ROOMS;
  });

  // Reservations State with LocalStorage
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('lumina_reservations');
    return saved ? JSON.parse(saved) : MOCK_RESERVATIONS;
  });

  // Guest State with LocalStorage
  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem('lumina_guests');
    return saved ? JSON.parse(saved) : MOCK_GUESTS;
  });

  // Transactions State with LocalStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('lumina_transactions');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });

  // Staff State with LocalStorage
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('lumina_staff');
    return saved ? JSON.parse(saved) : MOCK_STAFF;
  });

  useEffect(() => {
    localStorage.setItem('lumina_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('lumina_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('lumina_guests', JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem('lumina_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('lumina_staff', JSON.stringify(staff));
  }, [staff]);

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const checkPlanLimit = () => {
    if (!currentUser) return true;
    if (currentUser.plan === 'Free' && guests.length >= 10) return false;
    if (currentUser.plan === 'Basic' && guests.length >= 30) return false;
    if (currentUser.plan === 'Pro' && guests.length >= 60) return false;
    return true;
  };

  const addGuest = (newGuest: Omit<Guest, 'id' | 'lastStay' | 'totalSpent'>) => {
    if (!checkPlanLimit()) {
      alert('Guest limit reached for your plan. Please upgrade!');
      return;
    }
    const guest: Guest = {
      ...newGuest,
      id: `g-${Date.now()}`,
      lastStay: 'Never',
      totalSpent: 0
    };
    setGuests(prev => [guest, ...prev]);
  };

  const addRoom = (newRoom: Omit<Room, 'id' | 'status'>) => {
    const room: Room = {
      ...newRoom,
      id: `room-${Date.now()}`,
      status: 'Available'
    };
    setRooms(prev => [...prev, room]);
  };

  const updateRoom = (updatedRoom: Room) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const addReservation = (newRes: Omit<Reservation, 'id' | 'status'>) => {
    const resId = `res-${Date.now()}`;
    const res: Reservation = {
      ...newRes,
      id: resId,
      status: 'Confirmed'
    };
    setReservations(prev => [res, ...prev]);

    // Add initial room charge transaction
    const transaction: Transaction = {
      id: `t-${Date.now()}`,
      reservationId: resId,
      guestName: res.guestName,
      type: 'Room',
      description: `Room Charge - ${res.roomNumber}`,
      amount: res.total,
      date: res.checkIn,
      status: 'Pending'
    };

    // Add payment transaction if amountPaid > 0
    const transactionsToAdd = [transaction];
    if (res.amountPaid > 0) {
      transactionsToAdd.push({
        id: `t-pay-${Date.now()}`,
        reservationId: resId,
        guestName: res.guestName,
        type: 'Deposit',
        description: `Initial Payment (${res.paymentMethod})`,
        amount: -res.amountPaid,
        date: res.checkIn,
        status: 'Paid'
      });
    }

    setTransactions(prev => [...transactionsToAdd, ...prev]);
  };

  const addTransaction = (newTrans: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    const transaction: Transaction = {
      ...newTrans,
      id: `t-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleCheckIn = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return;

    setReservations(prev => prev.map(r => 
      r.id === resId ? { ...r, status: 'Checked In' } : r
    ));

    setRooms(prev => prev.map(room => 
      room.number === res.roomNumber ? { ...room, status: 'Occupied' } : room
    ));
  };

  const handleCheckOut = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return;

    setReservations(prev => prev.map(r => 
      r.id === resId ? { ...r, status: 'Checked Out' } : r
    ));

    setRooms(prev => prev.map(room => 
      room.number === res.roomNumber ? { ...room, status: 'Dirty' } : room
    ));
  };

  const updateRoomStatus = (roomId: string, status: Room['status']) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, status, lastCleaned: status === 'Available' ? new Date().toLocaleString() : room.lastCleaned } : room
    ));
  };

  const assignStaffToRoom = (roomId: string, staffId: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, assignedStaffId: staffId } : room
    ));
  };

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Reservations', icon: Calendar, label: 'Reservations' },
    { id: 'Guests', icon: Users, label: 'Guests' },
    { id: 'Billing', icon: CreditCard, label: 'Billing' },
    { id: 'Housekeeping', icon: Home, label: 'Housekeeping' },
    { id: 'Reports', icon: BarChart3, label: 'Reports' },
    ...(currentUser?.role === 'Admin' ? [{ id: 'Admin', icon: Shield, label: 'Room Management' }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/pricing" element={
          <div className="min-h-screen bg-slate-50 p-8">
            <PlanSelector currentPriceId={subscription?.price_id} />
          </div>
        } />
        <Route path="/" element={
          <MainApp
            currentUser={currentUser!}
            currentView={currentView}
            setCurrentView={setCurrentView}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            handleLogout={handleLogout}
            showPricingModal={showPricingModal}
            setShowPricingModal={setShowPricingModal}
            subscription={subscription}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            guests={guests}
            onAddGuest={addGuest}
            rooms={rooms}
            reservations={reservations}
            onAddReservation={addReservation}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            transactions={transactions}
            onAddTransaction={addTransaction}
            staff={staff}
            onUpdateRoomStatus={updateRoomStatus}
            onAssignStaff={assignStaffToRoom}
            onAddRoom={addRoom}
            onUpdateRoom={updateRoom}
            onDeleteRoom={deleteRoom}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp({
  currentUser,
  currentView,
  setCurrentView,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
  showPricingModal,
  setShowPricingModal,
  subscription,
  logoUrl,
  onLogoChange,
  guests,
  onAddGuest,
  rooms,
  reservations,
  onAddReservation,
  onCheckIn,
  onCheckOut,
  transactions,
  onAddTransaction,
  staff,
  onUpdateRoomStatus,
  onAssignStaff,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom
}: {
  currentUser: User;
  currentView: View;
  setCurrentView: (view: View) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
  showPricingModal: boolean;
  setShowPricingModal: (show: boolean) => void;
  subscription: any;
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
  guests: Guest[];
  onAddGuest: (g: Omit<Guest, 'id' | 'lastStay' | 'totalSpent'>) => void;
  rooms: Room[];
  reservations: Reservation[];
  onAddReservation: (r: Omit<Reservation, 'id' | 'status'>) => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  staff: Staff[];
  onUpdateRoomStatus: (roomId: string, status: Room['status']) => void;
  onAssignStaff: (roomId: string, staffId: string) => void;
  onAddRoom: (r: Omit<Room, 'id' | 'status'>) => void;
  onUpdateRoom: (r: Room) => void;
  onDeleteRoom: (id: string) => void;
}) {
  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Reservations', icon: Calendar, label: 'Reservations' },
    { id: 'Guests', icon: Users, label: 'Guests' },
    { id: 'Billing', icon: CreditCard, label: 'Billing' },
    { id: 'Housekeeping', icon: Home, label: 'Housekeeping' },
    { id: 'Products', icon: Package, label: 'Products' },
    { id: 'Reports', icon: BarChart3, label: 'Reports' },
    ...(currentUser?.role === 'Admin' ? [{ id: 'Admin', icon: Shield, label: 'Room Management' }] : []),
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          {isSidebarOpen && <span className="font-bold text-white text-lg tracking-tight">Lumina PMS</span>}
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {isSidebarOpen && (
            <div className="mb-3 bg-slate-800/60 rounded-xl p-3">
              <div className="text-xs font-bold text-white truncate">{currentUser.hotelName}</div>
              <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium"
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={20} className="text-slate-500" />
            </button>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-100 rounded-xl relative">
              <Bell size={20} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {currentUser.managerName?.charAt(0) ?? 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700">{currentUser.managerName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <ViewRenderer
            view={currentView}
            guests={guests}
            onAddGuest={onAddGuest}
            rooms={rooms}
            reservations={reservations}
            onAddReservation={onAddReservation}
            onCheckIn={onCheckIn}
            onCheckOut={onCheckOut}
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            staff={staff}
            onUpdateRoomStatus={onUpdateRoomStatus}
            onAssignStaff={onAssignStaff}
            onAddRoom={onAddRoom}
            onUpdateRoom={onUpdateRoom}
            onDeleteRoom={onDeleteRoom}
            currentUser={currentUser}
            logoUrl={logoUrl}
            onLogoChange={onLogoChange}
          />
        </main>
      </div>
    </div>
    </>
  );
}

function ViewRenderer({
  view,
  guests,
  onAddGuest,
  rooms,
  reservations,
  onAddReservation,
  onCheckIn,
  onCheckOut,
  transactions,
  onAddTransaction,
  staff,
  onUpdateRoomStatus,
  onAssignStaff,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  currentUser,
  logoUrl,
  onLogoChange
}: {
  view: View;
  guests: Guest[];
  onAddGuest: (g: Omit<Guest, 'id' | 'lastStay' | 'totalSpent'>) => void;
  rooms: Room[];
  reservations: Reservation[];
  onAddReservation: (r: Omit<Reservation, 'id' | 'status'>) => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  staff: Staff[];
  onUpdateRoomStatus: (roomId: string, status: Room['status']) => void;
  onAssignStaff: (roomId: string, staffId: string) => void;
  onAddRoom: (r: Omit<Room, 'id' | 'status'>) => void;
  onUpdateRoom: (r: Room) => void;
  onDeleteRoom: (id: string) => void;
  currentUser: User;
  logoUrl: string | null;
  onLogoChange: (url: string) => void;
}) {
  switch (view) {
    case 'Dashboard': return <DashboardView rooms={rooms} reservations={reservations} user={currentUser} />;
    case 'Reservations': return (
      <ReservationsView
        reservations={reservations}
        rooms={rooms}
        onAddReservation={onAddReservation}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
      />
    );
    case 'Guests': return <GuestsView guests={guests} onAddGuest={onAddGuest} />;
    case 'Billing': return (
      <BillingView
        transactions={transactions}
        reservations={reservations}
        onAddTransaction={onAddTransaction}
        currentUser={currentUser}
        logoUrl={logoUrl}
      />
    );
    case 'Housekeeping': return (
      <HousekeepingView
        rooms={rooms}
        staff={staff}
        onUpdateStatus={onUpdateRoomStatus}
        onAssignStaff={onAssignStaff}
      />
    );
    case 'Products': return <ProductsView />;
    case 'Reports': return (
      <ReportsView
        rooms={rooms}
        reservations={reservations}
        guests={guests}
        transactions={transactions}
      />
    );
    case 'Admin': return (
      <AdminView
        rooms={rooms}
        onAddRoom={onAddRoom}
        onUpdateRoom={onUpdateRoom}
        onDeleteRoom={onDeleteRoom}
      />
    );
    case 'Settings': return (
      <SettingsView
        user={currentUser}
        logoUrl={logoUrl}
        onLogoChange={onLogoChange}
      />
    );
    default: return <DashboardView rooms={rooms} reservations={reservations} user={currentUser} />;
  }
}

function DashboardView({ rooms, reservations, user }: { rooms: Room[]; reservations: Reservation[]; user: User }) {
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'Available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const todayCheckIns = reservations.filter(res => res.status === 'Confirmed').length;
  const todayCheckOuts = reservations.filter(res => res.status === 'Checked In').length;

  const stats = [
    { label: 'Total Rooms', value: totalRooms.toString(), change: 'Capacity', icon: Home, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Available', value: availableRooms.toString(), change: 'Ready', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Occupied', value: occupiedRooms.toString(), change: 'Active', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Today Check-ins', value: todayCheckIns.toString(), change: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Today Check-outs', value: todayCheckOuts.toString(), change: 'Expected', icon: LogOut, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back, {user.managerName}. Here's what's happening at {user.hotelName}.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user.plan === 'Pro' ? 'bg-purple-500' : user.plan === 'Basic' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
            <span className="text-sm font-bold text-slate-700">{user.plan} Plan</span>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            <Plus size={20} />
            New Reservation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                stat.label === 'Today Check-outs' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
              }`}>{stat.change}</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Reservations</h3>
            <button className="text-indigo-600 text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-grid">
              <thead>
                <tr>
                  <th className="data-header">Guest</th>
                  <th className="data-header">Room</th>
                  <th className="data-header">Check In</th>
                  <th className="data-header">Status</th>
                  <th className="data-header text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {reservations.slice(0, 5).map((res) => (
                  <tr key={res.id} className="data-row">
                    <td className="data-cell font-medium">{res.guestName}</td>
                    <td className="data-cell font-mono text-slate-500">{res.roomNumber}</td>
                    <td className="data-cell text-slate-600">{res.checkIn}</td>
                    <td className="data-cell">
                      <span className={`status-badge ${
                        res.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                        res.status === 'Checked In' ? 'bg-emerald-100 text-emerald-700' :
                        res.status === 'Checked Out' ? 'bg-slate-100 text-slate-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="data-cell text-right font-mono font-bold">${res.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-6">Room Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Available', count: rooms.filter(r => r.status === 'Available').length, color: 'bg-emerald-500' },
              { label: 'Occupied', count: rooms.filter(r => r.status === 'Occupied').length, color: 'bg-indigo-500' },
              { label: 'Dirty', count: rooms.filter(r => r.status === 'Dirty').length, color: 'bg-amber-500' },
              { label: 'Maintenance', count: rooms.filter(r => r.status === 'Maintenance').length, color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200">
                Print Report
              </button>
              <button className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200">
                Night Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationsView({ 
  reservations, 
  rooms, 
  onAddReservation,
  onCheckIn,
  onCheckOut
}: { 
  reservations: Reservation[]; 
  rooms: Room[];
  onAddReservation: (r: Omit<Reservation, 'id' | 'status'>) => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    phone: '',
    email: '',
    address: '',
    nationality: '',
    idNumber: '',
    roomId: '',
    roomNumber: '',
    roomType: 'Single' as Room['type'],
    numGuests: 1,
    checkIn: '',
    checkOut: '',
    paymentMethod: 'Cash' as Reservation['paymentMethod'],
    amountPaid: 0,
    specialRequests: '',
    notes: ''
  });

  const calculateNights = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights(formData.checkIn, formData.checkOut);
  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const roomPrice = selectedRoom?.price || 0;
  const total = nights * roomPrice;
  const balanceDue = total - formData.amountPaid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) {
      alert('Please select a room');
      return;
    }

    const hasConflict = reservations.some(r =>
      r.roomId === selectedRoom.id &&
      r.status !== 'Checked Out' &&
      r.status !== 'Cancelled' &&
      formData.checkIn < r.checkOut &&
      formData.checkOut > r.checkIn
    );
    if (hasConflict) {
      alert('This room is already booked for the selected dates. Please choose different dates or another room.');
      return;
    }

    onAddReservation({
      guestId: `g-new-${Date.now()}`,
      guestName: formData.guestName,
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.number,
      roomType: selectedRoom.type,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      nights,
      numGuests: formData.numGuests,
      total,
      paymentMethod: formData.paymentMethod,
      amountPaid: formData.amountPaid,
      balanceDue,
      specialRequests: formData.specialRequests,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin'
    });
    setIsModalOpen(false);
    setFormData({
      guestName: '',
      phone: '',
      email: '',
      address: '',
      nationality: '',
      idNumber: '',
      roomId: '',
      roomNumber: '',
      roomType: 'Single',
      numGuests: 1,
      checkIn: '',
      checkOut: '',
      paymentMethod: 'Cash',
      amountPaid: 0,
      specialRequests: '',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reservations</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">Filter</button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            Add New
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="data-grid">
          <thead>
            <tr>
              <th className="data-header">ID</th>
              <th className="data-header">Guest</th>
              <th className="data-header">Room</th>
              <th className="data-header">Dates</th>
              <th className="data-header">Status</th>
              <th className="data-header text-right">Amount</th>
              <th className="data-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <tr key={res.id} className="data-row">
                <td className="data-cell font-mono text-xs text-slate-400">{res.id.slice(-6)}</td>
                <td className="data-cell">
                  <div className="font-medium text-slate-900">{res.guestName}</div>
                  <div className="text-[10px] text-slate-400">{res.numGuests} Guests</div>
                </td>
                <td className="data-cell">
                  <div className="font-mono text-slate-700">Room {res.roomNumber}</div>
                  <div className="text-[10px] text-slate-400">{res.roomType}</div>
                </td>
                <td className="data-cell text-slate-600 text-xs">
                  <div>{res.checkIn} → {res.checkOut}</div>
                  <div className="text-[10px] text-slate-400">{res.nights} Nights</div>
                </td>
                <td className="data-cell">
                  <span className={`status-badge ${
                    res.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                    res.status === 'Checked In' ? 'bg-emerald-100 text-emerald-700' :
                    res.status === 'Checked Out' ? 'bg-slate-100 text-slate-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {res.status}
                  </span>
                </td>
                <td className="data-cell text-right">
                  <div className="font-mono font-bold text-slate-900">${res.total}</div>
                  <div className="text-[10px] text-red-500">Bal: ${res.balanceDue}</div>
                </td>
                <td className="data-cell text-right">
                  <div className="flex justify-end gap-2">
                    {res.status === 'Confirmed' && (
                      <button 
                        onClick={() => onCheckIn(res.id)}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                      >
                        Check In
                      </button>
                    )}
                    {res.status === 'Checked In' && (
                      <button 
                        onClick={() => onCheckOut(res.id)}
                        className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700"
                      >
                        Check Out
                      </button>
                    )}
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-400">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-900 text-lg">Guest Check-in / New Reservation</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                {/* Guest Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Users size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Guest Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.guestName}
                        onChange={e => setFormData({...formData, guestName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        required
                        placeholder="+1 234 567 890"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        type="email"
                        placeholder="john@example.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID / Passport Number</label>
                      <input 
                        placeholder="A1234567"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.idNumber}
                        onChange={e => setFormData({...formData, idNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Address</label>
                      <input 
                        placeholder="123 Main St, New York, NY"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nationality</label>
                      <input 
                        placeholder="American"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.nationality}
                        onChange={e => setFormData({...formData, nationality: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Booking Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Hotel size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Booking Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Room</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.roomId}
                        onChange={e => setFormData({...formData, roomId: e.target.value})}
                      >
                        <option value="">Select a room</option>
                        {rooms.filter(r => r.status === 'Available').map(room => (
                          <option key={room.id} value={room.id}>
                            Room {room.number} ({room.type}) - ${room.price}/night
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Number of Guests</label>
                      <input 
                        type="number"
                        min="1"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.numGuests}
                        onChange={e => setFormData({...formData, numGuests: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Check In Date</label>
                      <input 
                        required
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.checkIn}
                        onChange={e => setFormData({...formData, checkIn: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Check Out Date</label>
                      <input 
                        required
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.checkOut}
                        onChange={e => setFormData({...formData, checkOut: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Payment Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <CreditCard size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Payment Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Method</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.paymentMethod}
                        onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount Paid</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                        value={formData.amountPaid || ''}
                        onChange={e => setFormData({...formData, amountPaid: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance Due</span>
                      <span className={`text-lg font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ${balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Additional Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <AlertCircle size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Additional</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Special Requests</label>
                      <textarea 
                        rows={2}
                        placeholder="Late check-in, extra towels, etc."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all resize-none"
                        value={formData.specialRequests}
                        onChange={e => setFormData({...formData, specialRequests: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Internal Notes</label>
                      <textarea 
                        rows={2}
                        placeholder="Staff notes..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all resize-none"
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Nights</p>
                      <p className="text-xl font-bold">{nights}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Rate</p>
                      <p className="text-xl font-bold">${roomPrice}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Total Amount</p>
                      <p className="text-xl font-bold">${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} />
                  Complete Check-in / Confirm Booking
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function GuestsView({ 
  guests, 
  onAddGuest 
}: { 
  guests: Guest[]; 
  onAddGuest: (g: Omit<Guest, 'id' | 'lastStay' | 'totalSpent'>) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    address: '',
    nationality: '',
    idNumber: ''
  });

  const filteredGuests = useMemo(() => {
    return guests.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.includes(searchQuery)
    );
  }, [guests, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.email) return;
    onAddGuest(newGuest);
    setNewGuest({ 
      name: '', 
      email: '', 
      phone: '',
      address: '',
      nationality: '',
      idNumber: ''
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guest Directory</h1>
          <p className="text-slate-500 text-sm">Manage your hotel's guest database and history.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <UserPlus size={18} />
            Add Guest
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-all outline-none"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Guest Table - Technical Grid Recipe */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Guest Info</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact & ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Stay</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Spent</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <motion.tr 
                    layout
                    key={guest.id} 
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                          {guest.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{guest.name}</p>
                          <p className="text-[10px] text-slate-400">{guest.nationality || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          {guest.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone size={12} className="text-slate-400" />
                          {guest.phone}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {guest.idNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays size={14} className="text-slate-400" />
                        {guest.lastStay}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-indigo-600 font-bold font-mono">
                        <DollarSign size={14} />
                        {guest.totalSpent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg text-slate-400 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Search size={48} strokeWidth={1} />
                      <p className="font-medium">No guests found matching your search.</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-indigo-600 text-sm font-bold hover:underline"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guest Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus size={20} className="text-indigo-600" />
                  Add New Guest
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    placeholder="e.g. John Smith"
                    value={newGuest.name}
                    onChange={e => setNewGuest(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="john@example.com"
                      value={newGuest.email}
                      onChange={e => setNewGuest(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      value={newGuest.phone}
                      onChange={e => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nationality</label>
                  <input 
                    type="text" 
                    placeholder="e.g. American"
                    value={newGuest.nationality}
                    onChange={e => setNewGuest(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ID / Passport Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. A1234567"
                    value={newGuest.idNumber}
                    onChange={e => setNewGuest(prev => ({ ...prev, idNumber: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 123 Main St, NY"
                    value={newGuest.address}
                    onChange={e => setNewGuest(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm outline-none transition-all"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Save Guest
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BillingView({
  transactions,
  reservations,
  onAddTransaction,
  currentUser,
  logoUrl
}: {
  transactions: Transaction[];
  reservations: Reservation[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  currentUser: User;
  logoUrl: string | null;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResForReceipt, setSelectedResForReceipt] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reservationId: '',
    type: 'Restaurant' as TransactionType,
    description: '',
    amount: 0
  });

  const activeReservations = reservations.filter(r => r.status === 'Checked In' || r.status === 'Confirmed' || r.status === 'Checked Out');

  const totalRevenue = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPayments = transactions
    .filter(t => t.status === 'Pending' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reservations.find(r => r.id === formData.reservationId);
    if (!res) return;

    const finalAmount = formData.type === 'Deposit' ? -Math.abs(formData.amount) : Math.abs(formData.amount);

    onAddTransaction({
      reservationId: formData.reservationId,
      guestName: res.guestName,
      type: formData.type,
      description: formData.description,
      amount: finalAmount
    });
    setIsModalOpen(false);
    setFormData({ reservationId: '', type: 'Restaurant', description: '', amount: 0 });
  };

  const handlePrintReceipt = (resId: string) => {
    setSelectedResForReceipt(resId);
  };

  const receiptRes = reservations.find(r => r.id === selectedResForReceipt);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Billing & Finance</h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">Export PDF</button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            New Transaction
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
          <p className="text-indigo-100 text-sm font-medium">Total Revenue (MTD)</p>
          <h3 className="text-3xl font-bold mt-2">${totalRevenue.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-indigo-500/50 w-fit px-2 py-1 rounded-lg">
            <CheckCircle2 size={14} />
            Real-time data
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Pending Payments</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">${pendingPayments.toLocaleString()}</h3>
          <p className="text-amber-600 text-xs font-bold mt-4 flex items-center gap-1">
            <Clock size={14} /> Unsettled bills
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Average Daily Rate</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">$185.50</h3>
          <p className="text-emerald-600 text-xs font-bold mt-4 flex items-center gap-1">
            <CheckCircle2 size={14} /> Optimal pricing
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
          <div className="flex gap-2">
            <select 
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none"
              onChange={(e) => handlePrintReceipt(e.target.value)}
              value=""
            >
              <option value="" disabled>Print Receipt for...</option>
              {activeReservations.map(res => (
                <option key={res.id} value={res.id}>{res.guestName} (Room {res.roomNumber})</option>
              ))}
            </select>
          </div>
        </div>
        <table className="data-grid">
          <thead>
            <tr>
              <th className="data-header">Date</th>
              <th className="data-header">Description</th>
              <th className="data-header">Guest</th>
              <th className="data-header">Type</th>
              <th className="data-header">Status</th>
              <th className="data-header text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="data-row">
                <td className="data-cell text-slate-500 text-xs">{t.date}</td>
                <td className="data-cell font-medium">{t.description}</td>
                <td className="data-cell text-slate-600">{t.guestName}</td>
                <td className="data-cell">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.type}</span>
                </td>
                <td className="data-cell">
                  <span className={`status-badge ${t.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.status}
                  </span>
                </td>
                <td className={`data-cell text-right font-mono font-bold ${t.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {t.amount < 0 ? `-$${Math.abs(t.amount)}` : `$${t.amount}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedResForReceipt && receiptRes && (
        <InvoiceModal
          reservation={receiptRes}
          hotelUser={currentUser}
          logoUrl={logoUrl}
          onClose={() => setSelectedResForReceipt(null)}
        />
      )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">New Transaction</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Reservation / Guest</label>
                  <select 
                    required
                    className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={formData.reservationId}
                    onChange={e => setFormData({...formData, reservationId: e.target.value})}
                  >
                    <option value="">Select Reservation</option>
                    {activeReservations.map(res => (
                      <option key={res.id} value={res.id}>{res.guestName} (Room {res.roomNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Service Type</label>
                  <select 
                    className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                  >
                    <option>Restaurant</option>
                    <option>Laundry</option>
                    <option>Spa</option>
                    <option>Deposit</option>
                    <option>Refund</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <input 
                    required
                    placeholder="e.g. Dinner at Blue Grill"
                    className="w-full mt-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      value={formData.amount || ''}
                      onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                  Post Transaction
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function HousekeepingView({ 
  rooms, 
  staff, 
  onUpdateStatus,
  onAssignStaff 
}: { 
  rooms: Room[]; 
  staff: Staff[];
  onUpdateStatus: (id: string, status: Room['status']) => void;
  onAssignStaff: (roomId: string, staffId: string) => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const housekeepers = staff.filter(s => s.role === 'Housekeeper');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Housekeeping</h1>
          <p className="text-slate-500">Track room cleaning and maintenance status.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Available
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Dirty
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Occupied
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-red-500"></div> Maint.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {rooms.map((room) => (
          <div 
            key={room.id} 
            onClick={() => setSelectedRoom(room)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.02] ${
              selectedRoom?.id === room.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
            } ${
              room.status === 'Available' ? 'bg-white border-emerald-100 hover:border-emerald-500' :
              room.status === 'Dirty' ? 'bg-white border-amber-100 hover:border-amber-500' :
              room.status === 'Occupied' ? 'bg-white border-indigo-100 hover:border-indigo-500' :
              'bg-white border-red-100 hover:border-red-500'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-lg font-bold text-slate-900">{room.number}</span>
              {room.status === 'Available' && <CheckCircle2 className="text-emerald-500" size={18} />}
              {room.status === 'Dirty' && <AlertCircle className="text-amber-500" size={18} />}
              {room.status === 'Occupied' && <Users className="text-indigo-500" size={18} />}
              {room.status === 'Maintenance' && <Wrench className="text-red-500" size={18} />}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{room.type}</p>
            <div className="mt-4 flex flex-col gap-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                room.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                room.status === 'Dirty' ? 'bg-amber-50 text-amber-700' :
                room.status === 'Occupied' ? 'bg-indigo-50 text-indigo-700' :
                'bg-red-50 text-red-700'
              }`}>
                {room.status}
              </span>
              {room.assignedStaffId && (
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {staff.find(s => s.id === room.assignedStaffId)?.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoom(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[51] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Room {selectedRoom.number} Details</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedRoom.type} Room</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Update Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Available', 'Dirty', 'Occupied', 'Maintenance'] as Room['status'][]).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          onUpdateStatus(selectedRoom.id, status);
                          setSelectedRoom(prev => prev ? { ...prev, status } : null);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          selectedRoom.status === status 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assign Staff</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    value={selectedRoom.assignedStaffId || ''}
                    onChange={(e) => {
                      onAssignStaff(selectedRoom.id, e.target.value);
                      setSelectedRoom(prev => prev ? { ...prev, assignedStaffId: e.target.value } : null);
                    }}
                  >
                    <option value="">Unassigned</option>
                    {housekeepers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Last Cleaned:</span>
                    <span className="text-slate-900 font-bold">{selectedRoom.lastCleaned || 'Never'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Current Status:</span>
                    <span className={`font-bold ${
                      selectedRoom.status === 'Available' ? 'text-emerald-600' :
                      selectedRoom.status === 'Dirty' ? 'text-amber-600' :
                      selectedRoom.status === 'Occupied' ? 'text-indigo-600' :
                      'text-red-600'
                    }`}>{selectedRoom.status}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl">
            <Wrench size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900">Maintenance Alert</h3>
            <p className="text-indigo-700 text-sm">Room 202 requires AC filter replacement. Scheduled for 2:00 PM today.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ 
  rooms, 
  reservations, 
  guests, 
  transactions 
}: { 
  rooms: Room[]; 
  reservations: Reservation[]; 
  guests: Guest[]; 
  transactions: Transaction[];
}) {
  const totalRevenue = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const occupancyRate = Math.round((rooms.filter(r => r.status === 'Occupied').length / rooms.length) * 100);
  const totalGuests = guests.length;

  // Revenue by Type for Bar Chart
  const revenueByType = transactions
    .filter(t => t.amount > 0)
    .reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(revenueByType).map(([name, value]) => ({ name, value }));
  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500">Performance metrics and financial insights.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50">
          <Download size={18} />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Revenue</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</h3>
          <p className="text-xs text-emerald-600 font-bold mt-2">+12.5% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Occupancy Rate</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{occupancyRate}%</h3>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Guests</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{totalGuests}</h3>
          <p className="text-xs text-slate-400 font-bold mt-2">Active in directory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-600" />
            Revenue by Service Type
          </h3>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {chartData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative flex flex-col justify-end h-48">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.value / maxVal) * 100}%` }}
                    className="w-full bg-indigo-500 rounded-t-lg group-hover:bg-indigo-600 transition-colors relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${item.value}
                    </div>
                  </motion.div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <PieChart size={20} className="text-emerald-600" />
            Room Status Distribution
          </h3>
          <div className="flex items-center justify-center h-64 relative">
            <svg viewBox="0 0 100 100" className="w-48 h-48 -rotate-90">
              {(() => {
                let currentOffset = 0;
                const statuses = [
                  { label: 'Available', count: rooms.filter(r => r.status === 'Available').length, color: '#10b981' },
                  { label: 'Occupied', count: rooms.filter(r => r.status === 'Occupied').length, color: '#6366f1' },
                  { label: 'Dirty', count: rooms.filter(r => r.status === 'Dirty').length, color: '#f59e0b' },
                  { label: 'Maintenance', count: rooms.filter(r => r.status === 'Maintenance').length, color: '#ef4444' },
                ];
                const total = rooms.length;
                
                return statuses.map((s, i) => {
                  const percentage = (s.count / total) * 100;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = -currentOffset;
                  currentOffset += percentage;
                  
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={s.color}
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{rooms.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rooms</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Available', color: 'bg-emerald-500' },
              { label: 'Occupied', color: 'bg-indigo-500' },
              { label: 'Dirty', color: 'bg-amber-500' },
              { label: 'Maintenance', color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

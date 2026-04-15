import { supabase } from './supabase';

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin`;

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json as T;
}

export const superAdminApi = {
  getStats: () => call<{
    totalUsers: number;
    totalRevenue: number;
    totalInvoices: number;
    totalPromos: number;
    totalBookings: number;
  }>('/stats'),

  getUsers: () => call<{ users: AdminUser[] }>('/users'),

  updateUserPlan: (id: string, plan: string) =>
    call('/users/' + id + '/plan', 'POST', { plan }),

  updateUserStatus: (id: string, status: string) =>
    call('/users/' + id + '/status', 'POST', { status }),

  getAnalytics: () => call<{
    last30Days: { date: string; users: number; revenue: number }[]
  }>('/analytics'),

  createPromo: (data: CreatePromoPayload) =>
    call<{ promo: PromoCode }>('/promo-codes', 'POST', data),

  deletePromo: (id: string) =>
    call('/promo-codes/' + id, 'DELETE'),

  togglePromo: (id: string, is_active: boolean) =>
    call('/promo-codes/' + id, 'PATCH', { is_active }),

  sendNotification: (title: string, message: string) =>
    call('/notifications', 'POST', { title, message }),

  getSettings: () => call<{ settings: Record<string, string> }>('/settings'),

  updateSettings: (updates: Record<string, string>) =>
    call('/settings', 'PATCH', updates),
};

export interface AdminUser {
  id: string;
  email: string;
  hotelName: string;
  managerName: string;
  plan: string;
  status: string;
  createdAt: string;
  lastSignIn: string | null;
  phone: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expires_at: string | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CreatePromoPayload {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expires_at?: string;
  max_uses?: number;
}

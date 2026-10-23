// Thin typed query hooks on top of the api client. Keeps call sites honest
// about what they ask the server for.

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from './api';

export type SearchHit = {
  id: string;
  kind: 'PRODUCT' | 'SUPPLIER' | 'WORKER' | 'VEHICLE' | 'FIRM' | 'TENDER';
  refId: string;
  title: string;
  body: string | null;
  brand: string | null;
  category: string | null;
  city: string | null;
  priceSar: number | null;
  rating: number;
  verified: boolean;
  inStock: boolean;
  isSponsored: boolean;
  score: number;
};

export type SearchResult = {
  total: number;
  hits: SearchHit[];
  facets: {
    kinds: Record<string, number>;
    brands: Array<{ value: string; count: number }>;
    categories: Array<{ value: string; count: number }>;
    cities: Array<{ value: string; count: number }>;
  };
  tookMs: number;
};

export function useSearch(
  params: {
    q: string;
    kinds?: string[];
    city?: string;
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
  },
  opts?: Pick<UseQueryOptions<SearchResult>, 'enabled'>
) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.kinds?.length) params.kinds.forEach((k) => search.append('kinds', k));
  if (params.city) search.set('city', params.city);
  if (params.priceMin != null) search.set('priceMin', String(params.priceMin));
  if (params.priceMax != null) search.set('priceMax', String(params.priceMax));
  if (params.ratingMin != null) search.set('ratingMin', String(params.ratingMin));
  const query = search.toString();
  return useQuery<SearchResult>({
    queryKey: ['search', query],
    queryFn: () => api<SearchResult>(`/api/search?${query}`),
    staleTime: 15_000,
    enabled: opts?.enabled ?? true,
  });
}

export type AutocompleteHit = { title: string; kind: SearchHit['kind']; refId: string };

export function useAutocomplete(prefix: string) {
  const q = prefix.trim();
  return useQuery<{ hits: AutocompleteHit[]; tookMs: number }>({
    queryKey: ['autocomplete', q],
    queryFn: () => api(`/api/search/autocomplete?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
    staleTime: 10_000,
  });
}

export type OrderRow = {
  id: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
  payment: { paymentStatus: string | null; paymentMethod: string | null } | null;
};

export function useMyOrders() {
  return useQuery<{ orders: OrderRow[] }>({
    queryKey: ['orders', 'me'],
    queryFn: () => api('/api/orders'),
  });
}

export function useMessageThreads() {
  return useQuery<{
    threads: Array<{
      id: string;
      counterpart: { id: string; name: string } | null;
      lastMessage: string;
      lastAt: string;
      unread: number;
    }>;
  }>({
    queryKey: ['messages', 'threads'],
    queryFn: () => api('/api/messages'),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useWallet() {
  return useQuery<{
    wallet: { balance: number; reserved: number; currency: string };
    entries: Array<{ id: string; amount: number; direction: 'IN' | 'OUT'; reason: string; createdAt: string }>;
    holds: Array<{ id: string; amount: number; status: string; role: 'PAYER' | 'PAYEE' }>;
  }>({
    queryKey: ['wallet', 'me'],
    queryFn: () => api('/api/wallet'),
  });
}

export function useEstimatorQuota() {
  return useQuery<{
    quota: {
      allowed: boolean;
      reason: string;
      usedThisMonth: number;
      limit: number | 'unlimited';
      nextReset?: string;
    };
  }>({
    queryKey: ['estimator', 'quota'],
    queryFn: () => api('/api/me/estimator-quota'),
  });
}

// Role-aware analytics for the mobile dashboard screen (SRS §15.6 ANL).
export function useAnalyticsMe(windowDays: number = 30) {
  return useQuery<{
    windowDays: number;
    role: string;
    unreadNotifications: number;
    scopedMetrics: Record<string, unknown>;
    eventActivity: Array<{ event: string; count: number }>;
    recentEvents: Array<{
      id: string;
      event: string;
      createdAt: string;
      properties: unknown;
    }>;
  }>({
    queryKey: ['analytics', 'me', windowDays],
    queryFn: () => api(`/api/analytics/me?days=${windowDays}`),
    staleTime: 30_000,
  });
}

export function useNotificationList() {
  return useQuery<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      body: string | null;
      readAt: string | null;
      createdAt: string;
    }>;
  }>({
    queryKey: ['notifications'],
    queryFn: () => api('/api/notifications'),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useSupplierDashboard() {
  return useQuery<{
    recentOrders: Array<{
      id: string;
      customer: string;
      items: string;
      total: number | null;
      status: string;
      createdAt: string;
    }>;
    products: Array<{
      id: string;
      name: string;
      stock: number;
      price: number | null;
      lowStock: boolean;
    }>;
    stats: {
      totalProducts: number;
      lowStockProducts: number;
      pendingOrders: number;
    };
  }>({
    queryKey: ['supplier', 'dashboard'],
    queryFn: () => api('/api/supplier/dashboard'),
  });
}

export function useOwnerDashboard() {
  return useQuery<{
    projects: Array<{
      id: string;
      name: string;
      location: string | null;
      status: string;
      budget: number | null;
      milestonesCount: number;
      tendersCount: number;
      bidsCount: number;
      createdAt: string;
    }>;
    tenders: Array<{
      id: string;
      title: string;
      status: string;
      bidsCount: number;
      projectName: string;
      createdAt: string;
    }>;
    stats: {
      activeProjects: number;
      openTenders: number;
      newBids: number;
      unreadNotifications: number;
      totalBudget: number;
    };
  }>({
    queryKey: ['owner', 'dashboard'],
    queryFn: () => api('/api/owner/dashboard'),
  });
}

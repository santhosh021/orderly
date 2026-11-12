import type { AuthResponse, Order, OrderStatus, Product, ProductInput } from './types';

const BASE = '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: { message?: string } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    // token expired or invalid: clear the session and go to the login page
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new ApiError(res.status, data?.message ?? res.statusText ?? 'Request failed');
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  products: (q?: string) => request<Product[]>(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  createProduct: (input: ProductInput) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),

  updateProduct: (id: number, input: ProductInput) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  placeOrder: (items: { productId: number; quantity: number }[]) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify({ items }) }),

  myOrders: () => request<Order[]>('/orders'),

  allOrders: () => request<Order[]>('/orders/all'),

  cancelOrder: (id: number) => request<Order>(`/orders/${id}/cancel`, { method: 'PATCH' }),

  updateStatus: (id: number, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

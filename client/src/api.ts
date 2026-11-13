import type { AuthResponse, Order, OrderStatus, Product, ProductInput } from './types';

const BASE = '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parse(text: string): { message?: string } | null {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...authHeader() };

  const res = await fetch(BASE + path, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const data = parse(await res.text());

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

  products: () => request<Product[]>('/products'),

  product: (id: number) => request<Product>(`/products/${id}`),

  createProduct: (input: ProductInput) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),

  updateProduct: (id: number, input: ProductInput) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  /** Uploads an image file and returns its URL (admin only). */
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const body = new FormData();
    body.append('file', file);
    // no Content-Type header: the browser sets the multipart boundary itself
    const res = await fetch(`${BASE}/products/images`, { method: 'POST', headers: authHeader(), body });
    const data = parse(await res.text());
    if (!res.ok) {
      throw new ApiError(res.status, data?.message ?? 'Image upload failed (the file may be too large)');
    }
    return data as unknown as { url: string };
  },

  placeOrder: (items: { productId: number; quantity: number }[]) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify({ items }) }),

  myOrders: () => request<Order[]>('/orders'),

  allOrders: () => request<Order[]>('/orders/all'),

  cancelOrder: (id: number) => request<Order>(`/orders/${id}/cancel`, { method: 'PATCH' }),

  updateStatus: (id: number, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
}

export interface ProductInput {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  stock: number;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  userId: number;
  userEmail: string | null;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

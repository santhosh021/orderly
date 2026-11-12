import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from './types';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  add: (product: Product) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = (product: Product) =>
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: Math.min(l.quantity + 1, product.stock) } : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

  const setQuantity = (productId: number, quantity: number) =>
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(1, quantity) } : l)),
    );

  const remove = (productId: number) => setLines((prev) => prev.filter((l) => l.product.id !== productId));
  const clear = () => setLines([]);

  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, add, setQuantity, remove, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

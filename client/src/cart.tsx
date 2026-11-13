import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from './types';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'cart';

function loadLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadLines);

  // keep the cart when the page is refreshed or the visitor comes back later
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage not available: the cart simply lives in memory
    }
  }, [lines]);

  const add = (product: Product, quantity = 1) =>
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id
            ? { product, quantity: Math.min(l.quantity + quantity, product.stock) }
            : l,
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });

  const setQuantity = (productId: number, quantity: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId
          ? { ...l, quantity: Math.max(1, Math.min(quantity, l.product.stock)) }
          : l,
      ),
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

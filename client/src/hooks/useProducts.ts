import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Product } from '../types';

/** Loads the whole catalog once; pages filter and sort it in the browser. */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setProducts(await api.products());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { products, loading, error, reload };
}

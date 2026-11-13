import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';

export default function ShopPage() {
  const { products, loading, error } = useProducts();
  const [params, setParams] = useSearchParams();

  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';
  const sort = (params.get('sort') ?? 'featured') as Sort;
  const inStockOnly = params.get('stock') === '1';

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  };

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (inStockOnly && p.stock === 0) return false;
      if (term && !`${p.name} ${p.description ?? ''} ${p.category ?? ''}`.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, inStockOnly, q, sort]);

  const hasFilters = category !== '' || q !== '' || inStockOnly;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{category || 'All products'}</h1>
          <p className="muted">
            {loading ? 'Loading...' : `${visible.length} item${visible.length === 1 ? '' : 's'}`}
            {q && ` matching "${q}"`}
          </p>
        </div>
        <div className="toolbar">
          <input
            className="search"
            placeholder="Search products..."
            value={q}
            onChange={(e) => update({ q: e.target.value })}
          />
          <select value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="shop-layout">
        <aside className="filters card">
          <h4>Categories</h4>
          <button className={category === '' ? 'filter-item active' : 'filter-item'} onClick={() => update({ category: null })}>
            <span>All</span>
            <span className="muted">{products.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              className={category === c.name ? 'filter-item active' : 'filter-item'}
              onClick={() => update({ category: c.name })}
            >
              <span>{c.name}</span>
              <span className="muted">{c.count}</span>
            </button>
          ))}
          <label className="check">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => update({ stock: e.target.checked ? '1' : null })} />
            <span>In stock only</span>
          </label>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          )}
        </aside>

        <div>
          <div className="grid">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)
              : visible.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {!loading && visible.length === 0 && !error && (
            <div className="empty">
              <h3>No products found</h3>
              <p className="muted">Try a different search or clear the filters.</p>
              <Link to="/shop" className="btn btn-primary">
                See all products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

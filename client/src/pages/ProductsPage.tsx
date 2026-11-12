import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import { money } from '../format';
import type { Product, ProductInput } from '../types';

const emptyForm: ProductInput = { name: '', description: '', price: 0, stock: 0 };

function stockInfo(stock: number): { text: string; cls: string } {
  if (stock === 0) return { text: 'Out of stock', cls: 'out' };
  if (stock <= 5) return { text: `Only ${stock} left`, cls: 'low' };
  return { text: `${stock} in stock`, cls: 'ok' };
}

export default function ProductsPage() {
  const { user } = useAuth();
  const { add } = useCart();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      setProducts(await api.products(q));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load products');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description ?? '', price: p.price, stock: p.stock });
    setShowForm(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId === null) await api.createProduct(form);
      else await api.updateProduct(editingId, form);
      setShowForm(false);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete product');
    }
  };

  const handleAdd = (p: Product) => {
    add(p);
    setJustAdded(p.id);
    window.setTimeout(() => setJustAdded((cur) => (cur === p.id ? null : cur)), 1200);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="muted">{products.length} item{products.length === 1 ? '' : 's'} available</p>
        </div>
        <div className="toolbar">
          <input
            className="search"
            placeholder="Search products..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              void load(e.target.value);
            }}
          />
          {isAdmin && (
            <button className="btn btn-primary" onClick={startCreate}>
              + Add product
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {isAdmin && showForm && (
        <form className="card form form-card" onSubmit={save}>
          <h3>{editingId === null ? 'New product' : 'Edit product'}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Description</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Price (₹)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
              />
            </label>
            <label className="field">
              <span>Stock</span>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                required
              />
            </label>
          </div>
          <div className="row">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid">
        {products.map((p) => {
          const info = stockInfo(p.stock);
          return (
            <div className="card product-card" key={p.id}>
              <div className="thumb" style={{ '--hue': String((p.id * 47) % 360) } as CSSProperties}>
                {p.name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="product-body">
                <div className="row between">
                  <h3>{p.name}</h3>
                  <span className={`pill ${info.cls}`}>{info.text}</span>
                </div>
                <p className="desc">{p.description}</p>
                <div className="price">{money(p.price)}</div>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-primary grow"
                  disabled={p.stock === 0}
                  onClick={() => handleAdd(p)}
                >
                  {justAdded === p.id ? 'Added' : 'Add to cart'}
                </button>
                {isAdmin && (
                  <>
                    <button className="btn btn-ghost" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => void remove(p.id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !error && (
        <div className="empty">
          <h3>No products found</h3>
          <p className="muted">Try a different search term.</p>
        </div>
      )}
    </div>
  );
}

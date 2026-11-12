import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import type { Product, ProductInput } from '../types';

const emptyForm: ProductInput = { name: '', description: '', price: 0, stock: 0 };

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

  return (
    <div>
      <div className="row">
        <h2>Products</h2>
        <span className="spacer" />
        <input
          placeholder="Search by name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            void load(e.target.value);
          }}
        />
        {isAdmin && <button onClick={startCreate}>Add product</button>}
      </div>

      {error && <p className="error">{error}</p>}

      {isAdmin && showForm && (
        <form className="card form" onSubmit={save}>
          <h3>{editingId === null ? 'New product' : 'Edit product'}</h3>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            required
          />
          <div className="row">
            <button type="submit">Save</button>
            <button type="button" className="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid">
        {products.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <p className="muted">{p.description}</p>
            <p className="price">Rs. {p.price.toLocaleString('en-IN')}</p>
            <p className={p.stock > 0 ? 'muted' : 'error'}>
              {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
            </p>
            <div className="row">
              <button disabled={p.stock === 0} onClick={() => add(p)}>
                Add to cart
              </button>
              {isAdmin && (
                <>
                  <button className="secondary" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => void remove(p.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && !error && <p className="muted">No products found.</p>}
    </div>
  );
}

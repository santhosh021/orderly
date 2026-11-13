import { useCallback, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { api } from '../../api';
import AdminTabs from '../../components/AdminTabs';
import { UploadIcon } from '../../components/Icons';
import Modal from '../../components/Modal';
import { stockInfo } from '../../components/ProductCard';
import ProductImage from '../../components/ProductImage';
import { money } from '../../format';
import { useProducts } from '../../hooks/useProducts';
import { useToast } from '../../toast';
import type { Product, ProductInput } from '../../types';

const emptyForm: ProductInput = { name: '', description: '', category: '', imageUrl: '', price: 0, stock: 0 };
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface FormProps {
  product: Product | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}

/** Add / edit dialog, including image upload or an image link. */
function ProductFormModal({ product, categories, onClose, onSaved }: FormProps) {
  const { notify } = useToast();
  const [form, setForm] = useState<ProductInput>(
    product
      ? {
          name: product.name,
          description: product.description ?? '',
          category: product.category ?? '',
          imageUrl: product.imageUrl ?? '',
          price: product.price,
          stock: product.stock,
        }
      : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const chooseFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WEBP or GIF images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The image must be smaller than 5 MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (product) await api.updateProduct(product.id, form);
      else await api.createProduct(form);
      notify(product ? 'Product updated' : 'Product added');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={product ? 'Edit product' : 'Add product'}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save product'}
          </button>
        </>
      }
    >
      <form id="product-form" className="form" onSubmit={submit}>
        <div className="image-field">
          <div className="image-preview">
            {form.imageUrl ? (
              <ProductImage product={{ id: product?.id ?? 0, name: form.name || 'Preview', imageUrl: form.imageUrl }} />
            ) : (
              <span className="muted">No image</span>
            )}
          </div>
          <div className="image-controls">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => void chooseFile(e)}
            />
            <div className="row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <UploadIcon />
                {uploading ? 'Uploading...' : 'Upload image'}
              </button>
              {form.imageUrl && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setForm({ ...form, imageUrl: '' })}>
                  Remove
                </button>
              )}
            </div>
            <label className="field">
              <span>or paste an image link</span>
              <input
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </label>
            <span className="hint">JPG, PNG, WEBP or GIF, up to 5 MB.</span>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field">
            <span>Category</span>
            <input
              list="category-options"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Audio"
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        {error && <div className="alert error">{error}</div>}
      </form>
    </Modal>
  );
}

export default function AdminProductsPage() {
  const { products, loading, error, reload } = useProducts();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const closeEditor = useCallback(() => setEditing(null), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))).sort(),
    [products],
  );

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? products.filter((p) => `${p.name} ${p.category ?? ''}`.toLowerCase().includes(term)) : products;
  }, [products, search]);

  const outCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteProduct(deleting.id);
      notify('Product deleted');
      setDeleting(null);
      await reload();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete the product', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminTabs />
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="muted">Manage your catalog, prices, stock and pictures.</p>
        </div>
        <div className="toolbar">
          <input className="search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add product
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="muted">Total products</span>
          <strong>{products.length}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Low stock</span>
          <strong>{lowCount}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Out of stock</span>
          <strong>{outCount}</strong>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const info = stockInfo(p.stock);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="thumb-cell">
                      <div className="t-thumb">
                        <ProductImage product={p} />
                      </div>
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>{p.category ?? <span className="muted">-</span>}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span className={`pill ${info.cls}`}>{p.stock}</span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleting(p)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && shown.length === 0 && <p className="muted table-empty">No products found.</p>}
      </div>

      {editing !== null && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={closeEditor}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}

      {deleting && (
        <Modal
          title="Delete product"
          onClose={closeDelete}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeDelete}>
                Cancel
              </button>
              <button className="btn btn-danger-solid" onClick={() => void confirmDelete()} disabled={busy}>
                {busy ? 'Deleting...' : 'Delete'}
              </button>
            </>
          }
        >
          <p>
            Delete <strong>{deleting.name}</strong>? Existing orders keep their own copy of the name and price.
          </p>
        </Modal>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useCart } from '../cart';
import ProductCard, { stockInfo } from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import { money } from '../format';
import { useProducts } from '../hooks/useProducts';
import { useToast } from '../toast';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { add } = useCart();
  const { notify } = useToast();
  const { products } = useProducts();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    setQty(1);
    if (!Number.isFinite(productId)) {
      setError('Product not found');
      setLoading(false);
      return;
    }
    api
      .product(productId)
      .then((p) => {
        setProduct(p);
        setError('');
      })
      .catch((err) => {
        setProduct(null);
        setError(err instanceof ApiError && err.status === 404 ? 'Product not found' : 'Could not load this product');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const related = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter((p) => p.id !== product.id && p.category && p.category === product.category);
    const others = products.filter((p) => p.id !== product.id && !sameCategory.includes(p));
    return [...sameCategory, ...others].slice(0, 4);
  }, [products, product]);

  if (loading) {
    return (
      <div className="detail">
        <div className="detail-media skeleton" />
        <div className="detail-info">
          <div className="skeleton line" />
          <div className="skeleton line short" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty">
        <h3>{error || 'Product not found'}</h3>
        <Link to="/shop" className="btn btn-primary">
          Back to shop
        </Link>
      </div>
    );
  }

  const info = stockInfo(product.stock);
  const soldOut = product.stock === 0;

  return (
    <div>
      <nav className="breadcrumb">
        <Link to="/shop">Shop</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          </>
        )}
        <span>/</span>
        <span className="muted">{product.name}</span>
      </nav>

      <div className="detail">
        <div className="detail-media">
          <ProductImage product={product} />
        </div>
        <div className="detail-info">
          {product.category && <span className="eyebrow">{product.category}</span>}
          <h1>{product.name}</h1>
          <div className="detail-price">{money(product.price)}</div>
          <span className={`pill ${info.cls}`}>{soldOut ? info.text : `${info.text} (${product.stock} available)`}</span>
          <p className="detail-desc">{product.description || 'No description available.'}</p>

          <div className="detail-actions">
            <div className="stepper">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
                -
              </button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              className="btn btn-primary btn-lg"
              disabled={soldOut}
              onClick={() => {
                add(product, qty);
                notify(`${product.name} added to cart`);
              }}
            >
              Add to cart
            </button>
            <button
              className="btn btn-ghost btn-lg"
              disabled={soldOut}
              onClick={() => {
                add(product, qty);
                navigate('/cart');
              }}
            >
              Buy now
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>You may also like</h2>
          </div>
          <div className="grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useCart } from '../cart';
import { money } from '../format';
import { useToast } from '../toast';
import type { Product } from '../types';
import ProductImage from './ProductImage';

export function stockInfo(stock: number): { text: string; cls: string } {
  if (stock === 0) return { text: 'Out of stock', cls: 'out' };
  if (stock <= 5) return { text: `Only ${stock} left`, cls: 'low' };
  return { text: 'In stock', cls: 'ok' };
}

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { notify } = useToast();
  const info = stockInfo(product.stock);

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="pc-media">
        <ProductImage product={product} />
        {product.category && <span className="pc-tag">{product.category}</span>}
        <span className={`pill pc-stock ${info.cls}`}>{info.text}</span>
      </Link>
      <div className="pc-body">
        <Link to={`/product/${product.id}`} className="pc-title">
          {product.name}
        </Link>
        <p className="pc-desc">{product.description}</p>
        <div className="pc-foot">
          <span className="price">{money(product.price)}</span>
          <button
            className="btn btn-primary btn-sm"
            disabled={product.stock === 0}
            onClick={() => {
              add(product);
              notify(`${product.name} added to cart`);
            }}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card" aria-hidden="true">
      <div className="pc-media skeleton" />
      <div className="pc-body">
        <div className="skeleton line" />
        <div className="skeleton line short" />
      </div>
    </div>
  );
}

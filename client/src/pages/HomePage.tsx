import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { BoxIcon, CategoryIcon, ShieldIcon, TruckIcon } from '../components/Icons';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import { money } from '../format';
import { useProducts } from '../hooks/useProducts';

export default function HomePage() {
  const { user } = useAuth();
  const { products, loading, error } = useProducts();

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const featured = useMemo(() => products.filter((p) => p.stock > 0).slice(0, 8), [products]);
  const collage = useMemo(() => products.filter((p) => p.imageUrl).slice(0, 3), [products]);

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">Welcome to Orderly</span>
          <h1>
            Shop smarter.
            <br />
            Order in seconds.
          </h1>
          <p>Browse the catalog, see live stock levels and follow every order from placement to delivery.</p>
          <div className="row">
            <Link to="/shop" className="btn btn-primary btn-lg">
              Shop now
            </Link>
            {!user && (
              <Link to="/login" state={{ mode: 'register' }} className="btn btn-ghost btn-lg">
                Create account
              </Link>
            )}
          </div>
          {!loading && products.length > 0 && (
            <div className="hero-stats">
              <div>
                <strong>{products.length}</strong>
                <span>Products</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>Categories</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>Stock updates</span>
              </div>
            </div>
          )}
        </div>

        <div className="hero-visual" aria-hidden={collage.length === 0}>
          <div className="blob b1" />
          <div className="blob b2" />
          {collage.map((p, i) => (
            <Link key={p.id} to={`/product/${p.id}`} className={`collage c${i + 1}`}>
              <ProductImage product={p} />
              <span className="collage-price">{money(p.price)}</span>
            </Link>
          ))}
        </div>
      </section>

      {error && <div className="alert error">{error}</div>}

      {/* ===== Categories ===== */}
      {categories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Shop by category</h2>
          </div>
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="category-tile">
                <span className="category-icon">
                  <CategoryIcon name={c.name} />
                </span>
                <strong>{c.name}</strong>
                <span className="muted">
                  {c.count} product{c.count === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Featured ===== */}
      <section className="section">
        <div className="section-head">
          <h2>Featured products</h2>
          <Link to="/shop" className="link-more">
            View all
          </Link>
        </div>
        <div className="grid">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="section">
        <div className="feature-grid">
          <div className="feature">
            <span className="feature-icon">
              <BoxIcon />
            </span>
            <h3>Live stock</h3>
            <p className="muted">Quantities are checked and reserved the moment you place an order.</p>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <ShieldIcon />
            </span>
            <h3>Secure sign-in</h3>
            <p className="muted">Passwords are stored hashed and every request is verified with a signed token.</p>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <TruckIcon />
            </span>
            <h3>Order tracking</h3>
            <p className="muted">Follow each order from placed and confirmed to shipped and delivered.</p>
          </div>
        </div>
      </section>

      {/* ===== Call to action ===== */}
      <section className="cta">
        <div>
          <h2>{user ? 'Check on your orders' : 'Ready to place your first order?'}</h2>
          <p>
            {user
              ? 'See the status of everything you have ordered so far.'
              : 'Create a free account and start shopping in a minute.'}
          </p>
        </div>
        {user ? (
          <Link to="/orders" className="btn btn-light btn-lg">
            My orders
          </Link>
        ) : (
          <Link to="/login" state={{ mode: 'register' }} className="btn btn-light btn-lg">
            Create account
          </Link>
        )}
      </section>
    </div>
  );
}

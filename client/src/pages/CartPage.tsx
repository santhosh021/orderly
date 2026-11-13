import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import ProductImage from '../components/ProductImage';
import { money } from '../format';
import { useToast } from '../toast';

export default function CartPage() {
  const { user } = useAuth();
  const { lines, setQuantity, remove, clear, total, count } = useCart();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const placeOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.placeOrder(lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })));
      clear();
      notify('Order placed successfully');
      navigate('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order');
    } finally {
      setBusy(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Your cart</h1>
        </div>
        <div className="empty">
          <h3>Your cart is empty</h3>
          <p className="muted">Add a few products and they will show up here.</p>
          <Link to="/shop" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Your cart</h1>
          <p className="muted">
            {count} item{count === 1 ? '' : 's'}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clear}>
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <div className="card list-card">
          {lines.map((l) => (
            <div className="cart-line" key={l.product.id}>
              <Link to={`/product/${l.product.id}`} className="cart-thumb">
                <ProductImage product={l.product} />
              </Link>
              <div className="cart-info">
                <Link to={`/product/${l.product.id}`} className="cart-name">
                  {l.product.name}
                </Link>
                <span className="muted">{money(l.product.price)} each</span>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setQuantity(l.product.id, l.quantity - 1)}
                  disabled={l.quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span>{l.quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(l.product.id, l.quantity + 1)}
                  disabled={l.quantity >= l.product.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="line-total">{money(l.product.price * l.quantity)}</div>
              <button className="btn btn-danger btn-sm" onClick={() => remove(l.product.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span className="muted">Items</span>
            <span>{count}</span>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          {error && <div className="alert error">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" onClick={() => void placeOrder()} disabled={busy}>
            {busy ? 'Placing order...' : user ? 'Place order' : 'Sign in to order'}
          </button>
          <Link to="/shop" className="btn btn-ghost btn-block">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

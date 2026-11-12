import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../cart';
import { money } from '../format';

export default function CartPage() {
  const { lines, setQuantity, remove, clear, total, count } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const placeOrder = async () => {
    setError('');
    setBusy(true);
    try {
      await api.placeOrder(lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })));
      clear();
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
          <Link to="/" className="btn btn-primary">
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
      </div>

      <div className="cart-layout">
        <div className="card list-card">
          {lines.map((l) => (
            <div className="cart-line" key={l.product.id}>
              <div className="cart-info">
                <strong>{l.product.name}</strong>
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
          <button
            className="btn btn-primary btn-block"
            onClick={() => void placeOrder()}
            disabled={busy}
          >
            {busy ? 'Placing order...' : 'Place order'}
          </button>
        </aside>
      </div>
    </div>
  );
}

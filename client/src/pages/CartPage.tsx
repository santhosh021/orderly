import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../cart';

export default function CartPage() {
  const { lines, setQuantity, remove, clear, total } = useCart();
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
        <h2>Your cart</h2>
        <p className="muted">
          Your cart is empty. <Link to="/">Browse products</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Your cart</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.product.id}>
              <td>{l.product.name}</td>
              <td>Rs. {l.product.price.toLocaleString('en-IN')}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  max={l.product.stock}
                  value={l.quantity}
                  onChange={(e) => setQuantity(l.product.id, Number(e.target.value))}
                  className="qty"
                />
              </td>
              <td>Rs. {(l.product.price * l.quantity).toLocaleString('en-IN')}</td>
              <td>
                <button className="danger" onClick={() => remove(l.product.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="total">Total: Rs. {total.toLocaleString('en-IN')}</p>
      {error && <p className="error">{error}</p>}
      <button onClick={() => void placeOrder()} disabled={busy}>
        {busy ? 'Placing order...' : 'Place order'}
      </button>
    </div>
  );
}

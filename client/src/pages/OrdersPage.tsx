import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import type { Order, OrderStatus } from '../types';

// Same rules as the backend state machine; used only to decide which buttons to show.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setOrders(isAdmin ? await api.allOrders() : await api.myOrders());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders');
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = async (order: Order, status: OrderStatus) => {
    try {
      if (status === 'CANCELLED') await api.cancelOrder(order.id);
      else await api.updateStatus(order.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the order');
    }
  };

  return (
    <div>
      <h2>{isAdmin ? 'All orders' : 'My orders'}</h2>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && !error && <p className="muted">No orders yet.</p>}

      {orders.map((o) => (
        <div className="card" key={o.id}>
          <div className="row">
            <strong>Order #{o.id}</strong>
            <span className={`badge ${o.status}`}>{o.status}</span>
            <span className="spacer" />
            <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
          </div>
          {isAdmin && <p className="muted">Customer: {o.userEmail ?? `user ${o.userId}`}</p>}
          <ul>
            {o.items.map((i) => (
              <li key={i.productId}>
                {i.productName} x {i.quantity} = Rs. {i.subtotal.toLocaleString('en-IN')}
              </li>
            ))}
          </ul>
          <p className="total">Total: Rs. {o.totalAmount.toLocaleString('en-IN')}</p>
          <div className="row">
            {NEXT[o.status]
              .filter((s) => isAdmin || s === 'CANCELLED')
              .map((s) => (
                <button
                  key={s}
                  className={s === 'CANCELLED' ? 'danger' : ''}
                  onClick={() => void change(o, s)}
                >
                  {s === 'CANCELLED' ? 'Cancel order' : `Mark ${s.toLowerCase()}`}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

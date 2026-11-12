import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { money } from '../format';
import type { Order, OrderStatus } from '../types';

// Same rules as the backend state machine; used only to decide which buttons to show.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const FILTERS: (OrderStatus | 'ALL')[] = ['ALL', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function label(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

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

  const visible = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isAdmin ? 'All orders' : 'My orders'}</h1>
          <p className="muted">
            {orders.length} order{orders.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'chip active' : 'chip'}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'All' : label(f)}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}

      {visible.length === 0 && !error && (
        <div className="empty">
          <h3>No orders here</h3>
          <p className="muted">Orders will appear in this list.</p>
        </div>
      )}

      {visible.map((o) => (
        <div className="card order-card" key={o.id}>
          <div className="order-head">
            <div className="row">
              <strong>Order #{o.id}</strong>
              <span className={`status ${o.status}`}>{label(o.status)}</span>
            </div>
            <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
          </div>
          {isAdmin && <p className="muted customer">Customer: {o.userEmail ?? `user ${o.userId}`}</p>}

          <div className="order-items">
            {o.items.map((i) => (
              <div className="order-item" key={i.productId}>
                <span>
                  {i.productName} <span className="muted">x {i.quantity}</span>
                </span>
                <span>{money(i.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="order-foot">
            <div className="row">
              {NEXT[o.status]
                .filter((s) => isAdmin || s === 'CANCELLED')
                .map((s) => (
                  <button
                    key={s}
                    className={s === 'CANCELLED' ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                    onClick={() => void change(o, s)}
                  >
                    {s === 'CANCELLED' ? 'Cancel order' : `Mark ${s.toLowerCase()}`}
                  </button>
                ))}
            </div>
            <div className="order-total">{money(o.totalAmount)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

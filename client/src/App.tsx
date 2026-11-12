import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useCart } from './cart';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';

/** Guard: only logged-in users can open the wrapped page. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function NavBar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="nav">
      <Link to="/" className="brand">
        Orderly
      </Link>
      <Link to="/">Products</Link>
      <Link to="/cart">Cart ({count})</Link>
      <Link to="/orders">{user.role === 'ADMIN' ? 'All orders' : 'My orders'}</Link>
      <span className="spacer" />
      <span className="muted">
        {user.name} ({user.role})
      </span>
      <button
        className="secondary"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Logout
      </button>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><ProductsPage /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

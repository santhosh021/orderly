import type { ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useCart } from './cart';
import { ThemeToggle } from './theme';
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
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="logo">O</span>
          <span>Orderly</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Products
          </NavLink>
          <NavLink to="/cart">
            Cart
            {count > 0 && <span className="count">{count}</span>}
          </NavLink>
          <NavLink to="/orders">{user.role === 'ADMIN' ? 'All orders' : 'My orders'}</NavLink>
        </nav>

        <div className="nav-right">
          <div className="user-chip">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-meta">
              {user.name}
              <small>{user.role}</small>
            </span>
          </div>
          <ThemeToggle />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <NavBar />
      {!user && (
        <div className="floating-toggle">
          <ThemeToggle />
        </div>
      )}
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

import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import CartPage from './pages/CartPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ShopPage from './pages/ShopPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';

/** Guard: only logged-in users can open the wrapped page (others are sent to login and back). */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <>{children}</> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

/** Guard: admins only. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/orders" element={<RequireAuth><OrdersPage scope="mine" /></RequireAuth>} />
          <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProductsPage /></RequireAdmin>} />
          <Route path="/admin/orders" element={<RequireAdmin><OrdersPage scope="all" /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

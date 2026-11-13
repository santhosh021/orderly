import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useCart } from '../cart';
import { ThemeToggle } from '../theme';
import { CartIcon, MenuIcon, SearchIcon } from './Icons';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [query, setQuery] = useState('');
  const userRef = useRef<HTMLDivElement>(null);

  // close menus when the page changes
  useEffect(() => {
    setPanelOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  // close the user menu when clicking elsewhere
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="logo">O</span>
          <span>Orderly</span>
        </Link>

        <div className={panelOpen ? 'nav-panel open' : 'nav-panel'}>
          <form className="nav-search" onSubmit={search}>
            <SearchIcon size={18} />
            <input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
          <nav className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/shop">Shop</NavLink>
            {user && <NavLink to="/orders">My orders</NavLink>}
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
        </div>

        <div className="nav-right">
          <ThemeToggle />
          <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && <span className="count">{count}</span>}
          </Link>

          {user ? (
            <div className="user-menu" ref={userRef}>
              <button className="avatar-btn" onClick={() => setUserOpen((o) => !o)} aria-label="Account menu">
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              </button>
              {userOpen && (
                <div className="dropdown">
                  <div className="dropdown-head">
                    <strong>{user.name}</strong>
                    <span className="muted">{user.email}</span>
                    <span className="role-pill">{user.role}</span>
                  </div>
                  <Link to="/orders">My orders</Link>
                  {isAdmin && <Link to="/admin/products">Manage products</Link>}
                  {isAdmin && <Link to="/admin/orders">Manage orders</Link>}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/login" state={{ mode: 'register' }} className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}

          <button
            className="icon-btn menu-btn"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

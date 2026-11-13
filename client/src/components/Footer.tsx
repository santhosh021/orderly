import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <span className="logo">O</span>
            <span>Orderly</span>
          </Link>
          <p className="muted">Browse the catalog, check live stock and track every order in one place.</p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/shop">All products</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          {user ? (
            <>
              <Link to="/orders">My orders</Link>
              <Link to="/cart">Cart</Link>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/login" state={{ mode: 'register' }}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Orderly. All rights reserved.</span>
        <span>
          Product photos from{' '}
          <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
            Pexels
          </a>
        </span>
      </div>
    </footer>
  );
}

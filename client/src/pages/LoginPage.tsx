import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';

interface LocationState {
  from?: string;
  mode?: 'login' | 'register';
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [mode, setMode] = useState<'login' | 'register'>(state.mode ?? 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const destination = state.from ?? '/';

  if (user) return <Navigate to={destination} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res =
        mode === 'login' ? await api.login(email, password) : await api.register(name, email, password);
      login(res.token, res.user);
      notify(mode === 'login' ? `Welcome back, ${res.user.name}` : 'Account created. Welcome to Orderly');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setError('');
  };

  return (
    <div className="auth-split">
      <div className="auth-side">
        <span className="logo lg">O</span>
        <h2>Everything you need, one order away.</h2>
        <p>Browse the catalog, check live stock and follow your orders from placement to delivery.</p>
        <ul>
          <li>Live stock levels</li>
          <li>Secure sign-in</li>
          <li>Easy order tracking</li>
        </ul>
      </div>

      <div className="auth-card">
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to continue' : 'It only takes a minute'}</p>

        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => switchMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => switchMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'register' && (
            <label className="field">
              <span>Name</span>
              <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

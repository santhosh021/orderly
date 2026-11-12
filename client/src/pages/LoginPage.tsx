import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res =
        mode === 'login' ? await api.login(email, password) : await api.register(name, email, password);
      login(res.token, res.user);
      navigate('/');
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
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo lg">O</span>
          <h1>Orderly</h1>
          <p className="muted">Order management made simple</p>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'register' && (
            <label className="field">
              <span>Name</span>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

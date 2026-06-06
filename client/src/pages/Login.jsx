import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/calendar" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/calendar', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-base-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="h-3.5 w-3.5 rounded-sm bg-accent shadow-[0_0_16px_3px] shadow-accent/60" />
          <span className="font-mono font-bold text-2xl tracking-[0.3em] text-gray-100">REDBASE</span>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <p className="text-sm text-gray-400 text-center">
            Secure access — authorized team members only.
          </p>

          {error && (
            <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-glow">
              {error}
            </div>
          )}

          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          JWT session · expires after 8h · rate-limited login
        </p>
      </div>
    </div>
  );
}

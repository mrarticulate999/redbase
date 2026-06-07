import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/calendar" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left panel — dark branding */}
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between bg-[#0D0D0D] p-12 shrink-0 relative overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-14">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shadow-green-glow shrink-0">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="white" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="white" opacity="0.6" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="white" opacity="0.6" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="white" opacity="0.3" />
              </svg>
            </div>
            <span className="font-mono font-bold tracking-[0.2em] text-white text-base">REDBASE</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-5">
            Operations<br />Intelligence<br />Platform
          </h1>
          <p className="text-gray-400 leading-relaxed">
            Internal command center for Norwall Solutions — AI security assessments, red teaming, and threat intelligence.
          </p>
        </div>

        <div className="relative space-y-3">
          {[
            { dot: 'bg-accent', label: 'Real-time team coordination' },
            { dot: 'bg-brand-blue', label: 'AI-powered business intelligence' },
            { dot: 'bg-gray-500', label: 'Secure encrypted access' },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-3 text-sm text-gray-500">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
              <span>{label}</span>
            </div>
          ))}
          <p className="text-xs text-gray-700 pt-3">
            © 2026 Norwall Solutions · Private access only
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="white" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="white" opacity="0.6" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="white" opacity="0.6" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="white" opacity="0.3" />
              </svg>
            </div>
            <span className="font-mono font-bold tracking-widest text-gray-900 text-sm">REDBASE</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-300">
            Session expires after 2 hours of inactivity
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, ErrorBanner, initials, colorFor } from '../components/ui';
import { Navigate } from 'react-router-dom';

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const ROLE_STYLE = {
  admin: 'badge-green',
  operator: 'badge-blue',
};

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (user?.role !== 'admin') return <Navigate to="/calendar" replace />;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await api.get('/users');
      setMembers(users); setError(null);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-400 mt-0.5">Norwall Solutions — {members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>

      <ErrorBanner error={error} onRetry={load} />

      {loading ? <Spinner label="Loading team…" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(m => {
            const color = colorFor(m.username);
            return (
              <div key={m.id} className="card p-5 flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}>
                  {initials(m.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{m.username}</p>
                    <span className={`badge text-[11px] ${ROLE_STYLE[m.role] || 'badge-gray'}`}>{m.role}</span>
                  </div>
                  {m.email && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.email}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label="Last active" value={timeAgo(m.lastActiveAt)} />
                    <Stat label="Tasks owned" value={m.taskCount ?? '—'} />
                    <Stat label="Joined" value={m.createdAt ? new Date(m.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '—'} />
                    <Stat label="Learning" value={m.learningPct != null ? `${m.learningPct}%` : '—'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-700">{value}</p>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from './ui';

// Compact inline icon set (stroke-based, inherit currentColor).
const Icon = ({ d, paths }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0">
    {paths ? paths.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const NAV = [
  { to: '/calendar', label: 'Calendar', icon: <Icon paths={['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z']} /> },
  { to: '/communications', label: 'Comms', icon: <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  { to: '/tasks', label: 'Tasks', icon: <Icon paths={['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']} /> },
  { to: '/finance', label: 'Finance', icon: <Icon paths={['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']} /> },
  { to: '/learning', label: 'Learning', icon: <Icon paths={['M22 10v6', 'M2 10l10-5 10 5-10 5z', 'M6 12v5c0 1 2 3 6 3s6-2 6-3v-5']} /> },
  { to: '/clients', label: 'Clients', icon: <Icon paths={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} /> },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed z-40 md:static inset-y-0 left-0 w-60 bg-base-900 border-r border-base-700
          flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-base-700">
          <span className="h-3 w-3 rounded-sm bg-accent shadow-[0_0_12px_2px] shadow-accent/60" />
          <span className="font-mono font-bold tracking-widest text-gray-100">REDBASE</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-accent/15 text-accent-glow border border-accent/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-base-800 border border-transparent'}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-base-700 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-accent/20 text-accent-glow grid place-items-center text-sm font-semibold">
              {initials(user?.username || '?')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-100">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost w-full mt-2 py-1.5 text-xs">
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

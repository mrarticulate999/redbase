import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from './ui';

const Icon = ({ d, paths, className = 'h-4 w-4 shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {paths ? paths.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const NAV_PRIMARY = [
  {
    to: '/calendar',
    label: 'Calendar',
    icon: <Icon paths={['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z']} />,
  },
  {
    to: '/communications',
    label: 'Comms',
    icon: <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: <Icon paths={['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']} />,
  },
  {
    to: '/finance',
    label: 'Finance',
    icon: <Icon paths={['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']} />,
  },
  {
    to: '/learning',
    label: 'Learning',
    icon: <Icon paths={['M22 10v6', 'M2 10l10-5 10 5-10 5z', 'M6 12v5c0 1 2 3 6 3s6-2 6-3v-5']} />,
  },
  {
    to: '/clients',
    label: 'Clients',
    icon: <Icon paths={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} />,
  },
];

const NAV_CRM = [
  {
    to: '/crm',
    label: 'CRM Overview',
    icon: <Icon paths={['M3 3v18h18', 'M7 14l3-3 3 3 4-5']} />,
  },
  {
    to: '/crm/leads',
    label: 'Leads',
    icon: <Icon paths={['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z', 'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z']} />,
  },
  {
    to: '/crm/pipeline',
    label: 'Pipeline',
    icon: <Icon paths={['M4 4h4v16H4z', 'M10 4h4v10h-4z', 'M16 4h4v7h-4z']} />,
  },
  {
    to: '/crm/tickets',
    label: 'Support',
    icon: <Icon paths={['M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z']} />,
  },
  {
    to: '/crm/segments',
    label: 'Segments',
    icon: <Icon paths={['M3 5h18', 'M6 12h12', 'M10 19h4']} />,
  },
];

const NAV_SECONDARY = [
  {
    to: '/strategy',
    label: 'Strategy',
    icon: <Icon paths={['M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22', 'M18 18h4', 'M18 6h4', 'M2 6h1.9c1.5 0 2.8.9 3.3 2.3']} />,
  },
  // Swarm OS is hidden from nav until it has a real backend (simulated only).
  // Route + page code retained at /swarm — re-add here to surface it.
];

function NavItem({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-md pl-3 pr-2.5 py-1.5 text-[13px] font-medium transition-all duration-150
        ${isActive
          ? 'bg-sidebar-active text-sidebar-active-text'
          : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-accent-glow shadow-[0_0_8px_rgb(34_197_94/0.6)]" />
          )}
          {item.icon}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="console-label font-bold bg-accent/15 text-accent-glow px-1.5 py-0.5 rounded">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

const TEAM_ITEM = {
  to: '/team',
  label: 'Team',
  icon: <Icon paths={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75']} />,
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed z-40 md:static inset-y-0 left-0 w-56 bg-sidebar-bg border-r border-sidebar-border
          flex flex-col transition-transform duration-200 select-none
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Logo / brand mark */}
        <div className="relative flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border shrink-0 bg-sidebar-glow">
          <div className="h-8 w-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand-mark shrink-0">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <rect x="1" y="1" width="6" height="6" rx="1.2" fill="white" />
              <rect x="9" y="1" width="6" height="6" rx="1.2" fill="white" opacity="0.7" />
              <rect x="1" y="9" width="6" height="6" rx="1.2" fill="white" opacity="0.7" />
              <rect x="9" y="9" width="6" height="6" rx="1.2" fill="white" opacity="0.45" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-mono font-bold tracking-[0.18em] text-sidebar-text text-sm leading-none">REDBASE</div>
            <div className="console-label text-sidebar-muted mt-1 leading-none">Norwall // Ops</div>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <p className="section-header px-3 text-sidebar-muted/60 mb-2">Operations</p>
          {NAV_PRIMARY.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} />
          ))}

          <div className="my-3 border-t border-sidebar-border/50" />
          <p className="section-header px-3 text-sidebar-muted/60 mb-2">Revenue</p>
          {NAV_CRM.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} />
          ))}

          <div className="my-3 border-t border-sidebar-border/50" />
          <p className="section-header px-3 text-sidebar-muted/60 mb-2">Intelligence</p>
          {NAV_SECONDARY.map((item) => (
            <NavItem key={item.to} item={item} onClose={onClose} />
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="my-3 border-t border-sidebar-border/50" />
              <p className="section-header px-3 text-sidebar-muted/60 mb-2">Admin</p>
              <NavItem item={TEAM_ITEM} onClose={onClose} />
            </>
          )}
        </nav>

        {/* Status strip */}
        <div className="px-4 py-2 border-t border-sidebar-border shrink-0 flex items-center gap-2">
          <span className="status-dot status-dot-pulse" />
          <span className="console-label text-sidebar-muted">Systems Operational</span>
        </div>

        {/* User profile */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-2.5 px-1 py-1 mb-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 bg-brand-gradient"
            >
              {initials(user?.username || '?')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-text">{user?.username}</p>
              <p className="text-[11px] text-sidebar-muted capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium
              text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

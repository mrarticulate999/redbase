import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { IdleWarningModal } from './ui';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const { showIdleWarning, dismissIdleWarning, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-base-900">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-base-700 bg-white shrink-0">
          <button
            onClick={() => setNavOpen(true)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Open navigation"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-mono font-bold tracking-widest text-gray-900 text-sm">REDBASE</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-base-850">
          <Outlet />
        </main>
      </div>

      <IdleWarningModal
        open={showIdleWarning}
        onStay={dismissIdleWarning}
        onLogout={logout}
      />
    </div>
  );
}

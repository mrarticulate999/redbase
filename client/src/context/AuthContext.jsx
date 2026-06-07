import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api, getToken, setToken, onUnauthorized } from '../lib/api';

const AuthContext = createContext(null);

const IDLE_WARN_MS = 110 * 60 * 1000;  // warn at 1h 50m
const IDLE_LOGOUT_MS = 120 * 60 * 1000; // logout at 2h

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const warnTimer = useRef(null);
  const logoutTimer = useRef(null);

  const logout = useCallback(async () => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    try {
      if (getToken()) await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setToken(null);
    setUser(null);
    setShowIdleWarning(false);
  }, []);

  const resetIdleTimers = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    setShowIdleWarning(false);
    warnTimer.current = setTimeout(() => setShowIdleWarning(true), IDLE_WARN_MS);
    logoutTimer.current = setTimeout(() => logout(), IDLE_LOGOUT_MS);
  }, [logout]);

  const dismissIdleWarning = useCallback(() => {
    resetIdleTimers();
  }, [resetIdleTimers]);

  // Set up idle tracking when a user is logged in.
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetIdleTimers, { passive: true }));
    resetIdleTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimers));
      clearTimeout(warnTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [user, resetIdleTimers]);

  // Validate any existing token on first load.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.get('/auth/me');
        if (!cancelled) setUser(user);
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // Force logout when any request returns 401.
  useEffect(() => {
    return onUnauthorized(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user } = await api.post('/auth/login', { username, password });
    setToken(token);
    setUser(user);
    return user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, showIdleWarning, dismissIdleWarning }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

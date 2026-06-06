import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, onUnauthorized } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (getToken()) await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setToken(null);
    setUser(null);
  }, []);

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
    return () => {
      cancelled = true;
    };
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

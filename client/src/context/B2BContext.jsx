import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { b2bAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { syncAuthUser } from '../utils/syncAuthUser';

// Mounted ONLY inside the /b2b route tree (not the global provider
// chain in App.jsx) — holds the live business account, credit summary,
// and B2B config for every /b2b/* page, so each page doesn't refetch
// GET /me independently. See docs/B2B_PORTAL_SPEC.md §8.3.

const B2BContext = createContext(null);

export function B2BProvider({ children }) {
  const { user, saveUser } = useAuth();
  // undefined = not loaded yet, null = confirmed no business account
  const [business, setBusiness] = useState(undefined);
  const [creditSummary, setCreditSummary] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, configRes] = await Promise.all([b2bAPI.getMe(), b2bAPI.getConfig()]);
      setBusiness(meRes.data.business);
      setCreditSummary(meRes.data.creditSummary || null);
      setConfig(configRes.data.config);

      // Keep the cached AuthContext user in sync with the live status
      // (e.g. an admin approved/suspended this account since last login)
      // without ever editing AuthContext.jsx — reuses its own saveUser().
      const liveStatus = meRes.data.business?.status || null;
      const cachedStatus = user?.business?.status || null;
      if (liveStatus !== cachedStatus) {
        syncAuthUser(saveUser);
      }
    } catch (err) {
      setError(err);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <B2BContext.Provider value={{ business, creditSummary, config, loading, error, refresh }}>
      {children}
    </B2BContext.Provider>
  );
}

export const useB2B = () => useContext(B2BContext);

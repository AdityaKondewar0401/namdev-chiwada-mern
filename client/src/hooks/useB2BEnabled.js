import { useState, useEffect } from 'react';
import { b2bAPI } from '../services/api';

// Fetch-once, module-level-cached "is B2B enabled" flag (GET /api/b2b/config
// is public and cheap, but Navbar/Footer/DistributorshipBand/B2BFeatureGate
// all need it on nearly every page — dedupe to one network call per session
// instead of one per consumer). Deliberately NOT a React Context: this is a
// single boolean, not app-wide state, and adding a provider would touch
// App.jsx's provider nesting for something a plain cached hook handles fine.
let cachedEnabled = null;
let inFlight = null;

function fetchEnabled() {
  if (cachedEnabled !== null) return Promise.resolve(cachedEnabled);
  if (!inFlight) {
    inFlight = b2bAPI.getConfig()
      .then((res) => {
        cachedEnabled = Boolean(res.data.config?.enabled);
        return cachedEnabled;
      })
      .catch(() => false) // fail closed — treat an unreachable API as "disabled"
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

export function useB2BEnabled() {
  const [state, setState] = useState({ enabled: cachedEnabled ?? false, loading: cachedEnabled === null });

  useEffect(() => {
    let cancelled = false;
    fetchEnabled().then((enabled) => {
      if (!cancelled) setState({ enabled, loading: false });
    });
    return () => { cancelled = true; };
  }, []);

  return state;
}

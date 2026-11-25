import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

/** Runs an async loader and re-runs it when deps change or demo data changes. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);
  const reload = useCallback(async () => {
    try {
      const data = await run();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState({ data: null, error, loading: false });
    }
  }, [run]);
  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    reload();
    const onChange = () => reload();
    window.addEventListener('mc-demo-change', onChange);
    return () => window.removeEventListener('mc-demo-change', onChange);
  }, [reload]);
  return { ...state, reload };
}

const AuthCtx = createContext({ session: null, ready: false });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    api.getSession().then((s) => {
      if (alive) {
        setSession(s);
        setReady(true);
      }
    }).catch(() => setReady(true));
    const off = api.onAuthChange((s) => setSession(s));
    return () => {
      alive = false;
      off?.();
    };
  }, []);
  return createElement(AuthCtx.Provider, { value: { session, ready } }, children);
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Meridian & Co. Careers` : 'Careers at Meridian & Co.';
  }, [title]);
}

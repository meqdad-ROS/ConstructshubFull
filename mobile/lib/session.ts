import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api';
import { registerForPushAsync } from './push';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
};

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionCtx = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function useProvideSession(): SessionState {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api<{ user: SessionUser }>('/api/users?me=1');
        setUser(data.user);
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: SessionUser }>(
      '/api/auth/mobile',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    await setToken(res.token);
    setUser(res.user);
    // Fire-and-forget push registration — never block sign-in on it.
    void registerForPushAsync();
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return useMemo(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);
}

export { SessionCtx };

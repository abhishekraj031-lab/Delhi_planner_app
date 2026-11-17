import { useCallback, useEffect, useState } from 'react';
import { DEMO_LOGIN } from '../config';
import { loadJSON, saveJSON } from '../lib/storage';

const KEY = 'demo-auth-v1';

/** Demo-only sign-in. Swap the body of signIn/signOut for the real provider later; screens stay the same. */
export function useAuth() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadJSON<{ name: string } | null>(KEY, null).then((u) => { setUser(u); setReady(true); });
  }, []);

  const signIn = useCallback(async (id: string, password: string): Promise<boolean> => {
    if (id.trim().toLowerCase() === DEMO_LOGIN.id && password === DEMO_LOGIN.password) {
      const u = { name: DEMO_LOGIN.name };
      setUser(u); await saveJSON(KEY, u);
      return true;
    }
    return false;
  }, []);

  const signOut = useCallback(async () => { setUser(null); await saveJSON(KEY, null); }, []);
  return { user, ready, signIn, signOut };
}

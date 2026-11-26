import { useCallback, useEffect, useState } from 'react';
import { DEMO_OTP } from '../config';
import { loadJSON, saveJSON } from '../lib/storage';

const KEY = 'demo-auth-v1';

/** Demo-only sign-in. Swap the body of signIn/signOut for the real provider later; screens stay the same. */
export function useAuth() {
  const [user, setUser] = useState<{ name: string; displayName?: string; photo?: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadJSON<{ name: string; displayName?: string; photo?: string } | null>(KEY, null).then((u) => { setUser(u); setReady(true); });
  }, []);

  /** `id` is the verified phone number or email; `code` is the one-time code sent to it. */
  const signIn = useCallback(async (id: string, code: string): Promise<boolean> => {
    if (code === DEMO_OTP) {
      const u = { name: id };
      setUser(u); await saveJSON(KEY, u);
      return true;
    }
    return false;
  }, []);

  /** `name` is the verified phone or email; `displayName` is what the person chose to be called. */
  const setDisplayName = useCallback(async (displayName: string) => {
    setUser((u) => { if (!u) return u; const n = { ...u, displayName: displayName || undefined }; saveJSON(KEY, n); return n; });
  }, []);

  const setPhoto = useCallback(async (photo?: string) => {
    setUser((u) => { if (!u) return u; const n = { ...u, photo }; saveJSON(KEY, n); return n; });
  }, []);

  const signOut = useCallback(async () => { setUser(null); await saveJSON(KEY, null); }, []);
  return { user, ready, signIn, signOut, setDisplayName, setPhoto };
}

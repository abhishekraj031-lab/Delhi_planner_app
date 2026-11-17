import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { UserLocation } from '../types';
import { AREAS } from '../data/areas';
import { KEYS, loadJSON, saveJSON } from '../lib/storage';

export type LocationState = 'idle' | 'asking' | 'denied' | 'error';

export function useLocation() {
  const [loc, setLoc] = useState<UserLocation | null>(null);
  const [state, setState] = useState<LocationState>('idle');

  const requestCurrent = useCallback(async () => {
    setState('asking');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') { setState('denied'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Current location', kind: 'gps' });
      setState('idle');
    } catch { setState('error'); }
  }, []);

  const chooseArea = useCallback((label: string) => {
    const a = AREAS.find((x) => x.label === label);
    if (!a) return;
    setLoc({ lat: a.lat, lng: a.lng, label: a.label, kind: 'area' });
    saveJSON(KEYS.area, a.label);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await loadJSON<string | null>(KEYS.area, null);
      if (saved) chooseArea(saved);
      await requestCurrent(); // a fresh GPS fix replaces the saved area when permission is granted
    })();
  }, [chooseArea, requestCurrent]);

  return { loc, state, requestCurrent, chooseArea };
}

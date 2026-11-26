import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Place = { city: string; address: string };
const cache = new Map<string, Place | null>();
const clean = (parts: (string | null | undefined)[]) => parts.map((p) => (p ?? '').trim()).filter((p, i, a) => p && a.indexOf(p) === i);

/** Turns a GPS point into a city and a short street address. Returns null when it cannot be found. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key)!;
  let out: Place | null = null;
  try {
    if (Platform.OS === 'web') {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`, { headers: { Accept: 'application/json' } });
      if (r.ok) {
        const a = ((await r.json()) as any).address ?? {};
        const city = a.city || a.town || a.village || a.state_district || a.county || a.state || '';
        const street = clean([a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road, a.neighbourhood, a.suburb, a.city_district]);
        if (city) out = { city, address: clean([...street, a.postcode]).join(', ') };
      }
    } else {
      const [g] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (g) {
        const city = g.city || g.subregion || g.region || '';
        const street = clean([g.name && g.name !== g.street ? g.name : null, g.street, g.district]);
        if (city) out = { city, address: clean([...street, g.postalCode]).join(', ') };
      }
    }
  } catch { out = null; }
  if (out) cache.set(key, out);
  return out;
}

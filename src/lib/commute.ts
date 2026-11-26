import type { Coords, Place } from '../types';

/**
 * Commute estimates from the visitor's location to a place. There is no live fare feed behind
 * these numbers, so everything here is an estimate worked out from distance and shown as one.
 * The cab apps show the real price once pickup and drop are filled in.
 */

/** Delhi Metro adult fares in rupees by distance (DMRC revision effective 25 Aug 2025). The Airport Express line has its own fares. */
export const METRO_SLABS: { upToKm: number; weekday: number; sunday: number }[] = [
  { upToKm: 2, weekday: 11, sunday: 11 },
  { upToKm: 5, weekday: 21, sunday: 11 },
  { upToKm: 12, weekday: 32, sunday: 21 },
  { upToKm: 21, weekday: 43, sunday: 32 },
  { upToKm: 32, weekday: 54, sunday: 43 },
  { upToKm: Infinity, weekday: 64, sunday: 54 },
];
/** A straight line is shorter than the real track or road, so scale it up. */
const TRACK_FACTOR = 1.25;
const ROAD_FACTOR = 1.3;

export type MetroEstimate = { fare: number; trackKm: number; sunday: boolean };
export function estimateMetro(straightKm: number | null, day: number): MetroEstimate | null {
  if (straightKm == null) return null;
  const trackKm = Math.max(1, straightKm * TRACK_FACTOR);
  const slab = METRO_SLABS.find((x) => trackKm <= x.upToKm)!;
  const sunday = day === 0;
  return { fare: sunday ? slab.sunday : slab.weekday, trackKm, sunday };
}

const round10 = (n: number) => Math.round(n / 10) * 10;
export type CabEstimate = { low: number; high: number; roadKm: number };
/** A range: the low end is a quiet-hour fare, the high end allows for busy-time pricing. */
export function estimateCab(straightKm: number | null): CabEstimate | null {
  if (straightKm == null) return null;
  const roadKm = Math.max(1, straightKm * ROAD_FACTOR);
  return { low: round10(Math.max(80, 40 + 11 * roadKm)), high: round10(Math.max(120, 60 + 18 * roadKm)), roadKm };
}

export const IXIGO_METRO_URL = 'https://www.ixigo.com/book-metro-ticket/?cCode=std%3A011&source=Delhi+Explorer';
export type CabApp = { id: 'uber' | 'ola' | 'rapido'; name: string; url: (p: Place, from?: Coords | null) => string; note: string };
export const CAB_APPS: CabApp[] = [
  { id: 'uber', name: 'Uber', note: 'Pickup: your location. Drop is filled in.',
    url: (p, from) => {
      const pickup = from ? `pickup[latitude]=${from.lat}&pickup[longitude]=${from.lng}&pickup[nickname]=${encodeURIComponent('Your location')}` : 'pickup=my_location';
      return `https://m.uber.com/ul/?action=setPickup&${pickup}&dropoff[latitude]=${p.lat}&dropoff[longitude]=${p.lng}&dropoff[nickname]=${encodeURIComponent(p.name)}`;
    } },
  { id: 'ola', name: 'Ola', note: 'Pickup: your location. Drop is filled in.',
    url: (p, from) => `https://book.olacabs.com/?${from ? `lat=${from.lat}&lng=${from.lng}&` : ''}drop_lat=${p.lat}&drop_lng=${p.lng}` },
  { id: 'rapido', name: 'Rapido', note: 'Opens Rapido. Enter the drop there.',
    url: () => 'https://www.rapido.bike/' },
];

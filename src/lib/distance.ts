import type { Coords } from '../types';

export function distanceKm(a: Coords, b: Coords): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
export function formatAway(km: number): string {
  if (km < 1) return 'under 1 km away';
  return km < 10 ? `${km.toFixed(1)} km away` : `${Math.round(km)} km away`;
}

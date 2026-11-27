import type { Place } from '../types';

/** 164450 -> "164k", 8604 -> "8.6k", 842 -> "842". */
export function formatCount(n: number): string {
  if (n >= 100000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

/** "27 Nov 2026" from "2026-11-27". */
export function formatChecked(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${M[(m || 1) - 1]} ${y}`;
}

/** Opens Google Maps search for the place, where people can read the reviews. */
export const googleReviewsUrl = (p: Place) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.area}`)}`;

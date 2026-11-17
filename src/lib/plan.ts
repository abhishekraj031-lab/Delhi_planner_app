import type { Coords, Place } from '../types';
import { distanceKm } from './distance';

export type PlanStop = { place: Place; legKm: number | null };

/**
 * Suggests a short day: places known to be open on `day`, chained nearest-first.
 * Starts at the place closest to the visitor, or, without a location, in the busiest cluster.
 * Distances are straight-line, so they are a guide, not a route.
 */
export function buildPlan(places: Place[], day: number, loc: Coords | null, maxStops = 4, maxLegKm = 8): PlanStop[] {
  const open = places.filter((p) => p.closedDays !== null && !p.closedDays.includes(day));
  if (!open.length) return [];
  const seed = loc
    ? open.reduce((a, b) => (distanceKm(loc, b) < distanceKm(loc, a) ? b : a))
    : open.reduce((a, b) => (nearCount(open, b) > nearCount(open, a) ? b : a));
  const stops: PlanStop[] = [{ place: seed, legKm: null }];
  const left = open.filter((p) => p.id !== seed.id);
  while (stops.length < maxStops && left.length) {
    const last = stops[stops.length - 1].place;
    const next = left.reduce((a, b) => (distanceKm(last, b) < distanceKm(last, a) ? b : a));
    const d = distanceKm(last, next);
    if (d > maxLegKm) break;
    stops.push({ place: next, legKm: d });
    left.splice(left.indexOf(next), 1);
  }
  return stops;
}
const nearCount = (list: Place[], p: Place) => list.filter((q) => distanceKm(p, q) <= 6).length;

/** One Google Maps directions link through every stop (it opens the Maps app when installed). */
export function planMapsUrl(stops: PlanStop[]): string | null {
  if (!stops.length) return null;
  const pt = (p: Place) => `${p.lat},${p.lng}`;
  const first = stops[0].place, last = stops[stops.length - 1].place;
  const mid = stops.slice(1, -1).map((s) => pt(s.place)).join('|');
  const q = `api=1&origin=${pt(first)}&destination=${pt(stops.length === 1 ? first : last)}&travelmode=driving${mid ? `&waypoints=${encodeURIComponent(mid)}` : ''}`;
  return `https://www.google.com/maps/dir/?${q}`;
}

export type PlanWhy = { openCount: number; unknownCount: number; startReason: string; maxLegKm: number };

/** Plain-language reasons behind a plan, built from the same rules buildPlan uses. */
export function explainPlan(places: Place[], day: number, loc: Coords | null, stops: PlanStop[], maxLegKm = 8): PlanWhy | null {
  if (!stops.length) return null;
  const open = places.filter((p) => p.closedDays !== null && !p.closedDays.includes(day));
  const seed = stops[0].place;
  const startReason = loc
    ? `Starts at ${seed.name}, the open place nearest to your location.`
    : `Starts at ${seed.name}, where the most places are close together (${nearCount(open, seed) - 1} others within 6 km).`;
  return { openCount: open.length, unknownCount: places.filter((p) => p.closedDays === null).length, startReason, maxLegKm };
}

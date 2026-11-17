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

import type { Category, Coords, Place } from '../types';
import { distanceKm } from './distance';
import { priceFor } from './pricing';

export const CATEGORIES: Category[] = ['Monuments', 'Modern Landmarks', 'Museums', 'Religious & spiritual', 'Gardens & Parks', 'Markets & Food', 'Entertainment'];
/** Tabs are shown only for categories that currently have places. */
export const categoriesWithPlaces = (places: Place[]) => CATEGORIES.filter((c) => places.some((p) => p.category === c));
/** Places with no collected data are held back until their details are added. */
export const hasCollectedData = (p: Place) => p.source !== 'Not collected yet';
export type Filters = { category: Category | 'All'; query: string; freeOnly: boolean; savedOnly: boolean; day: number };

/** Search is global: when a query is typed, the category filter is ignored. */
export function visiblePlaces(places: Place[], f: Filters, saved: Set<string>, loc: Coords | null) {
  const q = f.query.trim().toLowerCase();
  const list = places.filter((p) => {
    if (!q && f.category !== 'All' && p.category !== f.category) return false;
    if (q && ![p.name, p.area, p.category, p.metro ?? ''].join(' ').toLowerCase().includes(q)) return false;
    if (f.freeOnly && priceFor(p, f.day).i !== 0) return false;
    if (f.savedOnly && !saved.has(p.id)) return false;
    return true;
  });
  if (!loc) return list.map((place) => ({ place, km: null as number | null }));
  return list.map((place) => ({ place, km: distanceKm(loc, place) as number | null })).sort((a, b) => (a.km as number) - (b.km as number));
}

import type { Category, Coords, Place } from '../types';
import { distanceKm } from './distance';
import { priceFor } from './pricing';

export const CATEGORIES: Category[] = ['Monuments', 'Modern Landmarks', 'Museums', 'Religious & spiritual', 'Gardens & Parks'];
/** Tabs are shown only for categories that currently have places. */
export const categoriesWithPlaces = (places: Place[]) => CATEGORIES.filter((c) => places.some((p) => p.category === c));
/**
 * The app shows only places on the Delhi Tourism "Tourist Places" list (delhitourism.gov.in), as given by the owner.
 * Names on that list that are not in places.json yet: Azad Hind Gram, Dilli Haat, Dilli Haat Pitampura, Kalam Memorial,
 * Parliament House, Guru Tegh Bahadur Memorial, National Police Memorial.
 */
export const OFFICIAL_LIST_IDS = new Set([
  'akshardham-temple', 'lt', 'birla-mandir-laxminarayan-temple-', 'janpath-and-dilli-haat-ina', 'dilli-haat-janakpuri',
  'garden-of-five-senses', 'humayun-s-tomb', 'ig', 'iskcon-temple', 'jama-masjid', 'jantar-mantar', 'lodhi-garden-tombs',
  'pq', 'qutub-minar', 'rashtrapati-bhavan-and-amrit-udyan', 'safdarjung-tomb', 'gurudwara-bangla-sahib',
]);
export const isOnOfficialList = (p: Place) => OFFICIAL_LIST_IDS.has(p.id);
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

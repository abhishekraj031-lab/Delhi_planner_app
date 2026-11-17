import places from '../data/places.json';
import type { Place } from '../types';
import { getStatus } from '../lib/status';
import { estimateTotal, formatFee, priceFor } from '../lib/pricing';
import { distanceKm, formatAway } from '../lib/distance';
import { categoriesWithPlaces, visiblePlaces } from '../lib/places';

const all = places as unknown as Place[];
const find = (id: string) => all.find((p) => p.id === id) as Place;
const none = new Set<string>();
const base = { category: 'All' as const, query: '', freeOnly: false, savedOnly: false, day: 3 };

describe('data integrity', () => {
  it('has 65 unique places', () => {
    expect(all).toHaveLength(65);
    expect(new Set(all.map((p) => p.id)).size).toBe(65);
  });
  it('every place has valid coordinates inside Delhi-NCR', () => {
    for (const p of all) {
      expect(p.lat).toBeGreaterThan(28.2);
      expect(p.lat).toBeLessThan(28.9);
      expect(p.lng).toBeGreaterThan(76.7);
      expect(p.lng).toBeLessThan(77.6);
    }
  });
  it('has no invented booking links or ratings', () => {
    for (const p of all) {
      expect(p.bookUrl ?? null).toBeNull();
      expect(p).not.toHaveProperty('rating');
    }
  });
});

describe('status', () => {
  it('shows closed on a weekly closed day', () => {
    const p = all.find((x) => x.closedDays?.length) as Place;
    const d = p.closedDays![0];
    expect(getStatus(p, d).kind).toBe('closed');
  });
  it('reports unknown when hours are missing', () => {
    const p = { ...all[0], closedDays: null } as Place;
    expect(getStatus(p, 1).kind).toBe('unknown');
  });
  it('open-now check uses opening hours', () => {
    const p = { ...all[0], closedDays: [], partialNote: null, partialNoteByDay: {}, hours: [540, 1020] } as Place;
    expect(getStatus(p, 3, new Date(2026, 0, 7, 10, 0)).kind).toBe('open');
    expect(getStatus(p, 3, new Date(2026, 0, 7, 20, 0)).kind).toBe('closed');
  });
});

describe('pricing', () => {
  it('uses weekend price on Saturday and Sunday', () => {
    const p = { ...all[0], price: { weekday: { i: 10, f: 100 }, weekend: { i: 20, f: 200 } } } as Place;
    expect(priceFor(p, 3).i).toBe(10);
    expect(priceFor(p, 6).i).toBe(20);
    expect(priceFor(p, 0).f).toBe(200);
  });
  it('formats free, paid and missing fees', () => {
    const mk = (i: number | null) => ({ ...all[0], price: { weekday: { i, f: null }, weekend: { i, f: null } } }) as Place;
    expect(formatFee(mk(0), 3)).toBe('Free');
    expect(formatFee(mk(35), 3)).toBe('₹35');
    expect(formatFee(mk(null), 3)).toBeNull();
  });
  it('estimates group totals and returns null when unknown', () => {
    const p = { ...all[0], price: { weekday: { i: 35, f: null }, weekend: { i: 35, f: null } } } as Place;
    expect(estimateTotal(p, 3, 'i', 4)).toBe(140);
    expect(estimateTotal(p, 3, 'f', 4)).toBeNull();
  });
});

describe('distance and ordering', () => {
  it('haversine is roughly right (India Gate to Qutub Minar ≈ 13 km)', () => {
    const d = distanceKm(find('ig'), find('qutub-minar'));
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(16);
  });
  it('formats short and long distances', () => {
    expect(formatAway(0.4)).toMatch(/m/);
    expect(formatAway(5.2)).toMatch(/km/);
  });
  it('sorts nearest first from the user location', () => {
    const rows = visiblePlaces(all, base, none, { lat: 28.6129, lng: 77.2295 });
    expect(rows[0].place.id).toBe('ig');
    for (let i = 1; i < rows.length; i++) expect(rows[i].km!).toBeGreaterThanOrEqual(rows[i - 1].km!);
  });
  it('keeps default order and no distances without a location', () => {
    const rows = visiblePlaces(all, base, none, null);
    expect(rows[0].km).toBeNull();
    expect(rows).toHaveLength(65);
  });
});

describe('filters and search', () => {
  it('filters by category', () => {
    const rows = visiblePlaces(all, { ...base, category: 'Museums' }, none, null);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.place.category === 'Museums')).toBe(true);
  });
  it('search is global and ignores the selected category', () => {
    const rows = visiblePlaces(all, { ...base, category: 'Museums', query: 'lotus' }, none, null);
    expect(rows.some((r) => r.place.id === 'lt')).toBe(true);
  });
  it('free-only and saved-only work', () => {
    const free = visiblePlaces(all, { ...base, freeOnly: true }, none, null);
    expect(free.every((r) => priceFor(r.place, 3).i === 0)).toBe(true);
    const saved = visiblePlaces(all, { ...base, savedOnly: true }, new Set(['ig']), null);
    expect(saved.map((r) => r.place.id)).toEqual(['ig']);
  });
});

test('every category has places, so all tabs show', () => {
  expect(categoriesWithPlaces(places as unknown as Place[]).length).toBe(7);
});

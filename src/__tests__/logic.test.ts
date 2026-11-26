import places from '../data/places.json';
import type { Place } from '../types';
import { getStatus } from '../lib/status';
import { estimateTotal, formatFee, priceFor } from '../lib/pricing';
import { distanceKm, formatAway } from '../lib/distance';
import { buildPlan, explainPlan, planMapsUrl } from '../lib/plan';
import { categoriesWithPlaces, hasCollectedData, visiblePlaces } from '../lib/places';

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
  it('only has booking links that were checked on official pages, and no ratings', () => {
    const verified: Record<string, string> = {
      'national-museum': 'https://www.zoonga.com/national-museum',
      'national-zoological-park': 'https://nzpnewdelhi.gov.in/tickets/new?ln=en',
      rm: 'https://www.nrmindia.org',
    };
    for (const p of all) {
      expect(p.bookUrl ?? null).toBe(verified[p.id] ?? null);
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

test('places without collected data are hidden, tabs follow the rest', () => {
  const shown = (places as unknown as Place[]).filter(hasCollectedData);
  expect(shown.length).toBe(28);
  expect(shown.every((p) => p.source !== 'Not collected yet')).toBe(true);
  expect(categoriesWithPlaces(shown).length).toBe(5);
});

test('plan my day chains nearby places that are open that day', () => {
  const all = places as unknown as Place[];
  const plan = buildPlan(all.filter(hasCollectedData), 1, null);
  expect(plan.length).toBeGreaterThan(1);
  expect(plan.every((s) => !s.place.closedDays!.includes(1))).toBe(true);
  expect(plan.slice(1).every((s) => (s.legKm as number) <= 8)).toBe(true);
  expect(new Set(plan.map((s) => s.place.id)).size).toBe(plan.length);
});

test('plan opens as one Maps route through all stops', () => {
  const plan = buildPlan((places as unknown as Place[]).filter(hasCollectedData), 1, null);
  const url = planMapsUrl(plan) as string;
  expect(url).toContain('origin=');
  expect(url).toContain('destination=');
  expect(decodeURIComponent(url).split('waypoints=')[1].split('|').length).toBe(plan.length - 2);
});

test('plan explains why: open that day, nearest chain, start point', () => {
  const all = (places as unknown as Place[]).filter(hasCollectedData);
  const plan = buildPlan(all, 1, null);
  const why = explainPlan(all, 1, null, plan)!;
  expect(why.openCount).toBeGreaterThan(plan.length);
  expect(why.startReason).toContain(plan[0].place.name);
  expect(explainPlan(all, 1, { lat: 28.6, lng: 77.2 }, plan)!.startReason).toContain('nearest to your location');
});

describe('voice search', () => {
  const { answerQuery } = require('../lib/voiceSearch');
  const all = (require('../data/places.json') as Place[]).filter(hasCollectedData);
  const mon = new Date('2026-11-23T10:00:00'); // a Monday
  const ctx = { loc: null, now: mon };
  test('place price', () => {
    const a = answerQuery('what is the ticket price for Qutub Minar', all, ctx);
    expect(a.kind).toBe('place'); expect(a.places[0].id).toBe('qutub-minar'); expect(a.reply).toMatch(/50 rupees/);
  });
  test('free places', () => {
    const a = answerQuery('show me free places', all, ctx);
    expect(a.kind).toBe('list'); expect(a.places.every((p: Place) => p.price.weekday.i === 0)).toBe(true);
  });
  test('museums open on Tuesday excludes Tuesday-closed museums', () => {
    const a = answerQuery('museums open on tuesday', all, ctx);
    expect(a.places.length).toBeGreaterThan(0); expect(a.places.every((p: Place) => p.category === 'Museums' && !p.closedDays!.includes(2))).toBe(true);
    expect(a.places.find((p: Place) => p.id === 'air-force-museum')).toBeUndefined();
  });
  test('no museum open on Monday says so', () => {
    const a = answerQuery('museums open on monday', all, ctx); expect(a.places).toHaveLength(0); expect(a.reply).toMatch(/couldn't find/);
  });
  test('near me needs location', () => {
    expect(answerQuery('temples near me', all, ctx).reply).toMatch(/location/i);
  });
  test('unsupported and unknown', () => {
    expect(answerQuery('best street food', all, ctx).reply).toMatch(/not added yet/);
    expect(answerQuery('blah blah', all, ctx).kind).toBe('none');
  });
  test('plan', () => {
    const a = answerQuery('plan my day', all, ctx); expect(a.kind).toBe('plan'); expect(a.places.length).toBeGreaterThan(1);
  });
  test('alias', () => {
    expect(answerQuery('timings of red fort', all, ctx).places[0].id).toBe('rf');
  });
});

describe('commute estimates', () => {
  const { estimateMetro, estimateCab, CAB_APPS, IXIGO_METRO_URL } = require('../lib/commute');
  test('metro slabs and Sunday rate', () => {
    expect(estimateMetro(null, 1)).toBeNull();
    expect(estimateMetro(1, 1).fare).toBe(11);          // 1.25 km track
    expect(estimateMetro(6, 1).fare).toBe(32);          // 7.5 km track
    expect(estimateMetro(6, 0).fare).toBe(21);          // Sunday
    expect(estimateMetro(40, 1).fare).toBe(64);         // over 32 km track
  });
  test('cab range is ordered, rounded to 10 and has a floor', () => {
    expect(estimateCab(null)).toBeNull();
    const a = estimateCab(1); expect(a.low).toBe(80); expect(a.high).toBe(120);
    const b = estimateCab(8); expect(b.low % 10).toBe(0); expect(b.high).toBeGreaterThan(b.low);
  });
  test('booking links carry the destination', () => {
    const p = { name: "Humayun's Tomb", lat: 28.59, lng: 77.25 } as Place;
    const uber = CAB_APPS.find((a: any) => a.id === 'uber').url(p);
    expect(uber).toContain('dropoff[latitude]=28.59'); expect(uber).toContain(encodeURIComponent(p.name));
    expect(CAB_APPS.find((a: any) => a.id === 'ola').url(p)).toContain('drop_lat=28.59');
    const from = { lat: 28.5, lng: 77.2 };
    expect(uber).toContain('pickup=my_location');
    const uber2 = CAB_APPS.find((a: any) => a.id === 'uber').url(p, from);
    expect(uber2).toContain('pickup[latitude]=28.5'); expect(uber2).toContain('pickup[longitude]=77.2'); expect(uber2).not.toContain('my_location');
    expect(CAB_APPS.find((a: any) => a.id === 'ola').url(p, from)).toContain('lat=28.5&lng=77.2&drop_lat=28.59');
    expect(IXIGO_METRO_URL).toContain('ixigo.com/book-metro-ticket');
  });
});

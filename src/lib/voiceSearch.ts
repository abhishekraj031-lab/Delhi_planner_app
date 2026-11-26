import type { Category, Coords, Place } from '../types';
import { distanceKm } from './distance';
import { priceFor } from './pricing';
import { FULL_DAY_NAMES, getStatus } from './status';

export type VoiceAnswer = { reply: string; places: Place[]; kind: 'place' | 'list' | 'plan' | 'help' | 'none' };
type Ctx = { loc: Coords | null; now: Date };

export const SUGGESTIONS = ['Free places to visit', 'Museums open on Tuesday', 'Ticket price for Qutub Minar', 'Nearest metro to Red Fort', 'Temples near me', 'Gardens to visit', 'Monuments open today'];

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (q: string, re: RegExp) => re.test(q);

/** Other names people say for a place. Spoken input often spells names differently. */
const ALIASES: Record<string, string[]> = {
  rf: ['red fort', 'lal quila', 'lal kila', 'lal qila'],
  qutub: [], 'qutub-minar': ['qutub minar', 'qutab minar', 'kutub minar', 'qutub'],
  'humayun-s-tomb': ['humayun', 'humayuns tomb', 'humayun tomb'],
  pq: ['purana qila', 'purana quila', 'old fort'],
  ig: ['india gate'], lt: ['lotus temple', 'lotus', 'bahai temple'],
  rm: ['rail museum', 'national rail museum'],
  'national-zoological-park': ['zoo', 'delhi zoo', 'zoological park'],
  'agrasen-ki-baoli': ['agrasen', 'baoli'], 'raj-ghat': ['raj ghat', 'rajghat'],
  'gurudwara-bangla-sahib': ['bangla sahib'], 'jama-masjid': ['jama masjid'],
  'birla-mandir-laxminarayan-temple-': ['birla mandir', 'laxminarayan', 'laxmi narayan'],
  'hazrat-nizamuddin-dargah': ['nizamuddin dargah', 'dargah'], 'sn': ['sunder nursery'],
  'hauz-khas-fort': ['hauz khas'], 'safdarjung-tomb': ['safdarjung'],
  'akshardham-temple': ['akshardham'], 'iskcon-temple': ['iskcon'], 'air-force-museum': ['air force museum'],
  'national-war-memorial': ['war memorial'], 'crafts-museum': ['crafts museum'], 'jantar-mantar': ['jantar mantar'],
};
const namesOf = (p: Place) => {
  const base = p.name.split(/[()]/).map(norm).filter(Boolean);
  return [...base, ...(ALIASES[p.id] ?? []).filter(Boolean)];
};

const CATEGORY_WORDS: [Category, RegExp][] = [
  ['Museums', /\bmuseums?\b/],
  ['Religious & spiritual', /\b(temples?|mosques?|gurudwaras?|religious|spiritual|worship|dargahs?)\b/],
  ['Gardens & Parks', /\b(gardens?|parks?|nature|green|picnic)\b/],
  ['Modern Landmarks', /\b(landmarks?|modern)\b/],
  ['Monuments', /\b(monuments?|forts?|tombs?|historic|historical|history|heritage)\b/],
];
const UNSUPPORTED = /\b(markets?|shopping|food|restaurants?|eat|street food|movies?|cinema|entertainment|clubs?)\b/;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function dayFrom(q: string, now: Date): { day: number; label: string; explicit: boolean } {
  if (has(q, /\btomorrow\b/)) { const d = (now.getDay() + 1) % 7; return { day: d, label: 'tomorrow', explicit: true }; }
  for (let i = 0; i < 7; i++) if (q.includes(WEEKDAYS[i])) return { day: i, label: `on ${FULL_DAY_NAMES[i]}`, explicit: true };
  if (has(q, /\bweekends?\b/)) return { day: 6, label: 'on weekends', explicit: true };
  if (has(q, /\bweekdays?\b/)) return { day: 1, label: 'on weekdays', explicit: true };
  return { day: now.getDay(), label: 'today', explicit: has(q, /\btoday\b/) };
}

const rupees = (n: number) => `${n} rupees`;
const list = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const clock = (m: number) => { const h = Math.floor(m / 60), mi = m % 60; return `${h % 12 || 12}${mi ? `:${String(mi).padStart(2, '0')}` : ''} ${h >= 12 ? 'pm' : 'am'}`; };

function priceLine(p: Place, day: number, label: string) {
  const x = priceFor(p, day);
  if (x.i == null && x.f == null) return `I don't have the ticket price for ${p.name} yet.`;
  if (x.i === 0 && x.f === 0) return `Entry to ${p.name} is free.`;
  const parts = [x.i == null ? null : x.i === 0 ? 'free for Indian visitors' : `${rupees(x.i)} for Indian visitors`, x.f == null ? null : x.f === 0 ? 'free for foreigners' : `${rupees(x.f)} for foreigners`].filter(Boolean);
  return `${p.name} is ${list(parts as string[])}${label === 'today' ? '' : ` ${label}`}.${p.price.unverified ? ' This price is unverified.' : ''}`;
}
function hoursLine(p: Place, day: number, now: Date) {
  if (!p.closedDays) return `I don't have the opening days for ${p.name} yet.`;
  const st = getStatus(p, day, day === now.getDay() ? now : undefined);
  const closed = p.closedDays.length ? `Closed on ${list(p.closedDays.map((d) => FULL_DAY_NAMES[d]))}.` : 'Open every day.';
  const t = p.hoursText ? p.hoursText : p.hours ? `${clock(p.hours[0])} to ${clock(p.hours[1])}` : null;
  return `${p.name}: ${t ? `open ${t}. ` : 'timings are not available. '}${closed}${st.note ? ` ${st.note}.` : ''}${p.hoursUnverified ? ' The timings are unverified.' : ''}`;
}
const metroLine = (p: Place) => (p.metro ? `The nearest metro to ${p.name} is ${p.metro.replace(/\s*\(.*?\)/, '')}.${p.metroUnverified ? ' This is unverified.' : ''}` : `I don't have the nearest metro for ${p.name} yet.`);

function describePlace(p: Place, q: string, ctx: Ctx, d: ReturnType<typeof dayFrom>): string {
  const ask = { price: has(q, /\b(ticket|tickets|price|fee|fees|cost|entry|charge|how much)\b/), hours: has(q, /\b(time|timing|timings|hours|open|close|closed|when)\b/), metro: has(q, /\b(metro|reach|station|get there|how to go)\b/) };
  const out: string[] = [];
  if (ask.price) out.push(priceLine(p, d.day, d.label));
  if (ask.hours) out.push(hoursLine(p, d.day, ctx.now));
  if (ask.metro) out.push(metroLine(p));
  if (out.length) return out.join(' ');
  const fee = priceFor(p, d.day).i;
  const st = getStatus(p, ctx.now.getDay(), ctx.now);
  return `${p.name} is in ${p.area}. ${p.hours ? '' : ''}${st.label}. ${fee == null ? 'Ticket price not available.' : fee === 0 ? 'Entry is free.' : `Entry is ${rupees(fee)} for Indian visitors.`} ${p.metro ? `Nearest metro: ${p.metro.replace(/\s*\(.*?\)/, '')}.` : ''}`.replace(/\s+/g, ' ').trim();
}

export function answerQuery(text: string, places: Place[], ctx: Ctx): VoiceAnswer {
  const q = norm(text);
  if (!q) return { kind: 'none', places: [], reply: "I didn't catch that. Try asking for a place by name, or something like free museums." };
  const d = dayFrom(q, ctx.now);

  if (has(q, /^(hi|hello|hey|help)\b|what can you do|how do you work/)) {
    return { kind: 'help', places: [], reply: 'Ask me about places in Delhi. For example: free places to visit, museums open on Monday, ticket price for Qutub Minar.' };
  }

  // 1. A specific place named in the question.
  let best = 0; let hits: Place[] = [];
  for (const p of places) {
    const len = Math.max(0, ...namesOf(p).filter((n) => (` ${q} `).includes(` ${n} `)).map((n) => n.length));
    if (len > best) { best = len; hits = [p]; } else if (len && len === best) hits.push(p);
  }
  if (hits.length === 1) return { kind: 'place', places: hits, reply: describePlace(hits[0], q, ctx, d) };
  if (hits.length > 1) return { kind: 'list', places: hits, reply: `I found ${hits.length} places with that name: ${list(hits.map((h) => h.name))}. Which one do you mean?` };

  if (has(q, UNSUPPORTED) && !CATEGORY_WORDS.some(([, re]) => re.test(q))) {
    return { kind: 'none', places: [], reply: 'Markets, food and entertainment places are not added yet. I can help with monuments, museums, temples, gardens and landmarks.' };
  }

  // 3. A filtered list.
  let rows = [...places];
  const reasons: string[] = [];
  const cat = CATEGORY_WORDS.find(([, re]) => re.test(q));
  if (cat) { rows = rows.filter((p) => p.category === cat[0]); reasons.push(`in the ${cat[0]} category`); }
  const areaHit = places.find((p) => q.includes(norm(p.area)) && norm(p.area).length > 3);
  const metroKey = (p: Place) => norm((p.metro ?? '').replace(/\s*\(.*?\)/, '').replace(/\bviolet line\b/i, ''));
  const metroHit = places.find((p) => metroKey(p).length > 3 && q.includes(metroKey(p)));
  if (areaHit) { const a = norm(areaHit.area); rows = rows.filter((p) => norm(p.area) === a); reasons.push(`in ${areaHit.area}`); }
  else if (metroHit) { const m = metroKey(metroHit); rows = rows.filter((p) => metroKey(p) === m); reasons.push(`near ${metroHit.metro!.replace(/\s*\(.*?\)/, '')} metro`); }
  if (has(q, /\bfree\b|no ticket|without ticket/)) { rows = rows.filter((p) => priceFor(p, d.day).i === 0); reasons.push('free to enter'); }
  const wantsOpen = has(q, /\bopen\b|\bnot closed\b/);
  let unknownHours = 0;
  if (wantsOpen) {
    unknownHours = rows.filter((p) => p.closedDays === null).length;
    rows = rows.filter((p) => p.closedDays !== null && !p.closedDays.includes(d.day));
    reasons.push(`open ${d.label}`);
  }
  const near = has(q, /\b(near me|nearby|nearest|closest|around me|near by)\b/);
  if (near && !ctx.loc) return { kind: 'none', places: [], reply: 'Turn on your location, or choose an area on the home screen, and I can find places near you.' };
  if (ctx.loc && (near || rows.length > 1)) rows.sort((a, b) => distanceKm(ctx.loc!, a) - distanceKm(ctx.loc!, b));

  if (!cat && !areaHit && !metroHit && !has(q, /\bfree\b/) && !wantsOpen && !near) {
    return { kind: 'none', places: [], reply: "I couldn't find that. Try a place name, a type like museums or temples, or ask for free places." };
  }
  if (!rows.length) return { kind: 'none', places: [], reply: `I couldn't find any places ${reasons.join(', ') || 'for that'}.` };
  const top = rows.slice(0, 3).map((p) => p.name);
  const more = rows.length > 3 ? ` and ${rows.length - 3} more` : '';
  const note = unknownHours ? ` ${plural(unknownHours, 'place')} with no opening days listed ${unknownHours === 1 ? 'is' : 'are'} left out.` : '';
  return { kind: 'list', places: rows, reply: `I found ${plural(rows.length, 'place')} ${reasons.join(', ')}${near && ctx.loc ? ', nearest first' : ''}: ${list(top)}${more}.${note}` };
}

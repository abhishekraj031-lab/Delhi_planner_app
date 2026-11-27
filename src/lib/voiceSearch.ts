import type { Category, Coords, Place } from '../types';
import { distanceKm } from './distance';
import { priceFor } from './pricing';
import { FULL_DAY_NAMES, getStatus } from './status';
import { getLang } from '../i18n';
import { localizePlace } from '../i18n/places';

export type VoiceAnswer = { reply: string; places: Place[]; kind: 'place' | 'list' | 'plan' | 'help' | 'none' };
type Ctx = { loc: Coords | null; now: Date };

export const SUGGESTIONS = ['Free places to visit', 'Museums open on Tuesday', 'Ticket price for Qutub Minar', 'Nearest metro to Red Fort', 'Temples near me', 'Gardens to visit', 'Monuments open today'];

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (q: string, re: RegExp) => re.test(q);

/** Hindi (Devanagari) words people say, turned into the English words the rules below look for. Place names go first. */
const DEV = /[\u0900-\u097F]/;
const HI_MAP: [string, string][] = [
  ['कुतुब ?मीनार|कुतुबमीनार', 'qutub minar'], ['लाल ?किला', 'red fort'], ['इंडिया गेट', 'india gate'], ['लोटस ?(टेंपल|टेम्पल|मंदिर)|कमल मंदिर', 'lotus temple'],
  ['हुमायूं', 'humayun'], ['पुराना किला', 'purana qila'], ['जामा मस्जिद', 'jama masjid'], ['अक्षरधाम', 'akshardham'], ['राज ?घाट', 'raj ghat'], ['जंतर ?मंतर', 'jantar mantar'],
  ['बंगला साहिब', 'bangla sahib'], ['चिड़ियाघर', 'zoo'], ['सफदरजंग', 'safdarjung'], ['इस्कॉन', 'iskcon'], ['सुंदर नर्सरी', 'sunder nursery'], ['लोधी', 'lodhi'],
  ['टिकट|किराया|शुल्क|कीमत|दाम|कितने का|कितना', 'ticket'], ['समय|टाइमिंग|कब|घंटे', 'timing'], ['खुला|खुले|खुली|खुलता|खुलते', 'open'], ['बंद', 'closed'],
  ['मेट्रो|स्टेशन', 'metro'], ['मुफ्त|फ्री|निःशुल्क', 'free'], ['संग्रहालय|म्यूज़ियम|म्यूजियम', 'museum'], ['मंदिर|मस्जिद|गुरुद्वारा|दरगाह|धार्मिक', 'temple'],
  ['बगीचा|बाग|पार्क|उद्यान', 'park'], ['स्मारक|किला|मकबरा|ऐतिहासिक', 'monument'], ['पास में|नजदीक|आसपास|मेरे पास', 'near me'],
  ['आज', 'today'], ['कल', 'tomorrow'], ['सप्ताहांत|वीकेंड', 'weekend'],
  ['रविवार', 'sunday'], ['सोमवार', 'monday'], ['मंगलवार', 'tuesday'], ['बुधवार', 'wednesday'], ['गुरुवार|बृहस्पतिवार', 'thursday'], ['शुक्रवार', 'friday'], ['शनिवार', 'saturday'],
  ['बाजार|खाना|रेस्तरां|शॉपिंग|मनोरंजन|सिनेमा', 'market'],
];
const HI_RE: [RegExp, string][] = HI_MAP.map(([p, to]) => [new RegExp(p.replace(/\u093c/g, ''), 'g'), ` ${to} `]);
const fromHindi = (t: string) => HI_RE.reduce((x, [re, to]) => x.replace(re, to), t.normalize('NFD').replace(/\u093c/g, '').replace(/\u0901/g, 'ं').normalize('NFC'));

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

function priceLine(p: Place, day: number, label: string, hi = false) {
  const x = priceFor(p, day);
  if (hi) {
    const n = localizePlace(p).name;
    if (x.i == null && x.f == null) return `${n} का टिकट मूल्य अभी उपलब्ध नहीं है।`;
    if (x.i === 0 && x.f === 0) return `${n} में प्रवेश मुफ़्त है।`;
    const parts = [x.i == null ? null : x.i === 0 ? 'भारतीयों के लिए मुफ़्त' : `भारतीयों के लिए ${x.i} रुपये`, x.f == null ? null : x.f === 0 ? 'विदेशियों के लिए मुफ़्त' : `विदेशियों के लिए ${x.f} रुपये`].filter(Boolean);
    return `${n}: ${parts.join(' और ')}।${p.price.unverified ? ' यह कीमत सत्यापित नहीं है।' : ''}`;
  }
  if (x.i == null && x.f == null) return `I don't have the ticket price for ${p.name} yet.`;
  if (x.i === 0 && x.f === 0) return `Entry to ${p.name} is free.`;
  const parts = [x.i == null ? null : x.i === 0 ? 'free for Indian visitors' : `${rupees(x.i)} for Indian visitors`, x.f == null ? null : x.f === 0 ? 'free for foreigners' : `${rupees(x.f)} for foreigners`].filter(Boolean);
  return `${p.name} is ${list(parts as string[])}${label === 'today' ? '' : ` ${label}`}.${p.price.unverified ? ' This price is unverified.' : ''}`;
}
function hoursLine(p: Place, day: number, now: Date, hi = false) {
  if (hi) {
    const L = localizePlace(p);
    if (!p.closedDays) return `${L.name} के खुलने के दिन अभी उपलब्ध नहीं हैं।`;
    const closed = p.closedDays.length ? `${p.closedDays.map((d) => FULL_DAY_NAMES[d]).join(', ')} को बंद रहता है।` : 'रोज़ खुला रहता है।';
    return `${L.name}: ${L.hoursText ? `समय ${L.hoursText}। ` : 'समय उपलब्ध नहीं है। '}${closed}${p.hoursUnverified ? ' समय सत्यापित नहीं है।' : ''}`;
  }
  if (!p.closedDays) return `I don't have the opening days for ${p.name} yet.`;
  const st = getStatus(p, day, day === now.getDay() ? now : undefined);
  const closed = p.closedDays.length ? `Closed on ${list(p.closedDays.map((d) => FULL_DAY_NAMES[d]))}.` : 'Open every day.';
  const t = p.hoursText ? p.hoursText : p.hours ? `${clock(p.hours[0])} to ${clock(p.hours[1])}` : null;
  return `${p.name}: ${t ? `open ${t}. ` : 'timings are not available. '}${closed}${st.note ? ` ${st.note}.` : ''}${p.hoursUnverified ? ' The timings are unverified.' : ''}`;
}
const metroLine = (p: Place, hi = false) => hi ? (p.metro ? `${localizePlace(p).name} का सबसे नज़दीकी मेट्रो स्टेशन ${localizePlace(p).metro!.replace(/\s*\(.*?\)/, '')} है।` : `${localizePlace(p).name} का नज़दीकी मेट्रो अभी उपलब्ध नहीं है।`) : (p.metro ? `The nearest metro to ${p.name} is ${p.metro.replace(/\s*\(.*?\)/, '')}.${p.metroUnverified ? ' This is unverified.' : ''}` : `I don't have the nearest metro for ${p.name} yet.`);

function describePlace(p: Place, q: string, ctx: Ctx, d: ReturnType<typeof dayFrom>, hi = false): string {
  const ask = { price: has(q, /\b(ticket|tickets|price|fee|fees|cost|entry|charge|how much)\b/), hours: has(q, /\b(time|timing|timings|hours|open|close|closed|when)\b/), metro: has(q, /\b(metro|reach|station|get there|how to go)\b/) };
  const out: string[] = [];
  if (ask.price) out.push(priceLine(p, d.day, d.label, hi));
  if (ask.hours) out.push(hoursLine(p, d.day, ctx.now, hi));
  if (ask.metro) out.push(metroLine(p, hi));
  if (out.length) return out.join(' ');
  const fee = priceFor(p, d.day).i;
  if (hi) { const L = localizePlace(p); return `${L.name} ${L.area} में है। ${fee == null ? 'टिकट मूल्य उपलब्ध नहीं है।' : fee === 0 ? 'प्रवेश मुफ़्त है।' : `भारतीयों के लिए प्रवेश ${fee} रुपये है।`}${p.metro ? ` सबसे नज़दीकी मेट्रो: ${L.metro!.replace(/\s*\(.*?\)/, '')}।` : ''}`; }
  const st = getStatus(p, ctx.now.getDay(), ctx.now);
  return `${p.name} is in ${p.area}. ${p.hours ? '' : ''}${st.label}. ${fee == null ? 'Ticket price not available.' : fee === 0 ? 'Entry is free.' : `Entry is ${rupees(fee)} for Indian visitors.`} ${p.metro ? `Nearest metro: ${p.metro.replace(/\s*\(.*?\)/, '')}.` : ''}`.replace(/\s+/g, ' ').trim();
}

export function answerQuery(text: string, places: Place[], ctx: Ctx): VoiceAnswer {
  const hi = DEV.test(text) || getLang() === 'hi';
  const q = norm(hi ? fromHindi(text.toLowerCase()) : text);
  const H = (en: string, hindi: string) => (hi ? hindi : en);
  if (!q) return { kind: 'none', places: [], reply: H("I didn't catch that. Try asking for a place by name, or something like free museums.", 'मैं समझ नहीं पाया। किसी जगह का नाम बताएँ, या पूछें जैसे "मुफ़्त संग्रहालय"।') };
  const d = dayFrom(q, ctx.now);

  if (has(q, /^(hi|hello|hey|help)\b|what can you do|how do you work/)) {
    return { kind: 'help', places: [], reply: H('Ask me about places in Delhi. For example: free places to visit, museums open on Monday, ticket price for Qutub Minar.', 'दिल्ली की जगहों के बारे में पूछिए। जैसे: मुफ़्त जगहें, सोमवार को खुले संग्रहालय, क़ुतुब मीनार का टिकट।') };
  }

  // 1. A specific place named in the question.
  let best = 0; let hits: Place[] = [];
  for (const p of places) {
    const len = Math.max(0, ...namesOf(p).filter((n) => (` ${q} `).includes(` ${n} `)).map((n) => n.length));
    if (len > best) { best = len; hits = [p]; } else if (len && len === best) hits.push(p);
  }
  if (hits.length === 1) return { kind: 'place', places: hits, reply: describePlace(hits[0], q, ctx, d, hi) };
  if (hits.length > 1) return { kind: 'list', places: hits, reply: hi ? `इस नाम की ${hits.length} जगहें मिलीं: ${hits.map((h) => localizePlace(h).name).join(', ')}। आप कौन सी जगह पूछ रहे हैं?` : `I found ${hits.length} places with that name: ${list(hits.map((h) => h.name))}. Which one do you mean?` };

  if (has(q, UNSUPPORTED) && !CATEGORY_WORDS.some(([, re]) => re.test(q))) {
    return { kind: 'none', places: [], reply: H('Markets, food and entertainment places are not added yet. I can help with monuments, museums, temples, gardens and landmarks.', 'बाज़ार, खाने और मनोरंजन की जगहें अभी जोड़ी नहीं गई हैं। मैं स्मारक, संग्रहालय, मंदिर, बगीचे और लैंडमार्क में मदद कर सकता हूँ।') };
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
  if (near && !ctx.loc) return { kind: 'none', places: [], reply: H('Turn on your location, or choose an area on the home screen, and I can find places near you.', 'अपनी लोकेशन चालू करें, या होम स्क्रीन पर इलाक़ा चुनें, तब मैं आपके पास की जगहें ढूँढ सकता हूँ।') };
  if (ctx.loc && (near || rows.length > 1)) rows.sort((a, b) => distanceKm(ctx.loc!, a) - distanceKm(ctx.loc!, b));

  if (!cat && !areaHit && !metroHit && !has(q, /\bfree\b/) && !wantsOpen && !near) {
    return { kind: 'none', places: [], reply: H("I couldn't find that. Try a place name, a type like museums or temples, or ask for free places.", 'मुझे यह नहीं मिला। किसी जगह का नाम, या संग्रहालय/मंदिर जैसा प्रकार बताएँ, या मुफ़्त जगहें पूछें।') };
  }
  if (!rows.length) return { kind: 'none', places: [], reply: hi ? 'मुझे ऐसी कोई जगह नहीं मिली।' : `I couldn't find any places ${reasons.join(', ') || 'for that'}.` };
  const top = rows.slice(0, 3).map((p) => p.name);
  const more = rows.length > 3 ? ` and ${rows.length - 3} more` : '';
  const note = unknownHours ? ` ${plural(unknownHours, 'place')} with no opening days listed ${unknownHours === 1 ? 'is' : 'are'} left out.` : '';
  if (hi) {
    const names = rows.slice(0, 3).map((p) => localizePlace(p).name);
    return { kind: 'list', places: rows, reply: `मुझे ${rows.length} जगहें मिलीं${near && ctx.loc ? ' (सबसे पास की पहले)' : ''}: ${names.join(', ')}${rows.length > 3 ? ` और ${rows.length - 3} अन्य` : ''}।${unknownHours ? ` ${unknownHours} जगहों के खुलने के दिन उपलब्ध नहीं हैं, इसलिए उन्हें छोड़ा गया है।` : ''}` };
  }
  return { kind: 'list', places: rows, reply: `I found ${plural(rows.length, 'place')} ${reasons.join(', ')}${near && ctx.loc ? ', nearest first' : ''}: ${list(top)}${more}.${note}` };
}

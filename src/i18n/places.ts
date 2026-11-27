import type { Place } from '../types';
import { tr } from './index';

const t = (s: string | null) => (s ? tr(s) : s);

/** Shows a place in the current language. The Hindi text comes from the dictionary (English text is the key), and anything missing stays in English. */
export function localizePlace(p: Place): Place {
  return {
    ...p,
    nameEn: p.name, areaEn: p.area,
    name: tr(p.name), area: tr(p.area),
    description: t(p.description), hoursText: t(p.hoursText), duration: t(p.duration), metro: t(p.metro),
    partialNote: t(p.partialNote),
    partialNoteByDay: Object.fromEntries(Object.entries(p.partialNoteByDay ?? {}).map(([k, v]) => [k, tr(v)])),
    source: tr(p.source), verifiedNote: tr(p.verifiedNote),
    thingsToKnow: p.thingsToKnow?.map((x) => tr(x)),
  };
}

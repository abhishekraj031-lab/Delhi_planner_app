import type { Place } from '../types';
import { dayName, tr } from '../i18n';

export type Status = { kind: 'open' | 'closed' | 'partial' | 'unknown'; label: string; note?: string };
/** Day names in the current language. Index 0 is Sunday. */
export const DAY_NAMES = new Proxy([] as string[], { get: (_, k) => (typeof k === 'string' && /^\d$/.test(k) ? dayName(Number(k), true) : undefined) }) as unknown as string[];
export const FULL_DAY_NAMES = new Proxy([] as string[], { get: (_, k) => (typeof k === 'string' && /^\d$/.test(k) ? dayName(Number(k)) : undefined) }) as unknown as string[];

export const partialNoteFor = (p: Place, day: number): string | null =>
  p.partialNote ?? p.partialNoteByDay[String(day)] ?? null;

/** Pass `now` only when `day` is today so the open/closed-now check can run. */
export function getStatus(p: Place, day: number, now?: Date): Status {
  if (!p.closedDays) return { kind: 'unknown', label: tr('Hours not available') };
  if (p.closedDays.includes(day)) return { kind: 'closed', label: now ? tr('Closed today') : tr('Closed {day}', { day: dayName(day, true) }) };
  const note = partialNoteFor(p, day);
  if (note) return { kind: 'partial', label: tr('Partly closed'), note };
  if (now && p.hours) {
    const m = now.getHours() * 60 + now.getMinutes();
    return m >= p.hours[0] && m < p.hours[1] ? { kind: 'open', label: tr('Open now') } : { kind: 'closed', label: tr('Closed now') };
  }
  return { kind: 'open', label: tr('Open') };
}

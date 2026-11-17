import type { Place } from '../types';

export type Status = { kind: 'open' | 'closed' | 'partial' | 'unknown'; label: string; note?: string };
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const partialNoteFor = (p: Place, day: number): string | null =>
  p.partialNote ?? p.partialNoteByDay[String(day)] ?? null;

/** Pass `now` only when `day` is today so the open/closed-now check can run. */
export function getStatus(p: Place, day: number, now?: Date): Status {
  if (!p.closedDays) return { kind: 'unknown', label: 'Hours not available' };
  if (p.closedDays.includes(day)) return { kind: 'closed', label: now ? 'Closed today' : `Closed ${DAY_NAMES[day]}` };
  const note = partialNoteFor(p, day);
  if (note) return { kind: 'partial', label: 'Partly closed', note };
  if (now && p.hours) {
    const m = now.getHours() * 60 + now.getMinutes();
    return m >= p.hours[0] && m < p.hours[1] ? { kind: 'open', label: 'Open now' } : { kind: 'closed', label: 'Closed now' };
  }
  return { kind: 'open', label: 'Open' };
}

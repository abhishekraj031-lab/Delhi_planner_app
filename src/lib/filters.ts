import type { Place } from '../types';
import { priceFor } from './pricing';
import { FULL_DAY_NAMES, getStatus } from './status';

/** When the visit happens. 'today' shows everything with today's status; the others keep only places known to be open. */
export type When = 'today' | 'weekdays' | 'weekend';
export type Budget = 'free' | 'u30' | 'u50' | 'o50';
export type HoursPick = 'now' | 'morning' | 'evening';
export type Where = 'nearest' | 'w2' | 'w5' | 'w10' | 'w20' | 'metro';

export const WHEN_OPTIONS: { key: When; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'weekdays', label: 'Weekdays' }, { key: 'weekend', label: 'Weekend' },
];
/** Single days offered under each group. */
export const DAYS_FOR: Record<'weekdays' | 'weekend', number[]> = { weekdays: [1, 2, 3, 4, 5], weekend: [6, 0] };
export const BUDGETS: { key: Budget; label: string }[] = [
  { key: 'free', label: 'Free' }, { key: 'u30', label: 'Up to ₹30' }, { key: 'u50', label: '₹31 to ₹50' }, { key: 'o50', label: 'Above ₹50' },
];
export const HOURS: { key: HoursPick; label: string }[] = [
  { key: 'now', label: 'Open now' }, { key: 'morning', label: 'Open at 10 am' }, { key: 'evening', label: 'Open at 6 pm' },
];
export const WHERES: { key: Where; label: string; needsLocation: boolean }[] = [
  { key: 'nearest', label: '5 nearest to me', needsLocation: true },
  { key: 'w2', label: 'Within 2 km', needsLocation: true }, { key: 'w5', label: 'Within 5 km', needsLocation: true },
  { key: 'w10', label: 'Within 10 km', needsLocation: true }, { key: 'w20', label: 'Within 20 km', needsLocation: true },
  { key: 'metro', label: 'Near a metro station', needsLocation: false },
];
export const whereKm = (w: Where | null | undefined): number | null => (w && /^w\d+$/.test(w) ? Number(w.slice(1)) : null);

export type Extra = { when: When; pick: number | null; budget: Budget | null; hours: HoursPick | null; where: Where | null };
export const NO_EXTRA: Extra = { when: 'today', pick: null, budget: null, hours: null, where: null };

/** The weekday used to show prices and status for a choice. */
export function whenInfo(when: When, pick: number | null, todayDow: number): { day: number; label: string; hint: string | null } {
  if (when === 'today') return { day: todayDow, label: 'Today', hint: null };
  if (pick != null) return { day: pick, label: FULL_DAY_NAMES[pick], hint: `Showing places open on ${FULL_DAY_NAMES[pick]}.` };
  if (when === 'weekdays') return { day: 3, label: 'Weekdays', hint: 'Showing places open every weekday, Monday to Friday.' };
  return { day: 6, label: 'Weekend', hint: 'Showing places open on both Saturday and Sunday.' };
}

/** Places with unknown opening days are left out of day filters, never guessed. */
export function matchesWhen(p: Place, when: When, pick: number | null = null): boolean {
  if (when === 'today') return true;
  if (!p.closedDays) return false;
  const open = (days: number[]) => !days.some((d) => p.closedDays!.includes(d));
  if (pick != null) return open([pick]);
  return open(when === 'weekdays' ? DAYS_FOR.weekdays : DAYS_FOR.weekend);
}

export function matchesBudget(p: Place, b: Budget | null, day: number): boolean {
  if (!b) return true;
  const v = priceFor(p, day).i;
  if (v == null) return false;
  if (b === 'free') return v === 0;
  if (b === 'u30') return v > 0 && v <= 30;
  if (b === 'u50') return v > 30 && v <= 50;
  return v > 50;
}

export function matchesHours(p: Place, h: HoursPick | null, now: Date): boolean {
  if (!h) return true;
  if (h === 'now') { const k = getStatus(p, now.getDay(), now).kind; return k === 'open' || k === 'partial'; }
  if (!p.hours) return false;
  const at = h === 'morning' ? 600 : 1080;
  return p.hours[0] <= at && p.hours[1] > at;
}

export function activeTags(x: Extra): { key: string; label: string }[] {
  const t: { key: string; label: string }[] = [];
  if (x.when !== 'today') t.push({ key: 'when', label: whenInfo(x.when, x.pick, 0).label });
  if (x.budget) t.push({ key: 'budget', label: BUDGETS.find((b) => b.key === x.budget)!.label });
  if (x.hours) t.push({ key: 'hours', label: HOURS.find((h) => h.key === x.hours)!.label });
  if (x.where) t.push({ key: 'where', label: WHERES.find((w) => w.key === x.where)!.label });
  return t;
}

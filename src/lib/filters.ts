import type { Place } from '../types';
import { priceFor } from './pricing';
import { FULL_DAY_NAMES, getStatus } from './status';

/** When the visit happens. 'today' shows everything with today's status; the others keep only places known to be open. */
export type When = 'today' | 'weekdays' | 'weekend' | 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6';
export type Budget = 'free' | 'u30' | 'u50' | 'o50';
export type HoursPick = 'now' | 'morning' | 'evening';

export const WHEN_OPTIONS: { key: When; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'weekdays', label: 'Weekdays' }, { key: 'weekend', label: 'Weekend' },
];
/** Monday first, the way people plan a week. */
export const DAY_OPTIONS: { key: When; label: string }[] = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ key: `d${d}` as When, label: FULL_DAY_NAMES[d].slice(0, 3) }));
export const BUDGETS: { key: Budget; label: string }[] = [
  { key: 'free', label: 'Free' }, { key: 'u30', label: 'Up to ₹30' }, { key: 'u50', label: '₹31 to ₹50' }, { key: 'o50', label: 'Above ₹50' },
];
export const HOURS: { key: HoursPick; label: string }[] = [
  { key: 'now', label: 'Open now' }, { key: 'morning', label: 'Open at 10 am' }, { key: 'evening', label: 'Open at 6 pm' },
];
export const WITHIN = [2, 5, 10, 20];

export type Extra = { when: When; budget: Budget | null; hours: HoursPick | null; within: number | null; metro: boolean };
export const NO_EXTRA: Extra = { when: 'today', budget: null, hours: null, within: null, metro: false };

/** The weekday used to show prices and status for a choice. */
export function whenInfo(when: When, todayDow: number): { day: number; label: string; hint: string | null } {
  if (when === 'today') return { day: todayDow, label: 'Today', hint: null };
  if (when === 'weekdays') return { day: 3, label: 'Weekdays', hint: 'Showing places open every weekday, Monday to Friday.' };
  if (when === 'weekend') return { day: 6, label: 'Weekend', hint: 'Showing places open on both Saturday and Sunday.' };
  const d = Number(when.slice(1));
  return { day: d, label: FULL_DAY_NAMES[d], hint: `Showing places open on ${FULL_DAY_NAMES[d]}.` };
}

/** Places with unknown opening days are left out of day filters, never guessed. */
export function matchesWhen(p: Place, when: When): boolean {
  if (when === 'today') return true;
  if (!p.closedDays) return false;
  const shut = (days: number[]) => !days.some((d) => p.closedDays!.includes(d));
  if (when === 'weekdays') return shut([1, 2, 3, 4, 5]);
  if (when === 'weekend') return shut([0, 6]);
  return shut([Number(when.slice(1))]);
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

export const extraCount = (x: Extra) => (x.when !== 'today' ? 1 : 0) + (x.budget ? 1 : 0) + (x.hours ? 1 : 0) + (x.within ? 1 : 0) + (x.metro ? 1 : 0);

export function activeTags(x: Extra, saved: boolean): { key: string; label: string }[] {
  const t: { key: string; label: string }[] = [];
  if (x.when !== 'today') t.push({ key: 'when', label: whenInfo(x.when, 0).label });
  if (x.budget) t.push({ key: 'budget', label: BUDGETS.find((b) => b.key === x.budget)!.label });
  if (x.hours) t.push({ key: 'hours', label: HOURS.find((h) => h.key === x.hours)!.label });
  if (x.within) t.push({ key: 'within', label: `Within ${x.within} km` });
  if (x.metro) t.push({ key: 'metro', label: 'Near metro' });
  if (saved) t.push({ key: 'saved', label: 'Saved' });
  return t;
}

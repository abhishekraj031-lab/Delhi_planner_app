import type { Place, Price } from '../types';
import { tr } from '../i18n';

export type VisitorType = 'i' | 'f';
export const priceFor = (p: Place, day: number): Price => (day === 0 || day === 6 ? p.price.weekend : p.price.weekday);

/** 'Free', '₹35', or null when the price is not available. */
export function formatFee(p: Place, day: number): string | null {
  const v = priceFor(p, day).i;
  return v == null ? null : v === 0 ? tr('Free') : `₹${v}`;
}
export function estimateTotal(p: Place, day: number, who: VisitorType, count: number): number | null {
  const v = priceFor(p, day)[who];
  return v == null ? null : v * count;
}
export const hasPrice = (p: Place, day: number) => {
  const x = priceFor(p, day);
  return !(x.i == null && x.f == null);
};

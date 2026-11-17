import data from './places.json';
import type { Place } from '../types';

/**
 * Single entry point for place data. Today it reads the bundled file. To move to a hosted
 * database later, change only this function (keep the Place shape); screens stay as they are.
 */
export async function loadPlaces(): Promise<Place[]> {
  return data as unknown as Place[];
}

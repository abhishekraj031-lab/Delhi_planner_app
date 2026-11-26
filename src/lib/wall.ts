import { Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadJSON, saveJSON } from './storage';
import { APP_URL } from '../config';
import { inFrame } from './bridge';

export type Comment = { id: string; who: string; text: string; t: number };
export type Post = {
  id: string; author: string; relation?: string; mine: boolean; sample?: boolean;
  placeId?: string; caption: string; t: number;
  /** Uploaded photo as a data URI, or the id of a bundled place photo for sample posts. */
  photo?: string; samplePhoto?: string;
  likes: number; liked: boolean; comments: Comment[];
};

const META = 'wall-posts-v2';
const photoKey = (id: string) => `wall-photo-${id}`;
const H = 3600_000;

export const PEOPLE = [
  { name: 'Riya', relation: 'Sister' }, { name: 'Papa', relation: 'Family' }, { name: 'Aman', relation: 'Friend' },
];

/** Sample posts so the wall shows how it feels before anyone has posted. Clearly marked as samples. */
function seed(): Post[] {
  const now = Date.now();
  return [
    { id: 's1', author: 'Riya', relation: 'Sister', mine: false, sample: true, placeId: 'rf', samplePhoto: 'rf', t: now - 2 * H,
      caption: 'Finally made it here. The evening light on the walls was unreal.', likes: 4, liked: false,
      comments: [{ id: 'c1', who: 'Papa', text: 'Go early next time, it is less crowded.', t: now - H }, { id: 'c2', who: 'Aman', text: 'Save me a spot for the next trip!', t: now - H / 2 }] },
    { id: 's2', author: 'Aman', relation: 'Friend', mine: false, sample: true, placeId: 'qutub-minar', samplePhoto: 'qutub-minar', t: now - 26 * H,
      caption: 'Sunday plan sorted. Online ticket was cheaper than cash.', likes: 2, liked: false, comments: [] },
    { id: 's3', author: 'Papa', relation: 'Family', mine: false, sample: true, placeId: 'national-museum', samplePhoto: 'national-museum', t: now - 50 * H,
      caption: 'Spent three hours here and did not get bored.', likes: 3, liked: false,
      comments: [{ id: 'c3', who: 'Riya', text: 'Taking Mummy next week.', t: now - 40 * H }] },
  ];
}

export async function loadWall(): Promise<Post[]> {
  const meta = await loadJSON<Post[] | null>(META, null);
  if (!meta) return seed();
  return Promise.all(meta.map(async (p) => (p.mine ? { ...p, photo: (await loadJSON<string | null>(photoKey(p.id), null)) ?? undefined } : p)));
}

/** Photos are stored one per key so no single value gets too large; the list itself stays small. */
export async function saveWall(posts: Post[]): Promise<void> {
  await saveJSON(META, posts.map((p) => (p.mine ? { ...p, photo: undefined } : p)));
}
export async function savePhoto(id: string, photo: string): Promise<void> { await saveJSON(photoKey(id), photo); }
export async function removePhoto(id: string): Promise<void> { try { await AsyncStorage.removeItem(photoKey(id)); } catch { /* ignore */ } }

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function ago(t: number, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - t) / 60_000));
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

/** Shrinks a photo picked in the browser so it fits in storage. Native photos are already compressed by the picker. */
export function shrinkWeb(uri: string, max = 1080, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new (globalThis as any).Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = (globalThis as any).document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(uri);
      img.src = uri;
    } catch { resolve(uri); }
  });
}

export const withLink = (text: string) => (APP_URL ? `${text}\n${APP_URL}` : text);

/** Opens the phone's own share sheet (WhatsApp, iMessage, ...). Returns 'unsupported' where the browser does not allow it. */
export async function shareText(text: string): Promise<'shared' | 'cancelled' | 'unsupported'> {
  const msg = withLink(text);
  try {
    if (Platform.OS !== 'web') { const r = await Share.share({ message: msg }); return r.action === Share.dismissedAction ? 'cancelled' : 'shared'; }
    const nav: any = (globalThis as any).navigator;
    if (nav?.share && !inFrame) { await nav.share({ text: msg }); return 'shared'; }
    return 'unsupported';
  } catch (e: any) { return e?.name === 'AbortError' ? 'cancelled' : 'unsupported'; }
}

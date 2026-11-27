import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { shrinkWeb } from './wall';

/**
 * Web only: sets the colour of the browser's top bar. `null` goes back to white.
 * With a picture, the bar takes that picture's top-edge colour so the photo seems to run up behind it.
 */
export function setTopBarColor(color: string | null) {
  if (Platform.OS !== 'web') return;
  try {
    const m = (globalThis as any).document.querySelector('meta[name="theme-color"]');
    m?.setAttribute('content', color ?? '#ffffff');
  } catch { /* cosmetic only */ }
}

/** Web only: the average colour of the top edge of a picture, or null if it cannot be read. */
export function topEdgeColor(uri: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const doc = (globalThis as any).document;
      const img = new (globalThis as any).Image();
      img.onload = () => {
        try {
          const c = doc.createElement('canvas'); c.width = 1; c.height = 1;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0, img.width, Math.max(1, Math.round(img.height * 0.06)), 0, 0, 1, 1);
          const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
          resolve(`rgb(${r}, ${gg}, ${b})`);
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = uri;
    } catch { resolve(null); }
  });
}

/** Picks or takes a square photo and returns it as a small data URI that fits in local storage. */
export async function pickSquarePhoto(camera: boolean, max = 480): Promise<{ uri?: string; error?: string }> {
  try {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted && Platform.OS !== 'web') return { error: camera ? 'Camera is off for this app. Turn it on in your phone settings.' : 'Photos are off for this app. Turn them on in your phone settings.' };
    const opts = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.4, base64: true, allowsEditing: true, aspect: [1, 1] as [number, number] };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled || !r.assets?.[0]) return {};
    const a = r.assets[0];
    const uri = a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
    return { uri: Platform.OS === 'web' ? await shrinkWeb(uri, max, 0.8) : uri };
  } catch { return { error: 'Could not open your photos. Please try again.' }; }
}

/** Web only: picks a photo with no built-in crop, so the app can show its own crop screen. */
export async function pickRawPhoto(camera: boolean): Promise<{ uri?: string; error?: string }> {
  try {
    const opts = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 1, allowsEditing: false };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled || !r.assets?.[0]) return {};
    return { uri: r.assets[0].uri };
  } catch { return { error: 'Could not open your photos. Please try again.' }; }
}

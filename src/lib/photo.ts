import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { shrinkWeb } from './wall';

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

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Speech to text uses expo-speech-recognition (the phone's own recogniser; the browser's on web).
 * It is a native module, so it is missing in Expo Go. We load it defensively so the app still works
 * with the typed box when it is not there.
 */
type Mod = {
  addListener: (name: string, cb: (e: any) => void) => { remove: () => void };
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (o: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
};
let mod: Mod | null = null;
try { mod = require('expo-speech-recognition').ExpoSpeechRecognitionModule as Mod; } catch { mod = null; }

export const canListen = () => !!mod;
/** Starting to listen as soon as the sheet opens is only done on phones; browsers ask for permission first. */
export const autoListen = () => !!mod && Platform.OS !== 'web';

const MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is off. Allow it in your phone settings, or type your question.',
  'service-not-allowed': 'Voice recognition is not available right now. You can type your question instead.',
  'no-speech': "I didn't hear anything. Tap the mic and try again.",
  'audio-capture': 'I could not use the microphone. You can type your question instead.',
  'language-not-supported': 'Voice recognition for English (India) is not available on this device. You can type instead.',
};

export type ListenHandlers = { onText: (text: string, final: boolean) => void; onEnd: () => void; onError: (message: string) => void };

/** Starts listening and returns a function that stops it. */
export async function startListening(h: ListenHandlers): Promise<() => void> {
  if (!mod) { h.onError('Voice input is not available here. You can type your question instead.'); h.onEnd(); return () => {}; }
  const m = mod;
  let done = false;
  const subs: { remove: () => void }[] = [];
  const finish = () => { if (done) return; done = true; subs.forEach((s) => s.remove()); h.onEnd(); };
  try {
    const perm = await m.requestPermissionsAsync();
    if (!perm.granted) { h.onError(MESSAGES['not-allowed']); finish(); return () => {}; }
    subs.push(m.addListener('result', (e) => { const t = e?.results?.[0]?.transcript; if (t) h.onText(String(t), !!e.isFinal); }));
    subs.push(m.addListener('error', (e) => { if (e?.error !== 'aborted') h.onError(MESSAGES[e?.error] ?? 'Something went wrong with voice input. You can type instead.'); finish(); }));
    subs.push(m.addListener('end', finish));
    m.start({ lang: 'en-IN', interimResults: true, continuous: false });
  } catch {
    h.onError(MESSAGES['not-allowed']); finish();
  }
  return () => { try { m.stop(); } catch { /* already stopped */ } };
}

export function speak(text: string) {
  try { Speech.stop(); Speech.speak(text, { language: 'en-IN', rate: 0.98 }); } catch { /* speech is optional */ }
}
export function stopSpeaking() { try { Speech.stop(); } catch { /* ignore */ } }

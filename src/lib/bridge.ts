import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Web-preview only. The preview shows the app inside a frame on a page that can use the viewer's
 * microphone and speaker. The app frame can't, so it talks to that page with messages.
 * On a phone, or in a plain browser tab, none of this is active and the app uses the phone's own speech.
 */
type Caps = { dictation: boolean; tts: boolean; links: boolean };
let caps: Caps = { dictation: false, tts: false, links: false };
const listeners = new Set<(m: any) => void>();
const w: any = Platform.OS === 'web' && typeof window !== 'undefined' ? window : null;
export const inFrame = !!w && w.parent !== w;

if (inFrame) {
  w.addEventListener('message', (e: MessageEvent) => {
    const m: any = e.data;
    if (e.source !== w.parent || !m || typeof m.dx !== 'string') return;
    if (m.dx === 'caps') caps = { dictation: !!m.dictation, tts: !!m.tts, links: !!m.links };
    listeners.forEach((f) => f(m));
  });
  w.parent.postMessage({ dx: 'hello' }, '*');
}

export const post = (m: Record<string, unknown>) => { if (inFrame) w.parent.postMessage(m, '*'); };
export const bridgeTts = () => inFrame && caps.tts;
export const onBridge = (f: (m: any) => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
/** Re-renders when the page reports what it can do. */
export function useBridgeCaps(): Caps {
  const [c, setC] = useState(caps);
  useEffect(() => onBridge((m) => { if (m.dx === 'caps') setC({ dictation: !!m.dictation, tts: !!m.tts, links: !!m.links }); }), []);
  return inFrame ? c : { dictation: false, tts: false, links: false };
}

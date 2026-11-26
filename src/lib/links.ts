import { useEffect, useRef } from 'react';
import { onBridge, post, useBridgeCaps } from './bridge';

/**
 * Web-preview only. Inside the preview, code is not allowed to open other sites, but a real tap on a real
 * link is. So each button that opens a site tells the preview page where it is, and the page lays an
 * invisible link over it. On a phone, or in a normal browser tab, none of this runs and Linking.openURL is used.
 */
type Entry = { url: string; el: any };
const registry = new Map<number, Entry>();
let seq = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let last = '';
const doc: any = typeof document !== 'undefined' ? document : null;

function scrollableParent(el: any): any {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const o = getComputedStyle(n).overflowY;
    if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}

function tick() {
  const items: { id: number; url: string; x: number; y: number; w: number; h: number }[] = [];
  registry.forEach((e, id) => {
    const r = e.el?.getBoundingClientRect?.();
    if (!r || !r.width || !r.height) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return;
    const top = doc.elementFromPoint(cx, cy);
    if (!top || !(e.el === top || e.el.contains(top))) return; // covered by something else
    items.push({ id, url: e.url, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  });
  const s = JSON.stringify(items);
  if (s !== last) { last = s; post({ dx: 'links', items }); }
}

let unsub: null | (() => void) = null;
function start() {
  if (timer) return;
  timer = setInterval(tick, 90);
  unsub = onBridge((m) => {
    if (m.dx !== 'scroll') return;
    const e = registry.get(m.id);
    const sc = e && scrollableParent(e.el);
    if (sc) sc.scrollTop += m.dy;
  });
}
function stop() {
  if (timer) { clearInterval(timer); timer = null; }
  unsub?.(); unsub = null;
  last = ''; post({ dx: 'links', items: [] });
}

/** Returns a ref for the button that opens `url`. Does nothing outside the preview. */
export function useExtLink(url: string | null | undefined) {
  const ref = useRef<any>(null);
  const on = useBridgeCaps().links;
  useEffect(() => {
    if (!on || !url || !/^https?:/i.test(url)) return;
    const id = ++seq;
    registry.set(id, { url, get el() { return ref.current; } } as Entry);
    start();
    return () => { registry.delete(id); if (!registry.size) stop(); };
  }, [on, url]);
  return ref;
}

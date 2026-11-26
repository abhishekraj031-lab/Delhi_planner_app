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

const COLS = 12, ROWS = 5;

/** The part of a button that is really visible: sampled on a grid, so anything laid over it (a heart, a header) is left out. */
function visibleBox(el: any, r: DOMRect) {
  let minI = COLS, maxI = -1, minJ = ROWS, maxJ = -1, hits = 0;
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const x = r.left + ((i + 0.5) * r.width) / COLS, y = r.top + ((j + 0.5) * r.height) / ROWS;
      if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) continue;
      const top = doc.elementFromPoint(x, y);
      if (top && (el === top || el.contains(top))) { hits++; minI = Math.min(minI, i); maxI = Math.max(maxI, i); minJ = Math.min(minJ, j); maxJ = Math.max(maxJ, j); }
    }
  }
  if (hits < COLS * ROWS * 0.6) return null; // mostly covered: leave it to the app's own button
  // When part of the button is covered, pull the link in by one cell so it stays clear of the edge of whatever covers it.
  const cut = hits < COLS * ROWS ? 1 : 0;
  const i0 = Math.min(minI + cut, maxI), i1 = Math.max(maxI - cut, i0), j0 = Math.min(minJ + cut, maxJ), j1 = Math.max(maxJ - cut, j0);
  const x0 = r.left + (i0 * r.width) / COLS, x1 = r.left + ((i1 + 1) * r.width) / COLS;
  const y0 = r.top + (j0 * r.height) / ROWS, y1 = r.top + ((j1 + 1) * r.height) / ROWS;
  return { x: Math.round(x0 + 1), y: Math.round(y0 + 1), w: Math.max(1, Math.round(x1 - x0 - 2)), h: Math.max(1, Math.round(y1 - y0 - 2)) };
}

function tick() {
  const items: { id: number; url: string; x: number; y: number; w: number; h: number }[] = [];
  registry.forEach((e, id) => {
    const r = e.el?.getBoundingClientRect?.();
    if (!r || !r.width || !r.height) return;
    const box = visibleBox(e.el, r);
    if (box) items.push({ id, url: e.url, ...box });
  });
  const s = JSON.stringify(items);
  if (s !== last) { last = s; post({ dx: 'links', items }); }
}

let unsub: null | (() => void) = null;
function start() {
  if (timer) return;
  timer = setInterval(tick, 60);
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

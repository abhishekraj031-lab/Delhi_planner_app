import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { tr } from '../i18n';
import { Button, Txt } from './ui';

const FRAME = 280;
const MAX_ZOOM = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Draws the chosen square into a small JPEG. Web only: phones use the system crop screen. */
export function cropToDataUri(src: string, size: { w: number; h: number }, zoom: number, off: { x: number; y: number }, out = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (globalThis as any).Image();
    img.onload = () => {
      const base = FRAME / Math.min(size.w, size.h);
      const k = base * zoom;
      const c = (globalThis as any).document.createElement('canvas');
      c.width = c.height = out;
      c.getContext('2d').drawImage(img, -off.x / k, -off.y / k, FRAME / k, FRAME / k, 0, 0, out, out);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/** Move and zoom a photo inside a round frame, then save the part that is inside it. */
export function CropSheet({ uri, onCancel, onDone }: { uri: string | null; onCancel: () => void; onDone: (uri: string) => void }) {
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const live = useRef({ zoom: 1, off: { x: 0, y: 0 }, size: null as { w: number; h: number } | null });
  live.current = { zoom, off, size };

  useEffect(() => {
    if (!uri) return;
    setSize(null); setZoom(1); setOff({ x: 0, y: 0 }); setErr(''); setBusy(false);
    Image.getSize(uri, (w, h) => {
      setSize({ w, h });
      const base = FRAME / Math.min(w, h);
      setOff({ x: (FRAME - w * base) / 2, y: (FRAME - h * base) / 2 });
    }, () => setErr(tr('Could not open this photo.')));
  }, [uri]);

  // The photo always covers the frame, so there is never an empty gap inside the circle.
  const fit = (z: number, o: { x: number; y: number }, sz = live.current.size) => {
    if (!sz) return o;
    const k = (FRAME / Math.min(sz.w, sz.h)) * z;
    return { x: clamp(o.x, FRAME - sz.w * k, 0), y: clamp(o.y, FRAME - sz.h * k, 0) };
  };
  const changeZoom = (z: number) => {
    const nz = clamp(z, 1, MAX_ZOOM);
    const sz = live.current.size; if (!sz) return;
    const base = FRAME / Math.min(sz.w, sz.h);
    const o = live.current.off, oz = live.current.zoom;
    // Zoom around the centre of the frame.
    const cx = (FRAME / 2 - o.x) / (base * oz), cy = (FRAME / 2 - o.y) / (base * oz);
    setZoom(nz);
    setOff(fit(nz, { x: FRAME / 2 - cx * base * nz, y: FRAME / 2 - cy * base * nz }));
  };

  const start = useRef({ x: 0, y: 0 });
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = live.current.off; },
    onPanResponderMove: (_, g) => setOff(fit(live.current.zoom, { x: start.current.x + g.dx, y: start.current.y + g.dy })),
  }), []);

  // Slider: drag along the track to change zoom.
  const TRACK = 200;
  const sliderPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => changeZoom(1 + (clamp(e.nativeEvent.locationX, 0, TRACK) / TRACK) * (MAX_ZOOM - 1)),
    onPanResponderMove: (e) => changeZoom(1 + (clamp(e.nativeEvent.locationX, 0, TRACK) / TRACK) * (MAX_ZOOM - 1)),
  }), []);

  const base = size ? FRAME / Math.min(size.w, size.h) : 1;
  const save = async () => {
    if (!uri || !size || busy) return;
    setBusy(true);
    try { onDone(await cropToDataUri(uri, size, zoom, off)); } catch { setErr(tr('Could not save this photo. Please try again.')); setBusy(false); }
  };

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[s.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Txt w="bold" style={{ color: colors.white, fontSize: 18 }}>{tr('Adjust your photo')}</Txt>
        <Txt style={{ color: '#cfcfd6', fontSize: 13, textAlign: 'center' }}>{tr('Drag to move. Zoom to choose the part that shows in your profile.')}</Txt>
        <View style={s.frame} {...pan.panHandlers} accessibilityLabel={tr('Photo crop area')}>
          {uri && size ? <Image source={{ uri }} resizeMode="stretch" style={{ position: 'absolute', left: off.x, top: off.y, width: size.w * base * zoom, height: size.h * base * zoom }} /> : null}
          <View pointerEvents="none" style={s.mask} />
        </View>
        <View style={s.zoomRow}>
          <Pressable onPress={() => changeZoom(zoom - 0.5)} accessibilityRole="button" accessibilityLabel={tr('Zoom out')} hitSlop={8} style={s.zbtn}><Minus size={20} color={colors.white} /></Pressable>
          <View {...sliderPan.panHandlers} accessibilityLabel={tr('Zoom')} style={{ width: TRACK, height: 36, justifyContent: 'center' }}>
            <View pointerEvents="none" style={s.track}><View style={[s.fill, { width: ((zoom - 1) / (MAX_ZOOM - 1)) * TRACK }]} /></View>
            <View pointerEvents="none" style={[s.knob, { left: ((zoom - 1) / (MAX_ZOOM - 1)) * TRACK - 11 }]} />
          </View>
          <Pressable onPress={() => changeZoom(zoom + 0.5)} accessibilityRole="button" accessibilityLabel={tr('Zoom in')} hitSlop={8} style={s.zbtn}><Plus size={20} color={colors.white} /></Pressable>
        </View>
        {err ? <Txt style={{ color: '#ffb4a8', fontSize: 13 }}>{err}</Txt> : null}
        <View style={{ flexDirection: 'row', gap: 12, width: FRAME + 40 }}>
          <Button label={tr('Cancel')} outline onPress={onCancel} />
          <Button label={busy ? tr('Saving...') : tr('Use photo')} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}

const B = FRAME / 2;
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(12,12,16,0.96)', alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 20 },
  frame: { width: FRAME, height: FRAME, overflow: 'hidden', backgroundColor: '#222', cursor: 'grab' } as any,
  // A thick round border leaves a clear circle in the middle and darkens the rest.
  mask: { position: 'absolute', left: -B, top: -B, width: FRAME + 2 * B, height: FRAME + 2 * B, borderRadius: (FRAME + 2 * B) / 2, borderWidth: B, borderColor: 'rgba(0,0,0,0.6)' },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zbtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.white },
  knob: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, top: 7 },
});

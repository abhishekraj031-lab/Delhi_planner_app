import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, TextStyle, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../theme';
import { tr } from '../i18n';
import { Txt } from './ui';

const NATIVE = Platform.OS !== 'web';
export type OrbMode = 'idle' | 'listening' | 'thinking' | 'speaking';

export function useReduceMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setR).catch(() => {}); }, []);
  return r;
}

const loop = (v: Animated.Value, ms: number, delay = 0, yoyo = false) =>
  Animated.loop(Animated.sequence([
    Animated.delay(delay),
    Animated.timing(v, { toValue: 1, duration: yoyo ? ms / 2 : ms, easing: yoyo ? Easing.inOut(Easing.sin) : Easing.out(Easing.quad), useNativeDriver: NATIVE }),
    Animated.timing(v, { toValue: 0, duration: yoyo ? ms / 2 : 0, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
  ]));

/** Two soft rings that spread out and fade, like sound leaving the orb. */
export function Rings({ active, size, color = colors.primary }: { active: boolean; size: number; color?: string }) {
  const reduce = useReduceMotion();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || reduce) { a.setValue(0); b.setValue(0); return; }
    const la = loop(a, 1700); const lb = loop(b, 1700, 850);
    la.start(); lb.start();
    return () => { la.stop(); lb.stop(); a.setValue(0); b.setValue(0); };
  }, [active, reduce, a, b]);
  const ring = (v: Animated.Value) => (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color,
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }] }} />
  );
  return <>{ring(a)}{ring(b)}</>;
}

/** The assistant's face: breathes when idle, spreads rings and shows a voice wave when listening or answering, and an orbiting dot while thinking. */
export function Orb({ mode, size = 40 }: { mode: OrbMode; size?: number }) {
  const reduce = useReduceMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const bars = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const talking = mode === 'listening' || mode === 'speaking';

  useEffect(() => {
    if (reduce) { breathe.setValue(0); return; }
    const l = loop(breathe, 2600, 0, true); l.start();
    return () => l.stop();
  }, [reduce, breathe]);
  useEffect(() => {
    if (mode !== 'thinking' || reduce) { spin.setValue(0); return; }
    const l = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: NATIVE })); l.start();
    return () => l.stop();
  }, [mode, reduce, spin]);
  useEffect(() => {
    if (!talking || reduce) { bars.forEach((b) => b.setValue(0)); return; }
    const ls = bars.map((b, i) => loop(b, 420 + i * 90, i * 60, true));
    ls.forEach((l) => l.start());
    return () => ls.forEach((l) => l.stop());
  }, [talking, reduce, bars]);

  const core = size * 0.82;
  const barW = Math.max(3, size * 0.07);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={`Assistant ${mode === 'idle' ? 'ready' : mode}`}>
      <Rings active={talking} size={core} />
      <Animated.View style={{ width: core, height: core, borderRadius: core / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }}>
        <View style={{ position: 'absolute', top: -core * 0.15, left: -core * 0.1, width: core * 0.9, height: core * 0.9, borderRadius: core, backgroundColor: '#7db0ff', opacity: 0.55 }} />
        {talking ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: barW * 0.8, height: core * 0.5 }}>
            {bars.map((b, i) => (
              <Animated.View key={i} style={{ width: barW, height: core * 0.46, borderRadius: barW, backgroundColor: colors.white,
                transform: [{ scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [reduce ? 0.7 : 0.25, 1] }) }] }} />
            ))}
          </View>
        ) : <Sparkles size={core * 0.46} color={colors.white} />}
      </Animated.View>
      {mode === 'thinking' ? (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <View style={{ alignSelf: 'center', width: Math.max(6, size * 0.12), height: Math.max(6, size * 0.12), borderRadius: size, backgroundColor: colors.primary }} />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Just the animated voice bars, no circle: used as a quiet assistant button inside the search bar. */
export function SpeakingBars({ size = 24, color = colors.ink }: { size?: number; color?: string }) {
  const reduce = useReduceMotion();
  const bars = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) { bars.forEach((b) => b.setValue(1)); return; }
    const ls = bars.map((b, i) => loop(b, 420 + i * 90, i * 60, true));
    ls.forEach((l) => l.start());
    return () => ls.forEach((l) => l.stop());
  }, [reduce, bars]);
  const w = Math.max(2.5, size * 0.11);
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: w * 0.75 }}>
      {bars.map((b, i) => (
        <Animated.View key={i} style={{ width: w, height: size * 0.9, borderRadius: w, backgroundColor: color, transform: [{ scaleY: b.interpolate({ inputRange: [0, 1], outputRange: [reduce ? 0.7 : 0.25, 1] }) }] }} />
      ))}
    </View>
  );
}

/** Three bouncing dots, shown while the assistant is working out an answer. */
export function TypingDots() {
  const reduce = useReduceMotion();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduce) return;
    const ls = dots.map((d, i) => loop(d, 700, i * 140, true));
    ls.forEach((l) => l.start());
    return () => ls.forEach((l) => l.stop());
  }, [reduce, dots]);
  return (
    <View style={{ flexDirection: 'row', gap: 5, height: 22, alignItems: 'center' }} accessible accessibilityLabel={tr('Assistant is thinking')}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sub,
          opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }} />
      ))}
    </View>
  );
}

/** Reveals an answer word by word, as if it is being typed. */
export function StreamText({ text, style, onDone }: { text: string; style?: StyleProp<TextStyle>; onDone: () => void }) {
  const reduce = useReduceMotion();
  const words = useRef(text.split(' ')).current;
  const [n, setN] = useState(0);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    if (reduce) { done.current(); return; }
    const t = setInterval(() => setN((x) => { if (x + 1 >= words.length) clearInterval(t); return x + 1; }), 38);
    return () => clearInterval(t);
  }, [reduce, words]);
  useEffect(() => { if (n >= words.length) done.current(); }, [n, words.length]);
  return <Txt style={style}>{reduce ? text : words.slice(0, Math.max(1, n)).join(' ')}</Txt>;
}

import React, { useEffect, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { colors } from '../theme';
import { Txt } from './ui';
import { post } from '../lib/bridge';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

/** The G-pin mark, drawn as one stroke. */
const G_PATH = 'M70.7 24.6 A27 27 0 0 0 23 42 C23 62 38 80 50 92 C62 80 77 62 77 50 H52';
const G_LEN = 200.2;

const cl = (x: number) => Math.min(1, Math.max(0, x));
const prog = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

/** Samples a function of time (seconds) into an animated value that follows the timeline, between a and b. */
function track(T: Animated.Value, a: number, b: number, fn: (t: number) => number | string, step = 1 / 30) {
  const n = Math.max(2, Math.ceil((b - a) / step));
  const ts: number[] = []; const vs: (number | string)[] = [];
  for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n; ts.push(t * 1000); vs.push(fn(t)); }
  return T.interpolate({ inputRange: ts, outputRange: vs as number[], extrapolate: 'clamp' });
}

const WORD = 'Ghummakad'.split('');

/** Launch screen: the G-pin draws itself, pops with ripples, then moves up as "Ghummakad" pops in letter by letter. */
export function Splash({ onDone, ms = 5600 }: { onDone: () => void; ms?: number }) {
  const { width } = useWindowDimensions();
  const k = Math.min(width / 720, 0.7); // everything is laid out on a 720-unit stage
  const T = useRef(new Animated.Value(0)).current;

  const a = useMemo(() => {
    const dash = track(T, 0.2, 1.3, (t) => G_LEN * (1 - easeInOut(prog(t, 0.2, 1.3))));
    const show = track(T, 0.19, 0.22, (t) => (t >= 0.2 ? 1 : 0));
    const scale = track(T, 1.3, 1.85, (t) => { const q = prog(t, 1.3, 1.8); return 1 + 0.14 * Math.sin(Math.PI * easeOut(q)) * (1 - q * 0.3); });
    const lift = track(T, 2.0, 2.7, (t) => -65 * k * easeInOut(prog(t, 2.0, 2.7)));
    const ripple = [1.35, 1.55].map((t0) => ({
      rx: track(T, t0, t0 + 0.9, (t) => 10 + 190 * easeOut(prog(t, t0, t0 + 0.9))),
      ry: track(T, t0, t0 + 0.9, (t) => 4 + 56 * easeOut(prog(t, t0, t0 + 0.9))),
      op: track(T, t0 - 0.01, t0 + 0.9, (t) => { const q = prog(t, t0, t0 + 0.9); return q > 0 && q < 1 ? 0.7 * (1 - q) : 0; }),
    }));
    const letters = WORD.map((_, i) => {
      const s = 2.35 + i * 0.05;
      return {
        op: track(T, s, s + 0.2, (t) => prog(t, s, s + 0.2)),
        y: track(T, s, s + 0.45, (t) => (1 - back(prog(t, s, s + 0.45))) * 40 * k),
        sc: track(T, s, s + 0.45, (t) => 0.5 + 0.5 * back(prog(t, s, s + 0.45))),
      };
    });
    const out = T.interpolate({ inputRange: [ms - 600, ms], outputRange: [1, 0], extrapolate: 'clamp' });
    return { dash, show, scale, lift, ripple, letters, out };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, ms]);

  useEffect(() => {
    post({ dx: 'bar', bg: colors.primary, fg: '#ffffff' }); // preview only: colour the phone's status bar to match
    const run = Animated.timing(T, { toValue: ms, duration: ms, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => { if (finished) { post({ dx: 'bar', bg: '#ffffff', fg: '#111216' }); onDone(); } });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = 720 * k;
  return (
    <Animated.View accessibilityLabel="Ghummakad" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: a.out, transform: [{ scale: a.out.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] }}>
      <StatusBar style="light" />
      <View style={{ width: S, height: S }}>
        <Svg width={S} height={S} viewBox="0 0 720 720" style={{ position: 'absolute', left: 0, top: 0 }}>
          {a.ripple.map((r, i) => (
            <AnimatedEllipse key={i} cx={360} cy={450} rx={r.rx} ry={r.ry} stroke="#ffffff" strokeWidth={4} fill="none" opacity={r.op} />
          ))}
        </Svg>
        <Animated.View style={{ position: 'absolute', left: 240 * k, top: 210 * k, width: 240 * k, height: 300 * k, transform: [{ translateY: a.lift }, { scale: a.scale }], transformOrigin: '50% 85%' }}>
          <Svg width={240 * k} height={300 * k} viewBox="10 4 80 100">
            <AnimatedPath d={G_PATH} stroke="#ffffff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none"
              strokeDasharray={[G_LEN, G_LEN]} strokeDashoffset={a.dash} opacity={a.show} />
          </Svg>
        </Animated.View>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 482 * k, flexDirection: 'row', justifyContent: 'center' }}>
          {WORD.map((c, i) => (
            <Animated.View key={i} style={{ opacity: a.letters[i].op, transform: [{ translateY: a.letters[i].y }, { scale: a.letters[i].sc }] }}>
              <Txt style={{ fontSize: 92 * k, color: colors.white, fontFamily: 'Outfit_800ExtraBold', letterSpacing: -2 * k, lineHeight: 100 * k }}>{c}</Txt>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

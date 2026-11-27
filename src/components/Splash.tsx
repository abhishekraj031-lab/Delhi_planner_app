import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme';
import { Txt } from './ui';
import { Logo } from './Logo';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Battlements along a wall from x0 to x1 at height y. */
const crenels = (x0: number, x1: number, y: number, h = 5, w = 7) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x + w <= x1; x += w * 2) d += ` V${y - h} H${x + w} V${y} H${Math.min(x + w * 2, x1)}`;
  return d;
};

/** One monument per entry, drawn left to right along the ground line. Each is a single outline path. */
const MONUMENTS: { name: string; d: string; len: number }[] = [
  { name: "Humayun's Tomb", d: 'M8 120 V104 H78 V120 M16 104 V88 H70 V104 M36 104 V95 Q43 87 50 95 V104 M26 88 Q43 54 60 88 M43 63 V54', len: 282 },
  { name: 'Red Fort', d: `M92 120 V74 H170 V120 ${crenels(92, 170, 74)} M118 120 V98 Q131 84 144 98 V120 M96 74 V64 Q103 56 110 64 V74 M152 74 V64 Q159 56 166 64 V74`, len: 456 },
  { name: 'India Gate', d: 'M190 120 V52 H246 V120 M186 52 H250 V45 H186 Z M206 120 V84 Q218 58 230 84 V120 M214 45 V38 H222 V45', len: 466 },
  { name: 'Qutub Minar', d: 'M276 120 L280 32 H288 L292 120 M277 100 H291 M278 78 H290 M279 56 H289 M280 32 Q284 22 288 32 M284 22 V12', len: 244 },
  { name: 'Lotus Temple', d: 'M314 120 Q314 92 334 68 Q354 92 354 120 M324 120 Q324 96 334 78 Q344 96 344 120 M334 68 V60 M314 120 H354', len: 250 },
];

/** Launch screen: Delhi monument outlines draw themselves along a skyline, then the app name appears. */
export function Splash({ onDone, ms = 2500 }: { onDone: () => void; ms?: number }) {
  const { width } = useWindowDimensions();
  const draw = useRef(MONUMENTS.map(() => new Animated.Value(0))).current;
  const ground = useRef(new Animated.Value(0)).current;
  const sun = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const pin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seg = Math.round(ms * 0.5);
    Animated.parallel([
      Animated.timing(sun, { toValue: 1, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(ground, { toValue: 1, duration: 500, useNativeDriver: false }),
      Animated.stagger(Math.round(ms * 0.1), draw.map((v) => Animated.timing(v, { toValue: 1, duration: seg, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }))),
      Animated.sequence([Animated.delay(Math.round(ms * 0.4)), Animated.spring(pin, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(Math.round(ms * 0.55)), Animated.timing(title, { toValue: 1, duration: Math.round(ms * 0.2), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(ms - 280), Animated.timing(out, { toValue: 0, duration: 280, useNativeDriver: true })]),
    ]).start(() => onDone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const w = Math.min(width - 32, 460);
  return (
    <Animated.View accessibilityLabel="Delhi Explorer" style={{ flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: out }}>
      <Animated.View style={{ marginBottom: 12, opacity: pin.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: pin.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }, { scale: pin.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
        <Logo size={96} />
      </Animated.View>
      <View style={{ width: w, height: (w * 150) / 360 }}>
        <Svg width="100%" height="100%" viewBox="0 0 360 150">
          <AnimatedSun v={sun} />
          {MONUMENTS.map((m, i) => (
            <AnimatedPath key={m.name} d={m.d} strokeDasharray={`${m.len} ${m.len}`}
              strokeDashoffset={draw[i].interpolate({ inputRange: [0, 1], outputRange: [m.len, 0] }) as unknown as number}
              stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
          <AnimatedLine x1={0} x2={360} y1={120} y2={120} stroke={colors.white} strokeWidth={2.4} strokeLinecap="round"
            strokeOpacity={ground as unknown as number} />
        </Svg>
      </View>
      <Animated.View style={{ marginTop: 28, alignItems: 'center', gap: 4, opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        <Txt w="bold" style={{ fontSize: 30, color: colors.white }}>Delhi Explorer</Txt>
        <Txt style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>दिल्ली एक्सप्लोरर</Txt>
      </Animated.View>
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** A faint sun that slowly rises behind the monuments. */
function AnimatedSun({ v }: { v: Animated.Value }) {
  return (
    <AnimatedCircle cx={262} r={30} fill={colors.white}
      cy={v.interpolate({ inputRange: [0, 1], outputRange: [150, 52] }) as unknown as number}
      fillOpacity={v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }) as unknown as number} />
  );
}

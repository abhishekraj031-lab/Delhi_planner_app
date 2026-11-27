import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import { Txt } from './ui';
import { post } from '../lib/bridge';

/** Battlements along a wall from x0 to x1 at height y. */
const crenels = (x0: number, x1: number, y: number, h = 5, w = 5) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x + w <= x1; x += w * 2) d += ` V${y - h} H${x + w} V${y} H${Math.min(x + w * 2, x1)}`;
  return d;
};

/** Monument outlines on a 64 x 64 grid. */
const ICONS: { name: string; d: string }[] = [
  { name: 'Qutub Minar', d: 'M26 58 L29 14 H35 L38 58 M27 46 H37 M28 34 H36 M29 24 H35 M29 14 Q32 8 35 14 M32 8 V3' },
  { name: 'Red Fort', d: `M6 58 V30 H58 V58 ${crenels(6, 58, 30)} M10 30 V22 Q15 15 20 22 V30 M44 30 V22 Q49 15 54 22 V30 M24 58 V43 Q32 33 40 43 V58` },
  { name: 'India Gate', d: 'M12 58 V22 H52 V58 M8 22 H56 V15 H8 Z M24 58 V36 Q32 20 40 36 V58' },
  { name: 'Lotus Temple', d: 'M10 58 Q10 36 32 14 Q54 36 54 58 M20 58 Q20 40 32 26 Q44 40 44 58 M32 14 V8 M6 58 H58' },
  { name: "Humayun's Tomb", d: 'M6 58 V47 H58 V58 M12 47 V37 H52 V47 M26 47 V41 Q32 35 38 41 V47 M18 37 Q32 8 46 37 M32 15 V6' },
  { name: 'Jama Masjid', d: 'M12 58 V16 M9 16 H15 M12 16 V10 M52 58 V16 M49 16 H55 M52 16 V10 M18 58 V42 H46 V58 M21 42 Q32 22 43 42 M32 23 V16' },
];
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A winding route on a 360 x 560 board. Its measured length lets the line draw itself on every platform. */
const ROUTE = 'M-10 520 C 120 540, 300 500, 250 420 S 20 380, 70 300 S 330 270, 280 190 S 60 150, 120 80 S 300 40, 380 20';
const ROUTE_LEN = 1345;
/** Where each monument sits on the route: fraction of the way along, and board position. */
const STOPS: { f: number; x: number; y: number }[] = [
  { f: 0.1, x: 124, y: 521 }, { f: 0.26, x: 236, y: 403 }, { f: 0.42, x: 65, y: 308 },
  { f: 0.58, x: 260, y: 236 }, { f: 0.74, x: 145, y: 128 }, { f: 0.9, x: 246, y: 31 },
];
const WORD = 'Ghummakad'.split('');

/** Launch screen: a route draws itself across the screen, monuments appear at each stop, then the route and every monument fly into the Ghummakad wordmark. */
export function Splash({ onDone, ms = 5400 }: { onDone: () => void; ms?: number }) {
  const { width, height } = useWindowDimensions();
  const sc = Math.min(width / 360, (height - 60) / 560);
  const ICON = 56;
  const BX = 360 * sc, BY = 560 * sc;
  const draw = useRef(new Animated.Value(0)).current;
  const erase = useRef(new Animated.Value(0)).current;
  const merge = useRef(new Animated.Value(0)).current;
  const pop = useRef(STOPS.map(() => new Animated.Value(0))).current;
  const letters = useRef(WORD.map(() => new Animated.Value(0))).current;
  const land = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    post({ dx: 'bar', bg: colors.primary, fg: '#ffffff' }); // preview only: colour the phone's status bar to match
    const T0 = 250, DRAW = 2400, M = 3200;
    const run = Animated.parallel([
      Animated.sequence([Animated.delay(T0), Animated.timing(draw, { toValue: 1, duration: DRAW, easing: Easing.linear, useNativeDriver: false })]),
      ...STOPS.map((st, i) => Animated.sequence([Animated.delay(T0 + st.f * DRAW - 80), Animated.spring(pop[i], { toValue: 1, friction: 5, tension: 90, useNativeDriver: true })])),
      Animated.sequence([Animated.delay(M), Animated.timing(erase, { toValue: 1, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: false })]),
      Animated.sequence([Animated.delay(M), Animated.timing(merge, { toValue: 1, duration: 700, easing: Easing.in(Easing.back(1.3)), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(M + 420), Animated.stagger(60, letters.map((v) => Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true })))]),
      Animated.sequence([Animated.delay(M + 420), Animated.timing(land, { toValue: 1, duration: 140, useNativeDriver: true }), Animated.timing(land, { toValue: 0, duration: 260, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(ms - 450), Animated.timing(out, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
    ]);
    run.start(() => { post({ dx: 'bar', bg: '#ffffff', fg: '#111216' }); onDone(); });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offset = Animated.subtract(draw.interpolate({ inputRange: [0, 1], outputRange: [ROUTE_LEN, 0] }), Animated.multiply(erase, ROUTE_LEN));

  return (
    <Animated.View accessibilityLabel="Ghummakad" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: out.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }}>
      <StatusBar style="light" />
      <View style={{ width: BX, height: BY }}>
        <Svg width={BX} height={BY} viewBox="0 0 360 560" style={{ position: 'absolute' }}>
          <AnimatedPath d={ROUTE} stroke="rgba(255,255,255,0.85)" strokeWidth={3} strokeLinecap="round" strokeDasharray={[ROUTE_LEN, ROUTE_LEN]} strokeDashoffset={offset as unknown as number} fill="none" />
        </Svg>
        {STOPS.map((st, i) => {
          const dx = (BX / 2) - st.x * sc, dy = (BY / 2) - st.y * sc;
          return (
            <Animated.View key={i} style={{
              position: 'absolute', left: st.x * sc - ICON / 2, top: st.y * sc - ICON / 2, width: ICON, height: ICON, borderRadius: ICON / 2, alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)',
              opacity: Animated.multiply(pop[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), merge.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] })),
              transform: [
                { translateX: Animated.multiply(merge, dx) }, { translateY: Animated.multiply(merge, dy) },
                { scale: Animated.multiply(pop[i], merge.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] })) },
                { rotate: pop[i].interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
              ],
            }}>
              <Svg width={34} height={34} viewBox="0 0 64 64"><Path d={ICONS[i].d} stroke={colors.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
            </Animated.View>
          );
        })}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ flexDirection: 'row', transform: [{ scale: land.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
            {WORD.map((c, i) => (
              <Animated.View key={i} style={{ opacity: letters[i], transform: [{ translateY: letters[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }, { scale: letters[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
                <Txt style={{ fontSize: 46, color: colors.white, fontFamily: 'Outfit_800ExtraBold', letterSpacing: -0.5, lineHeight: 54 }}>{c}</Txt>
              </Animated.View>
            ))}
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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
const TILTS = [-8, 6, -4, 8, -6, 5];

/** Launch screen: monument icons burst out around the logo, then fly into the Ghummakad wordmark, which fills in letter by letter as they land. */
export function Splash({ onDone, ms = 6200 }: { onDone: () => void; ms?: number }) {
  const { width } = useWindowDimensions();
  const R = Math.min(width * 0.34, 150);
  const ICON = 64;
  const pop = useRef(ICONS.map(() => new Animated.Value(0))).current;
  const merge = useRef(new Animated.Value(0)).current;
  /** The first "a" of the name is drawn as a map pin. */
const PIN_AT = 5;
const PIN = 'M0 -13 C7.5 -13 12 -7.5 12 -2.5 C12 6 0 15 0 15 C0 15 -12 6 -12 -2.5 C-12 -7.5 -7.5 -13 0 -13 Z';
const WORD = 'Ghummakad'.split('');
  const TY = 0; // wordmark sits at the exact centre; icons fly into it
  const letters = useRef(WORD.map(() => new Animated.Value(0))).current;
  const land = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const ripple = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    post({ dx: 'bar', bg: colors.primary, fg: '#ffffff' }); // preview only: colour the phone's status bar to match
    const loops = ripple.map((v, i) => Animated.loop(Animated.sequence([Animated.delay(i * 700), Animated.timing(v, { toValue: 1, duration: 2100, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })])));
    loops.forEach((l) => l.start());
    const bob = Animated.loop(Animated.sequence([Animated.timing(float, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(float, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    bob.start();
    const run = Animated.parallel([
      Animated.stagger(130, pop.map((v) => Animated.spring(v, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }))),
      Animated.sequence([Animated.delay(2300), Animated.timing(merge, { toValue: 1, duration: 650, easing: Easing.in(Easing.back(1.4)), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(2300 + 380), Animated.stagger(60, letters.map((v) => Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true })))]),
      Animated.sequence([Animated.delay(2300 + 380), Animated.sequence([Animated.timing(land, { toValue: 1, duration: 140, useNativeDriver: true }), Animated.timing(land, { toValue: 0, duration: 260, useNativeDriver: true })])]),
      Animated.sequence([Animated.delay(ms - 600), Animated.timing(out, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })]),
    ]);
    run.start(() => { loops.forEach((l) => l.stop()); bob.stop(); post({ dx: 'bar', bg: '#ffffff', fg: '#111216' }); onDone(); });
    return () => { loops.forEach((l) => l.stop()); bob.stop(); run.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStyle = (i: number) => {
    const a = (-90 + i * 60) * (Math.PI / 180);
    const x = Math.cos(a) * R, y = Math.sin(a) * R;
    const burst = pop[i];
    const away = merge.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    return {
      position: 'absolute' as const, width: ICON, height: ICON, borderRadius: ICON / 2, alignItems: 'center' as const, justifyContent: 'center' as const,
      backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)',
      opacity: Animated.multiply(burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }), merge.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] })),
      transform: [
        { translateX: Animated.multiply(Animated.multiply(burst, away), x) },
        { translateY: Animated.add(Animated.add(Animated.multiply(Animated.multiply(burst, away), y), Animated.multiply(merge, TY)), Animated.multiply(away, float.interpolate({ inputRange: [0, 1], outputRange: [i % 2 ? -4 : 4, i % 2 ? 4 : -4] }))) },
        { scale: Animated.multiply(burst, merge.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] })) },
        { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', `${TILTS[i]}deg`] }) },
      ],
    };
  };

  return (
    <Animated.View accessibilityLabel="Ghummakad" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: out, transform: [{ scale: out.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] }}>
      <StatusBar style="light" />
      <View style={{ width: R * 2 + ICON, height: R * 2 + ICON, alignItems: 'center', justifyContent: 'center' }}>
        {ripple.map((v, i) => (
          <Animated.View key={i} style={{ position: 'absolute', width: R * 1.2, height: R * 1.2, borderRadius: R * 0.6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.3] }) }] }} />
        ))}
        {ICONS.map((m, i) => (
          <Animated.View key={m.name} style={iconStyle(i)}>
            <Svg width={38} height={38} viewBox="0 0 64 64"><Path d={m.d} stroke={colors.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
          </Animated.View>
        ))}
        <Animated.View style={{ position: 'absolute', alignItems: 'center', transform: [{ translateY: TY }, { scale: land.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
          <View style={{ flexDirection: 'row' }}>
            {WORD.map((c, i) => (
              <Animated.View key={i} style={{ opacity: letters[i], transform: [{ translateY: letters[i].interpolate({ inputRange: [0, 1], outputRange: [i === PIN_AT ? -34 : 14, 0] }) }, { scale: letters[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
                {i === PIN_AT ? (
                  <View style={{ height: 54, justifyContent: 'flex-end', paddingBottom: 12, paddingHorizontal: 1 }}>
                    <Svg width={25} height={31} viewBox="-13 -15 26 32"><Path d={PIN} fill={colors.white} /><Circle r={4.6} cy={-3} fill={colors.primary} /></Svg>
                  </View>
                ) : (
                  <Txt style={{ fontSize: 46, color: colors.white, fontFamily: 'Outfit_800ExtraBold', letterSpacing: -0.5, lineHeight: 54 }}>{c}</Txt>
                )}
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

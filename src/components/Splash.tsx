import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '../theme';
import { Txt } from './ui';
import { post } from '../lib/bridge';
import { CLOUDS, GROUND, SKY, SKY_H, SKY_W } from './skylineData';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const WORD = 'Ghummakad'.split('');
/** A small burst of rays, drawn around (0,0). */
const SPARK = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${(Math.cos(a) * 5).toFixed(1)} ${(Math.sin(a) * 5).toFixed(1)} L${(Math.cos(a) * 11).toFixed(1)} ${(Math.sin(a) * 11).toFixed(1)}`; }).join(' ');
const SPARKS = [{ x: 38, y: 62 }, { x: 118, y: 74 }, { x: 204, y: 44 }, { x: 300, y: 70 }];

/** Launch screen: a Delhi skyline draws itself in outline, then collapses into the Ghummakad wordmark. */
export function Splash({ onDone, ms = 5600 }: { onDone: () => void; ms?: number }) {
  const { width } = useWindowDimensions();
  const sc = Math.min(width / SKY_W, 1.15);
  const TOP = 20; // crop empty sky so the skyline sits in the middle of the screen
  const BW = SKY_W * sc, BH = (SKY_H - TOP) * sc;
  const ground = useRef(new Animated.Value(0)).current;
  const monu = useRef(SKY.map(() => new Animated.Value(0))).current;
  const cloud = useRef(CLOUDS.map(() => new Animated.Value(0))).current;
  const spark = useRef(SPARKS.map(() => new Animated.Value(0))).current;
  const merge = useRef(new Animated.Value(0)).current;
  const letters = useRef(WORD.map(() => new Animated.Value(0))).current;
  const land = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    post({ dx: 'bar', bg: colors.primary, fg: '#ffffff' }); // preview only: colour the phone's status bar to match
    const M = 3900;
    const draw = (v: Animated.Value, delay: number, dur: number) => Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.quad), useNativeDriver: false })]);
    const run = Animated.parallel([
      draw(ground, 150, 700),
      ...monu.map((v, i) => draw(v, 550 + i * 430, 900)),
      ...cloud.map((v, i) => draw(v, 1500 + i * 450, 1000)),
      ...spark.map((v, i) => Animated.sequence([Animated.delay(2500 + i * 220), Animated.spring(v, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true })])),
      Animated.sequence([Animated.delay(M), Animated.timing(merge, { toValue: 1, duration: 650, easing: Easing.in(Easing.cubic), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(M + 380), Animated.stagger(60, letters.map((v) => Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true })))]),
      Animated.sequence([Animated.delay(M + 380), Animated.timing(land, { toValue: 1, duration: 140, useNativeDriver: true }), Animated.timing(land, { toValue: 0, duration: 260, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(ms - 450), Animated.timing(out, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
    ]);
    run.start(() => { post({ dx: 'bar', bg: '#ffffff', fg: '#111216' }); onDone(); });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const line = (d: string, len: number, v: Animated.Value, key: string, w = 1.4) => (
    <AnimatedPath key={key} d={d} stroke="rgba(255,255,255,0.92)" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[len, len]} strokeDashoffset={v.interpolate({ inputRange: [0, 1], outputRange: [len, 0] }) as unknown as number} fill="none" />
  );

  return (
    <Animated.View accessibilityLabel="Ghummakad" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: out.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }}>
      <StatusBar style="light" />
      <View style={{ width: BW, height: BH }}>
        <Animated.View style={{ position: 'absolute', width: BW, height: BH, opacity: merge.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }), transform: [{ scale: merge.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }) }] }}>
          <Svg width={BW} height={BH} viewBox={`0 ${TOP} ${SKY_W} ${SKY_H - TOP}`}>
            {line(GROUND.d, GROUND.len, ground, 'ground', 1.6)}
            {SKY.map((m, i) => line(m.d, m.len, monu[i], m.name))}
            {CLOUDS.map((c, i) => (
              <G key={i} transform={`translate(${c.x} ${c.y})`}>{line(c.d, c.len, cloud[i], `c${i}`, 1.2)}</G>
            ))}
          </Svg>
          {SPARKS.map((sp, i) => (
            <Animated.View key={i} style={{ position: 'absolute', left: sp.x * sc - 12 * sc, top: (sp.y - TOP) * sc - 12 * sc, opacity: spark[i], transform: [{ scale: spark[i] }, { rotate: spark[i].interpolate({ inputRange: [0, 1], outputRange: ['-45deg', '0deg'] }) }] }}>
              <Svg width={24 * sc} height={24 * sc} viewBox="-12 -12 24 24"><Path d={SPARK} stroke="#fff" strokeWidth={1.2} strokeLinecap="round" fill="none" /></Svg>
            </Animated.View>
          ))}
        </Animated.View>
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

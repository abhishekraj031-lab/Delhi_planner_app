import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme';
import { Txt } from './ui';
import { post } from '../lib/bridge';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const REST = 'hummakad'.split('');
const MARK = 76; // size of the G mark
/** A bold geometric G: an open ring with a short bar. Measured length so it can draw itself. */
const G_PATH = 'M74.5 29.4 A32 32 0 1 0 81.9 52.8 M82 52.8 H57';
const G_LEN = 215;
/** A small map pin, centred on (0,0). */
const PIN = 'M0 -13 C7.5 -13 12 -7.5 12 -2.5 C12 6 0 15 0 15 C0 15 -12 6 -12 -2.5 C-12 -7.5 -7.5 -13 0 -13 Z';

/** Launch screen: a G draws itself, spins like a compass, a pin pops out of it, then the rest of the name appears. */
export function Splash({ onDone, ms = 4300 }: { onDone: () => void; ms?: number }) {
  const { width } = useWindowDimensions();
  const [rest, setRest] = useState(190); // measured width of "hummakad"
  const draw = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const pin = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(0)).current;
  const letters = useRef(REST.map(() => new Animated.Value(0))).current;
  const out = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    post({ dx: 'bar', bg: colors.primary, fg: '#ffffff' }); // preview only: colour the phone's status bar to match
    const run = Animated.parallel([
      Animated.sequence([Animated.delay(250), Animated.timing(draw, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: false })]),
      Animated.sequence([Animated.delay(1150), Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(1050), Animated.timing(ring, { toValue: 1, duration: 300, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(2050), Animated.spring(pin, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(2650), Animated.timing(shift, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
      Animated.sequence([Animated.delay(2750), Animated.stagger(55, letters.map((v) => Animated.spring(v, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true })))]),
      Animated.sequence([Animated.delay(ms - 450), Animated.timing(out, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })]),
    ]);
    run.start(() => { post({ dx: 'bar', bg: '#ffffff', fg: '#111216' }); onDone(); });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gap = 6;
  return (
    <Animated.View accessibilityLabel="Ghummakad" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: out.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* the G mark; starts centred on screen, then slides left as the rest of the name arrives */}
        <Animated.View style={{ width: MARK, height: MARK, transform: [{ translateX: shift.interpolate({ inputRange: [0, 1], outputRange: [(rest + gap) / 2, 0] }) }] }}>
          <Animated.View style={{ position: 'absolute', left: -16, top: -16, width: MARK + 32, height: MARK + 32, opacity: Animated.multiply(ring.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }), shift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) }}>
            <Animated.View style={{ flex: 1, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }] }}>
              <Svg width="100%" height="100%" viewBox="-54 -54 108 108">
                <Circle r={50} stroke="#fff" strokeWidth={1.2} fill="none" strokeDasharray="2 5" />
                {[0, 90, 180, 270].map((a) => <Line key={a} x1={0} y1={-50} x2={0} y2={-43} stroke="#fff" strokeWidth={2} strokeLinecap="round" transform={`rotate(${a})`} />)}
              </Svg>
            </Animated.View>
          </Animated.View>
          <Animated.View style={{ width: MARK, height: MARK, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
            <Svg width={MARK} height={MARK} viewBox="0 0 100 100">
              <AnimatedPath d={G_PATH} stroke="#fff" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={[G_LEN, G_LEN]} strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [G_LEN, 0] }) as unknown as number} />
            </Svg>
          </Animated.View>
          {/* the pin pops out of the middle of the G */}
          <Animated.View style={{ position: 'absolute', left: MARK / 2 - 13, top: MARK / 2 - 16, opacity: pin.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: pin.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, { scale: pin }] }}>
            <Svg width={26} height={32} viewBox="-13 -15 26 32"><Path d={PIN} fill={colors.secondary} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" /><Circle r={4.2} cy={-3} fill="#fff" /></Svg>
          </Animated.View>
        </Animated.View>
        <View style={{ flexDirection: 'row', marginLeft: gap }} onLayout={(e) => { const w = e.nativeEvent.layout.width; if (w > 0 && Math.abs(w - rest) > 1) setRest(w); }}>
          {REST.map((c, i) => (
            <Animated.View key={i} style={{ opacity: letters[i], transform: [{ translateX: letters[i].interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }, { scale: letters[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
              <Txt style={{ fontSize: 44, color: colors.white, fontFamily: 'Outfit_800ExtraBold', letterSpacing: -0.5, lineHeight: 54 }}>{c}</Txt>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

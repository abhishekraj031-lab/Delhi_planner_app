import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

const NATIVE = Platform.OS !== 'web';

/** Small shared motion: content fades in and rises a few pixels. Skipped when the user turns on Reduce Motion. */
function Inner({ children, style, dy, ms }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; dy: number; ms: number }) {
  const v = useRef(new Animated.Value(0.35)).current; // starts part-visible so a tab switch never flashes blank
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!live) return;
      if (reduce) { v.setValue(1); return; }
      Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
    }).catch(() => v.setValue(1));
    return () => { live = false; };
  }, [v, ms]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dy * 1.5, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Replays the fade-and-rise whenever `k` changes (a new tab or category). */
export function FadeSlide({ k, children, style, dy = 10, ms = 220 }: { k: string; children: React.ReactNode; style?: StyleProp<ViewStyle>; dy?: number; ms?: number }) {
  return <Inner key={k} style={style} dy={dy} ms={ms}>{children}</Inner>;
}

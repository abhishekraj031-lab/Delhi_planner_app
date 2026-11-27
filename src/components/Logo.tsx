import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

/** Ghummakad mark: the letter G drawn as a map pin. */
export function Logo({ size = 80, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Ghummakad logo">
      <Path d="M70.7 24.6 A27 27 0 0 0 23 42 C23 62 38 80 50 92 C62 80 77 62 77 50 H52" stroke={color} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

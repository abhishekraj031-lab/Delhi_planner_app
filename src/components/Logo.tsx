import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

/** Ghummakad mark: a bold G (an open ring with a bar) with a map pin dropped into its centre. */
export function Logo({ size = 80, ring = colors.white, pin = colors.secondary }: { size?: number; ring?: string; pin?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Ghummakad logo">
      <Path d="M74.5 29.4 A32 32 0 1 0 81.9 52.8 M82 52.8 H57" stroke={ring} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path transform="translate(50 49) scale(1.3)" d="M0 -13 C7.5 -13 12 -7.5 12 -2.5 C12 6 0 15 0 15 C0 15 -12 6 -12 -2.5 C-12 -7.5 -7.5 -13 0 -13 Z" fill={pin} stroke={ring} strokeWidth={1.6} strokeLinejoin="round" />
      <Circle cx={50} cy={45.1} r={5.5} fill={ring} />
    </Svg>
  );
}

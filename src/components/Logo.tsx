import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

/** Ghummakad mark: a map pin with a bold G inside its round head. */
export function Logo({ size = 80, pin = colors.white, g = colors.secondary }: { size?: number; pin?: string; g?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Ghummakad logo">
      <Path d="M50 95 C33 79 19 60 19 40 A31 31 0 0 1 81 40 C81 60 67 79 50 95 Z" fill={pin} />
      <Path d="M61.5 30.4 A15 15 0 1 0 64.9 41.3 M64.9 41.3 H53.4" stroke={g} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

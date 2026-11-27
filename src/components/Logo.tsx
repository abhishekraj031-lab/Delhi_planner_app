import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

/** Ghummakad mark: a map pin holding a domed monument with an arched gate. */
export function Logo({ size = 80, pin = colors.white, detail = colors.primary }: { size?: number; pin?: string; detail?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Ghummakad logo">
      <Path d="M60 8 C37 8 20 26 20 48 C20 78 60 112 60 112 C60 112 100 78 100 48 C100 26 83 8 60 8 Z" fill={pin} />
      {/* spire, dome, band, body with arched gate */}
      <Rect x={59} y={20} width={2} height={9} rx={1} fill={detail} />
      <Circle cx={60} cy={19} r={2.6} fill={detail} />
      <Path d="M44 46 C44 36 51 30 60 28 C69 30 76 36 76 46 Z" fill={detail} />
      <Rect x={40} y={46} width={40} height={5} rx={1.5} fill={detail} />
      <Path d="M44 51 H76 V72 H44 Z M54 72 V62 C54 57 66 57 66 62 V72 Z" fill={detail} fillRule="evenodd" />
      <Rect x={38} y={72} width={44} height={4} rx={1.5} fill={detail} />
      <Circle cx={30} cy={36} r={0} fill={detail} />
    </Svg>
  );
}

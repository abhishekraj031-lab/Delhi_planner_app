import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import type { Category } from '../types';

/** Original, hand-drawn 3D-style category icons: lit face, shaded side, soft ground shadow. Warm sandstone palette with one blue accent. */
const BASE = { hi: '#FFC9A0', lit: '#FF9A55', mid: '#F2681C', shade: '#C4500F', deep: '#8F3A0A', cream: '#FFEBDA', blue: '#1D5FC4', blueHi: '#6FA2EE' };

const PAL = {
  Monuments: {},
  Landmarks: { hi: '#FBE3B0', lit: '#EDBE6A', mid: '#D69A35', shade: '#A87020', deep: '#6B4510', cream: '#FFF4D9' },
  Museums: { hi: '#CFE0FA', lit: '#8DB4EE', mid: '#4F86DB', shade: '#2F5FAE', deep: '#1B3B73', cream: '#F3F8FF' },
  Religious: { hi: '#E3D6FF', lit: '#B697FA', mid: '#8A5CF0', shade: '#5F36C0', deep: '#3A1F82', cream: '#F6F1FF', blue: '#F2B01E', blueHi: '#FFD76A' },
  Gardens: { hi: '#D3F5C6', lit: '#7FD36B', mid: '#3FAE4B', shade: '#2A8038', deep: '#1B5226', cream: '#F0FFE9' },
  Markets: { hi: '#FFC2D6', lit: '#F77AA6', mid: '#E0457F', shade: '#B02A5E', deep: '#701638', cream: '#FFE6EF', blue: '#F5B01B', blueHi: '#FFD86B' },
  Entertainment: { hi: '#BBD3FA', lit: '#6FA2EE', mid: '#2C7AEF', shade: '#1D5FC4', deep: '#123A7A', cream: '#FFF3C9', blue: '#F2681C', blueHi: '#FF9A55' },
};

function Grad({ id, a, b, vertical }: { id: string; a: string; b: string; vertical?: boolean }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      <Stop offset="0" stopColor={a} /><Stop offset="1" stopColor={b} />
    </LinearGradient>
  );
}
const Shadow = ({ cx = 24, rx = 17 }: { cx?: number; rx?: number }) => <Ellipse cx={cx} cy={43.5} rx={rx} ry={2.4} fill="#000" opacity={0.14} />;

/** One tapering tower section: left half lit, right half shaded. */
function Tier({ yb, yt, hb, ht }: { yb: number; yt: number; hb: number; ht: number }) {
  return (
    <>
      <Polygon points={`${24 - hb},${yb} 24,${yb + 1.2} 24,${yt + 1.2} ${24 - ht},${yt}`} fill="url(#qL)" />
      <Polygon points={`${24 + hb},${yb} 24,${yb + 1.2} 24,${yt + 1.2} ${24 + ht},${yt}`} fill="url(#qR)" />
    </>
  );
}
const Slab = ({ y, hw }: { y: number; hw: number }) => (
  <>
    <Rect x={24 - hw} y={y} width={hw * 2} height={1.8} rx={0.9} fill={BASE.hi} />
    <Rect x={24 - hw} y={y + 1.2} width={hw * 2} height={1} rx={0.5} fill={BASE.deep} opacity={0.55} />
  </>
);

function Monuments() {
  const C = { ...BASE, ...PAL.Monuments };
  return (
    <>
      <Defs><Grad id="qL" a={C.hi} b={C.lit} /><Grad id="qR" a={C.shade} b={C.deep} /><Grad id="qD" a={C.lit} b={C.shade} /></Defs>
      <Shadow rx={13} />
      <Rect x={14} y={40} width={20} height={3} rx={1} fill={C.shade} />
      <Tier yb={40} yt={28} hb={8} ht={6.5} /><Slab y={27} hw={8.2} />
      <Tier yb={27} yt={17} hb={6.5} ht={5} /><Slab y={16} hw={6.8} />
      <Tier yb={16} yt={9} hb={5} ht={3.8} /><Slab y={8} hw={5.2} />
      <Path d="M20.4 8 Q24 1.5 27.6 8 Z" fill="url(#qD)" />
      <Line x1={24} y1={3.6} x2={24} y2={0.8} stroke={C.deep} strokeWidth={1.3} strokeLinecap="round" />
    </>
  );
}

function Landmarks() {
  const C = { ...BASE, ...PAL.Landmarks };
  return (
    <>
      <Defs><Grad id="gF" a={C.hi} b={C.lit} vertical /><Grad id="gS" a={C.shade} b={C.deep} vertical /><Grad id="gT" a={C.cream} b={C.hi} /></Defs>
      <Shadow rx={19} />
      <Polygon points="30,14 38,10 38,38 30,41" fill="url(#gS)" />
      <Polygon points="8,14 16,10 38,10 30,14" fill="url(#gT)" />
      <Rect x={8} y={14} width={22} height={27} fill="url(#gF)" />
      <Rect x={8} y={14} width={22} height={3} fill={C.cream} opacity={0.55} />
      <Path d="M14.5 41 V27 Q19 18.5 23.5 27 V41 Z" fill={C.deep} />
      <Path d="M16.5 41 V28 Q19 23 21.5 28 V41 Z" fill={C.shade} opacity={0.7} />
      <Rect x={8} y={20} width={22} height={1.2} fill={C.shade} opacity={0.35} />
    </>
  );
}

function Museums() {
  const C = { ...BASE, ...PAL.Museums };
  return (
    <>
      <Defs><Grad id="mC" a={C.cream} b={C.lit} /><Grad id="mL" a={C.hi} b={C.mid} /><Grad id="mR" a={C.shade} b={C.deep} /></Defs>
      <Shadow rx={19} />
      <Polygon points="6,18 24,7 24,18" fill="url(#mL)" />
      <Polygon points="42,18 24,7 24,18" fill="url(#mR)" />
      <Circle cx={24} cy={13.5} r={2} fill={C.cream} opacity={0.85} />
      <Rect x={5} y={18} width={38} height={3.4} rx={0.8} fill={C.hi} />
      <Rect x={5} y={20.4} width={38} height={1.2} fill={C.deep} opacity={0.45} />
      {[9, 16, 23, 30, 36].map((x) => <Rect key={x} x={x} y={22} width={3.6} height={14} rx={1} fill="url(#mC)" />)}
      <Rect x={7} y={36} width={34} height={3} rx={0.8} fill={C.lit} />
      <Rect x={4.5} y={39} width={39} height={3.6} rx={0.9} fill={C.mid} />
      <Rect x={4.5} y={41.4} width={39} height={1.2} fill={C.deep} opacity={0.5} />
    </>
  );
}

function Religious() {
  const C = { ...BASE, ...PAL.Religious };
  return (
    <>
      <Defs>
        <LinearGradient id="rD" x1="0" y1="0" x2="1" y2="0.4"><Stop offset="0" stopColor={C.cream} /><Stop offset="0.45" stopColor={C.lit} /><Stop offset="1" stopColor={C.deep} /></LinearGradient>
        <Grad id="rM" a={C.hi} b={C.shade} />
      </Defs>
      <Shadow rx={19} />
      <Rect x={5} y={20} width={4.6} height={22} rx={1.2} fill="url(#rM)" />
      <Path d="M5 20 Q7.3 14 9.6 20 Z" fill={C.mid} />
      <Rect x={38.4} y={20} width={4.6} height={22} rx={1.2} fill="url(#rM)" />
      <Path d="M38.4 20 Q40.7 14 43 20 Z" fill={C.shade} />
      <Rect x={11} y={29} width={26} height={13} rx={1} fill={C.lit} />
      <Rect x={24} y={29} width={13} height={13} rx={1} fill={C.shade} opacity={0.55} />
      <Path d="M10 30 A14 14.5 0 0 1 38 30 Z" fill="url(#rD)" />
      <Path d="M24 15.5 Q19 21 18.5 30 M24 15.5 Q29 21 29.5 30" stroke={C.deep} strokeWidth={0.9} fill="none" opacity={0.35} />
      <Line x1={24} y1={15.8} x2={24} y2={9.5} stroke={C.blue} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={24} cy={8.6} r={1.7} fill={C.blueHi} />
      <Path d="M20.8 42 V36 Q24 31 27.2 36 V42 Z" fill={C.deep} />
    </>
  );
}

function Gardens() {
  const C = { ...BASE, ...PAL.Gardens };
  return (
    <>
      <Defs>
        <LinearGradient id="tC" x1="0.2" y1="0" x2="0.9" y2="1"><Stop offset="0" stopColor={C.cream} /><Stop offset="0.4" stopColor={C.lit} /><Stop offset="1" stopColor={C.shade} /></LinearGradient>
        <Grad id="tT" a="#B07A4A" b="#6B4426" />
      </Defs>
      <Shadow rx={16} />
      <Path d="M21.2 42 L22.2 27 H26 L27 42 Z" fill="url(#tT)" />
      <Path d="M24 33 L18.5 27.5 M24 31 L29.5 26" stroke="#6B4426" strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={15.5} cy={22.5} r={8} fill="url(#tC)" />
      <Circle cx={32.5} cy={22.5} r={8} fill="url(#tC)" />
      <Circle cx={24} cy={14.5} r={10} fill="url(#tC)" />
      <Circle cx={24} cy={24.5} r={8.5} fill="url(#tC)" />
      <Ellipse cx={20} cy={11} rx={3.2} ry={2} fill="#fff" opacity={0.35} />
      <Ellipse cx={24} cy={40.5} rx={12} ry={2.4} fill={C.mid} opacity={0.35} />
    </>
  );
}

function Markets() {
  const C = { ...BASE, ...PAL.Markets };
  return (
    <>
      <Defs><Grad id="bF" a={C.hi} b={C.mid} vertical /><Grad id="bS" a={C.shade} b={C.deep} vertical /><Grad id="bT" a={C.cream} b={C.hi} /><Grad id="bB" a={C.blueHi} b={C.blue} /></Defs>
      <Shadow rx={18} />
      <Path d="M17 14 V9.5 Q17 3.5 24 3.5 Q31 3.5 31 9.5 V12" stroke={C.deep} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Polygon points="30,16 38,12 38,39 30,42" fill="url(#bS)" />
      <Polygon points="9,16 17,12 38,12 30,16" fill="url(#bT)" />
      <Rect x={9} y={16} width={21} height={26} rx={1} fill="url(#bF)" />
      <Rect x={9} y={26} width={21} height={5.5} fill="url(#bB)" />
      <Rect x={9} y={26} width={21} height={1.2} fill="#fff" opacity={0.35} />
      <Polygon points="30,26 38,22.6 38,28.2 30,31.5" fill={C.blue} opacity={0.85} />
      <Circle cx={17} cy={14.2} r={1.1} fill={C.deep} /><Circle cx={26} cy={14.2} r={1.1} fill={C.deep} />
    </>
  );
}

function Entertainment() {
  const C = { ...BASE, ...PAL.Entertainment };
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <>
      <Defs><Grad id="eR" a={C.lit} b={C.shade} /><Grad id="eB" a={C.blueHi} b={C.blue} /></Defs>
      <Shadow rx={16} />
      <Path d="M24 21 L12.5 42 M24 21 L35.5 42" stroke={C.deep} strokeWidth={3} strokeLinecap="round" />
      <Path d="M24 21 L14 40.5 M24 21 L34 40.5" stroke={C.lit} strokeWidth={1} strokeLinecap="round" opacity={0.7} />
      <Circle cx={24} cy={19} r={14} stroke="url(#eR)" strokeWidth={2.6} fill="none" />
      <Circle cx={24} cy={19} r={8} stroke={C.shade} strokeWidth={1} fill="none" opacity={0.5} />
      <G>
        {spokes.map((a, i) => <Line key={i} x1={24} y1={19} x2={24 + Math.cos(a) * 14} y2={19 + Math.sin(a) * 14} stroke={C.shade} strokeWidth={1.1} />)}
        {spokes.map((a, i) => <Circle key={`c${i}`} cx={24 + Math.cos(a) * 14} cy={19 + Math.sin(a) * 14} r={2.7} fill={i % 2 ? 'url(#eB)' : C.cream} stroke={C.deep} strokeWidth={0.8} />)}
      </G>
      <Circle cx={24} cy={19} r={3} fill={C.deep} /><Circle cx={23.3} cy={18.3} r={1} fill={C.hi} />
    </>
  );
}

const ART: Record<Category, React.ComponentType> = {
  'Monuments': Monuments, 'Modern Landmarks': Landmarks, 'Museums': Museums, 'Religious & spiritual': Religious,
  'Gardens & Parks': Gardens, 'Markets & Food': Markets, 'Entertainment': Entertainment,
};

export function CatIcon({ cat, size = 40, on }: { cat: Category; size?: number; on: boolean }) {
  const Art = ART[cat];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={on ? 1 : 0.8}>
      <Art />
    </Svg>
  );
}

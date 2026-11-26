import { useExtLink } from '../lib/links';
import React from 'react';
import { Pressable, StyleSheet, Text, TextProps, View } from 'react-native';
import { colors, font } from '../theme';

type Weight = 'regular' | 'medium' | 'semi' | 'bold';
export function Txt({ w = 'regular', style, ...rest }: TextProps & { w?: Weight }) {
  return <Text {...rest} style={[{ fontFamily: font[w], color: colors.ink, fontSize: 14 }, style]} />;
}
export function Chip({ label, on, icon, onPress }: { label: string; on: boolean; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.chip, on && s.chipOn]}>
      {icon}
      <Txt style={{ fontSize: 13, color: on ? colors.white : colors.text }}>{label}</Txt>
    </Pressable>
  );
}
export const Unverified = () => (
  <View style={s.unv}><Txt w="bold" style={{ fontSize: 11, color: colors.unv }}>Unverified</Txt></View>
);
export const NotAvailable = ({ size = 14 }: { size?: number }) => (
  <Txt style={{ color: colors.sub, fontStyle: 'italic', fontSize: size }}>Not available</Txt>
);
/** `url` is for buttons that open a website or app: it lets the web preview put a real link over the button. */
export function Button({ label, onPress, outline, url }: { label: string; onPress: () => void; outline?: boolean; url?: string }) {
  const ref = useExtLink(url);
  return (
    <Pressable ref={ref} onPress={onPress} accessibilityRole={url ? 'link' : 'button'} style={[s.btn, outline && s.btnOutline]}>
      <Txt w="bold" style={{ fontSize: 16, color: outline ? colors.primary : colors.white }}>{label}</Txt>
    </Pressable>
  );
}
const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.fill, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  unv: { backgroundColor: colors.unvBg, borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 },
  btn: { flex: 1, minHeight: 48, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary },
  btnOutline: { backgroundColor: colors.white },
});

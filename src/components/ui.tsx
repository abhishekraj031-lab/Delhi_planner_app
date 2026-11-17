import React from 'react';
import { Pressable, StyleSheet, Text, TextProps, View } from 'react-native';
import { colors, font } from '../theme';

type Weight = 'regular' | 'medium' | 'semi' | 'bold';
export function Txt({ w = 'regular', style, ...rest }: TextProps & { w?: Weight }) {
  return <Text {...rest} style={[{ fontFamily: font[w], color: colors.ink, fontSize: 12 }, style]} />;
}
export function Chip({ label, on, icon, onPress }: { label: string; on: boolean; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.chip, on && s.chipOn]}>
      {icon}
      <Txt style={{ fontSize: 10, color: on ? colors.white : colors.text }}>{label}</Txt>
    </Pressable>
  );
}
export const Unverified = () => (
  <View style={s.unv}><Txt w="bold" style={{ fontSize: 9, color: colors.unv }}>Unverified</Txt></View>
);
export const NotAvailable = ({ size = 12 }: { size?: number }) => (
  <Txt style={{ color: colors.sub, fontStyle: 'italic', fontSize: size }}>Not available</Txt>
);
export function Button({ label, onPress, outline }: { label: string; onPress: () => void; outline?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.btn, outline && s.btnOutline]}>
      <Txt w="bold" style={{ fontSize: 14, color: outline ? colors.primary : colors.white }}>{label}</Txt>
    </Pressable>
  );
}
const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.fill, backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  unv: { backgroundColor: colors.unvBg, borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4 },
  btn: { flex: 1, height: 44, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary },
  btnOutline: { backgroundColor: colors.white },
});

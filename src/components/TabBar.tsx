import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CircleUser, Heart, House, Ticket } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Txt } from './ui';

export type TabKey = 'home' | 'favourites' | 'bookings' | 'profile';
const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'home', label: 'Home', Icon: House },
  { key: 'favourites', label: 'favourites', Icon: Heart },
  { key: 'bookings', label: 'Bookings', Icon: Ticket },
  { key: 'profile', label: 'Profile', Icon: CircleUser },
];

export function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map(({ key, label, Icon }) => {
        const on = tab === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
            style={[s.tab, on && s.tabOn]}>
            <Icon size={20} color={on ? colors.white : colors.ink} />
            <Txt w={on ? 'semi' : 'regular'} style={{ fontSize: 12, color: on ? colors.white : colors.ink }}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 12, paddingHorizontal: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.fill },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 12, borderRadius: 10 },
  tabOn: { backgroundColor: colors.dark },
});

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { CircleUser, Heart, House, Images } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { tr } from '../i18n';
import { Txt } from './ui';

export type TabKey = 'home' | 'wall' | 'favourites' | 'profile';
const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'home', label: 'Home', Icon: House },
  { key: 'wall', label: 'My wall', Icon: Images },
  { key: 'favourites', label: 'Favourites', Icon: Heart },
  { key: 'profile', label: 'Profile', Icon: CircleUser },
];
const NATIVE = Platform.OS !== 'web';

/** The orange pill fades and grows in behind the active tab; the colours switch halfway so text never disappears. */
function TabItem({ on, label, Icon, onPress, alwaysLabel }: { on: boolean; label: string; alwaysLabel?: boolean; Icon: (typeof TABS)[number]['Icon']; onPress: () => void }) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  const [shown, setShown] = useState(on);
  useEffect(() => {
    Animated.timing(v, { toValue: on ? 1 : 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
    const t = setTimeout(() => setShown(on), 80);
    return () => clearTimeout(t);
  }, [on, v]);
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={tr(label)}
      style={({ pressed }) => [s.tab, { opacity: pressed ? 0.7 : 1 }]}>
      <Animated.View pointerEvents="none" style={[s.pill, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]} />
      <View style={s.content}>
        <Icon size={20} color={shown ? colors.white : colors.ink} />
        {on || shown || alwaysLabel ? <Txt w={shown ? 'semi' : 'regular'} style={{ fontSize: 12, color: shown ? colors.white : colors.ink }}>{tr(label)}</Txt> : null}
      </View>
    </Pressable>
  );
}

export function TabBar({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map(({ key, label, Icon }) => (
        <TabItem key={key} on={tab === key} label={label} Icon={Icon} onPress={() => onChange(key)} />
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 12, paddingHorizontal: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.fill },
  tab: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1 },
  pill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: colors.primary, zIndex: 0 },
});

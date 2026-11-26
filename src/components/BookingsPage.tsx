import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft, Ticket } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Button, Txt } from './ui';

/** Tickets the person has booked, opened from Profile. Bookings happen on official sites, so none are listed yet. */
export function BookingsPage({ onBack, onExplore }: { onBack: () => void; onExplore: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10 }}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back to profile"
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Txt w="bold" style={{ fontSize: 20 }}>Bookings</Txt>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingBottom: 80 }}>
        <Ticket size={36} color={colors.primary} />
        <Txt w="bold" style={{ fontSize: 18 }}>No bookings yet</Txt>
        <Txt style={{ color: colors.sub, textAlign: 'center' }}>Tickets you book on official sites will be listed here.</Txt>
        <View style={{ flexDirection: 'row', width: 200 }}><Button label="Explore places" onPress={onExplore} /></View>
      </View>
    </View>
  );
}

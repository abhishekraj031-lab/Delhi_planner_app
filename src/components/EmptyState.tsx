import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Button, Txt } from './ui';

/** Full-tab empty state: icon, title, one line of help, one button. */
export function EmptyState({ title, icon, heading, message, cta, onCta }: {
  title: string; icon: React.ReactNode; heading: string; message: string; cta: string; onCta: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
      <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 48 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          {icon}
        </View>
        <Txt w="bold" style={{ fontSize: 18 }}>{heading}</Txt>
        <Txt style={{ color: colors.sub, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>{message}</Txt>
        <View style={{ flexDirection: 'row', width: 240, marginTop: 16 }}><Button label={cta} onPress={onCta} /></View>
      </View>
    </View>
  );
}

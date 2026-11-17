import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Txt } from './ui';

/** Placeholder for tabs that will need a signed-in user. Login is not built yet. */
export function LoginRequired({ title, hint }: { title: string; hint: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
      <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Txt w="semi" style={{ fontSize: 14 }}>Log in required</Txt>
        <Txt style={{ color: colors.sub, textAlign: 'center' }}>{hint}</Txt>
      </View>
    </View>
  );
}

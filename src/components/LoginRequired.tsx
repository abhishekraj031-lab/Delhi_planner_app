import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Button, Txt } from './ui';

/** Signed-in placeholder: a title and an empty state. Real content comes later. */
export function EmptyTab({ title, message, onSignOut }: { title: string; message: string; onSignOut?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
      <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Txt style={{ color: colors.sub, textAlign: 'center' }}>{message}</Txt>
        {onSignOut ? <View style={{ flexDirection: 'row', width: 160 }}><Button label="Log out" outline onPress={onSignOut} /></View> : null}
      </View>
    </View>
  );
}

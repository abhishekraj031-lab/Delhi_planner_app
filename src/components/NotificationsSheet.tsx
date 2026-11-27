import React from 'react';
import { View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '../theme';
import { tr } from '../i18n';
import { Txt } from './ui';
import { Sheet } from './Sheet';

/** There are no alerts to send yet, so this says so plainly rather than showing made-up ones. */
export function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} label={tr('Notifications')}>
      <Txt w="bold" style={{ fontSize: 20 }}>{tr('Notifications')}</Txt>
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' }}><Bell size={26} color={colors.ink} /></View>
        <Txt w="semi" style={{ fontSize: 16 }}>{tr('Nothing new yet')}</Txt>
        <Txt style={{ color: colors.sub, fontSize: 13, textAlign: 'center' }}>{tr('Updates about your saved places and your wall will show up here.')}</Txt>
      </View>
    </Sheet>
  );
}

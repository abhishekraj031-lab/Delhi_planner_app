import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { tr } from '../i18n';
import { LoginScreen } from './LoginScreen';

/** Full-screen login shown when someone tries to save a place while logged out. */
export function AuthPrompt({ visible, onClose, onSignIn }: { visible: boolean; onClose: () => void; onSignIn: (id: string, code: string) => Promise<boolean> }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <LoginScreen title={tr('Save to favourites')} hint={tr('Log in to save places and find them later in Favourites.')} onSignIn={onSignIn} />
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('Close login')} hitSlop={8}
          style={({ pressed }) => ({ position: 'absolute', top: insets.top + 4, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <X size={22} color={colors.ink} />
        </Pressable>
      </View>
    </Modal>
  );
}

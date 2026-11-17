import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

/** Bottom sheet over a dimmed screen (matches the Figma detail sheet). */
export function Sheet({ visible, onClose, children, label }: { visible: boolean; onClose: () => void; children?: React.ReactNode; label: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={s.sheet} accessibilityViewIsModal accessibilityLabel={label}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 24 + insets.bottom }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { maxHeight: '82%', backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
});

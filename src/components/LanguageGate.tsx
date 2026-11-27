import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { LANGUAGES, useLang } from '../i18n';
import { Txt } from './ui';

/** Shown once, the first time the app opens. The choice can be changed later in Profile. */
export function LanguageGate() {
  const insets = useSafeAreaInsets();
  const { setLang } = useLang();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32, paddingHorizontal: 24, justifyContent: 'center', gap: 28 }}>
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 28 }}>Delhi Explorer</Txt>
        <Txt style={{ fontSize: 17, color: colors.text }}>Choose your language</Txt>
        <Txt style={{ fontSize: 17, color: colors.text, fontFamily: 'NotoSansDevanagari_400Regular' }}>अपनी भाषा चुनें</Txt>
      </View>
      <View style={{ gap: 12 }}>
        {LANGUAGES.map((l) => (
          <Pressable key={l.key} onPress={() => setLang(l.key)} accessibilityRole="button" accessibilityLabel={l.label}
            style={({ pressed }) => ({ minHeight: 60, borderRadius: 16, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#f2f7ff' : colors.white })}>
            <Txt w="bold" style={{ fontSize: 20, color: colors.primary, fontFamily: l.key === 'hi' ? 'NotoSansDevanagari_700Bold' : undefined }}>{l.label}</Txt>
          </Pressable>
        ))}
      </View>
      <Txt style={{ fontSize: 13, color: colors.sub }}>You can change this later in Profile. / आप इसे बाद में प्रोफ़ाइल में बदल सकते हैं।</Txt>
    </View>
  );
}

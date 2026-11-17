import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEMO_LOGIN } from '../config';
import { colors, font } from '../theme';
import { Button, Txt } from './ui';

export function LoginScreen({ title, hint, onSignIn }: { title: string; hint: string; onSignIn: (id: string, pw: string) => Promise<boolean> }) {
  const insets = useSafeAreaInsets();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const submit = async () => {
    const ok = await onSignIn(id, pw);
    setError(ok ? '' : 'That email/phone or password is not right.');
  };
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
      <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
      <View style={{ marginTop: 32, gap: 12 }}>
        <Txt w="bold" style={{ fontSize: 20 }}>Log in</Txt>
        <Txt style={{ color: colors.sub, fontSize: 12 }}>{hint}</Txt>
        <TextInput value={id} onChangeText={setId} placeholder="Email or phone number" placeholderTextColor="#333232" autoCapitalize="none"
          autoCorrect={false} accessibilityLabel="Email or phone number" style={s.input} />
        <TextInput value={pw} onChangeText={setPw} placeholder="Password" placeholderTextColor="#333232" secureTextEntry
          accessibilityLabel="Password" onSubmitEditing={submit} style={s.input} />
        {error ? <Txt style={{ color: colors.warn }}>{error}</Txt> : null}
        <View style={{ flexDirection: 'row' }}><Button label="Log in" onPress={submit} /></View>
        <Txt style={{ color: colors.sub, fontSize: 11 }}>Demo login for testing: {DEMO_LOGIN.id} / {DEMO_LOGIN.password}. Phone OTP and Google sign-in are coming later.</Txt>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  input: { height: 44, borderRadius: 8, backgroundColor: colors.fill, paddingHorizontal: 12, fontFamily: font.regular, fontSize: 14, color: '#333232' },
});

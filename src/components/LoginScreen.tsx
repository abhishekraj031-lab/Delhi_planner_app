import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEMO_OTP } from '../config';
import { colors, font } from '../theme';
import { Button, Txt } from './ui';

type Method = 'phone' | 'email';
const RESEND_SECONDS = 30;
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Password-free login: phone number + OTP, or Google email + verification code. */
export function LoginScreen({ title, hint, onSignIn }: { title: string; hint: string; onSignIn: (id: string, code: string) => Promise<boolean> }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'enter' | 'code'>('enter');
  const [method, setMethod] = useState<Method>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const digits = phone.replace(/\D/g, '');
  const target = method === 'phone' ? `+91 ${digits}` : email.trim();

  const sendCode = () => {
    if (method === 'phone' && digits.length !== 10) { setError('Enter a 10-digit mobile number.'); return; }
    if (method === 'email' && !validEmail(email)) { setError('Enter a valid Gmail address.'); return; }
    setError(''); setCode(''); setWait(RESEND_SECONDS); setStep('code');
  };
  const verify = async (value: string) => {
    if (value.length !== 6) { setError('Enter the 6-digit code.'); return; }
    const ok = await onSignIn(target, value);
    if (!ok) { setError('That code is not right. Check it and try again.'); setCode(''); }
  };
  const back = () => { setStep('enter'); setCode(''); setError(''); };
  const switchTo = (m: Method) => { setMethod(m); setError(''); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
      <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
      {step === 'enter' ? (
        <View style={{ marginTop: 32, gap: 12 }}>
          <Txt w="bold" style={{ fontSize: 20 }}>{method === 'phone' ? 'Log in or sign up' : 'Continue with Google'}</Txt>
          <Txt style={{ color: colors.sub, fontSize: 14 }}>{hint} No password needed.</Txt>
          {method === 'phone' ? (
            <>
              <View style={s.phoneRow}>
                <View style={s.cc}><Txt w="semi" style={{ fontSize: 16 }}>+91</Txt></View>
                <TextInput value={phone} onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="Mobile number" placeholderTextColor="#333232"
                  keyboardType="number-pad" textContentType="telephoneNumber" autoComplete="tel" accessibilityLabel="Mobile number" onSubmitEditing={sendCode} style={[s.input, { flex: 1 }]} />
              </View>
              {error ? <Txt style={{ color: colors.warn }}>{error}</Txt> : null}
              <Button label="Send OTP" onPress={sendCode} />
              <View style={s.or}><View style={s.rule} /><Txt style={{ fontSize: 13, color: colors.sub }}>or</Txt><View style={s.rule} /></View>
              <Button label="Continue with Google" outline onPress={() => switchTo('email')} />
            </>
          ) : (
            <>
              <TextInput value={email} onChangeText={setEmail} placeholder="Gmail address" placeholderTextColor="#333232" keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" accessibilityLabel="Gmail address" onSubmitEditing={sendCode} style={s.input} />
              {error ? <Txt style={{ color: colors.warn }}>{error}</Txt> : null}
              <Button label="Send verification code" onPress={sendCode} />
              <Pressable onPress={() => switchTo('phone')} accessibilityRole="button" style={s.link}><Txt w="semi" style={{ fontSize: 15, color: colors.primary }}>Use mobile number instead</Txt></Pressable>
            </>
          )}
          <Txt style={{ color: colors.sub, fontSize: 12 }}>Demo only: no code is really sent yet. Enter {DEMO_OTP} on the next screen.</Txt>
        </View>
      ) : (
        <View style={{ marginTop: 32, gap: 12 }}>
          <Txt w="bold" style={{ fontSize: 20 }}>{method === 'phone' ? 'Enter the OTP' : 'Enter the verification code'}</Txt>
          <Txt style={{ color: colors.sub, fontSize: 14 }}>We sent a 6-digit {method === 'phone' ? 'OTP by SMS' : 'code to your Gmail'} to {target}.</Txt>
          <TextInput autoFocus value={code} onChangeText={(v) => { const d = v.replace(/\D/g, '').slice(0, 6); setCode(d); setError(''); if (d.length === 6) verify(d); }}
            placeholder="6-digit code" placeholderTextColor="#333232" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp"
            maxLength={6} accessibilityLabel="6-digit code" style={[s.input, { letterSpacing: 6, textAlign: 'center', fontSize: 20 }]} />
          {error ? <Txt style={{ color: colors.warn }}>{error}</Txt> : null}
          <Button label="Verify and log in" onPress={() => verify(code)} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={back} accessibilityRole="button" style={s.link}><Txt w="semi" style={{ fontSize: 15, color: colors.primary }}>{method === 'phone' ? 'Change number' : 'Change email'}</Txt></Pressable>
            <Pressable onPress={() => { if (wait === 0) { setWait(RESEND_SECONDS); setCode(''); setError(''); } }} disabled={wait > 0} accessibilityRole="button" style={s.link}>
              <Txt w="semi" style={{ fontSize: 15, color: wait > 0 ? colors.sub : colors.primary }}>{wait > 0 ? `Resend in ${wait}s` : 'Resend code'}</Txt>
            </Pressable>
          </View>
          <Txt style={{ color: colors.sub, fontSize: 12 }}>Demo only: enter {DEMO_OTP}.</Txt>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  input: { minHeight: 48, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 12, paddingVertical: 10, fontFamily: font.regular, fontSize: 16, color: '#333232' },
  phoneRow: { flexDirection: 'row', gap: 8 },
  cc: { minHeight: 48, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  link: { minHeight: 44, justifyContent: 'center' },
});

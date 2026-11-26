import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { ChevronRight, CircleUser, Heart, Info, LifeBuoy, LogOut, MapPin, Mic, Pencil, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { LocationState } from '../hooks/useLocation';
import { MicState, micPermission, requestMic } from '../lib/speech';
import { Button, Txt } from './ui';

type Props = {
  id: string; displayName?: string; savedCount: number; locLabel: string; gps: boolean; locState: LocationState;
  onRename: (name: string) => void; onOpenFavourites: () => void; onChangeStart: () => void; onAllowLocation: () => void;
  onSignOut: () => void; onDelete: () => void;
};

export const initialOf = (name?: string, id?: string) => {
  const c = (name || (id && id.includes('@') ? id : '') || '').trim().charAt(0);
  return c ? c.toUpperCase() : '';
};

function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>{children}</View>;
}
function Row({ icon, label, value, onPress, action, last, danger }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; action?: React.ReactNode; last?: boolean; danger?: boolean }) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? '#fdecea' : colors.fill, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt w="semi" style={{ fontSize: 16, color: danger ? '#b3261e' : colors.ink }}>{label}</Txt>
        {value ? <Txt style={{ fontSize: 13, color: colors.sub }}>{value}</Txt> : null}
      </View>
      {action ?? (onPress ? <ChevronRight size={18} color={colors.sub} /> : null)}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>{body}</Pressable> : body;
}
const Pill = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
    <Txt w="semi" style={{ color: colors.white, fontSize: 14 }}>{label}</Txt>
  </Pressable>
);
const Section = ({ title }: { title: string }) => <Txt w="bold" style={{ fontSize: 14, color: colors.sub, marginTop: 8, marginLeft: 4 }}>{title}</Txt>;

/** Signed-in profile: account, saved places, device settings, about, log out and delete account. */
export function ProfileScreen(p: Props) {
  const insets = useSafeAreaInsets();
  const isEmail = p.id.includes('@');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.displayName ?? '');
  const [mic, setMic] = useState<MicState>('prompt');
  const [about, setAbout] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { micPermission().then(setMic); }, []);
  const ini = initialOf(p.displayName, p.id);

  const locValue = p.gps ? 'On' : p.locState === 'denied' ? 'Off in your phone settings' : 'Off';
  const micValue = mic === 'granted' ? 'On' : mic === 'denied' ? 'Off in your phone settings' : mic === 'unavailable' ? 'Not available' : 'Off';
  const openSettings = () => { if (Platform.OS !== 'web') Linking.openSettings().catch(() => {}); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 120, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Txt w="bold" style={{ fontSize: 20 }}>Profile</Txt>

      <Card>
        <View style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              {ini ? <Txt w="bold" style={{ color: colors.white, fontSize: 28 }}>{ini}</Txt> : <CircleUser size={34} color={colors.white} />}
            </View>
            <View style={{ flex: 1 }}>
              <Txt w="bold" style={{ fontSize: 20 }} numberOfLines={1}>{p.displayName || 'Add your name'}</Txt>
              <Txt style={{ fontSize: 14, color: colors.sub }} numberOfLines={1}>{p.id}</Txt>
              <Txt style={{ fontSize: 12, color: colors.sub }}>{isEmail ? 'Signed in with email' : 'Signed in with phone'}</Txt>
            </View>
          </View>
          {editing ? (
            <View style={{ gap: 10 }}>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Your name" placeholderTextColor="#777" autoFocus maxLength={40} accessibilityLabel="Your name"
                style={{ height: 48, borderRadius: 12, backgroundColor: colors.fill, paddingHorizontal: 14, fontSize: 16, color: colors.ink }} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button label="Cancel" outline onPress={() => { setDraft(p.displayName ?? ''); setEditing(false); }} />
                <Button label="Save" onPress={() => { p.onRename(draft.trim()); setEditing(false); }} />
              </View>
            </View>
          ) : (
            <Pressable onPress={() => { setDraft(p.displayName ?? ''); setEditing(true); }} accessibilityRole="button" accessibilityLabel="Edit name"
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}>
              <Pencil size={16} color={colors.primary} /><Txt w="semi" style={{ color: colors.primary, fontSize: 15 }}>{p.displayName ? 'Edit name' : 'Add name'}</Txt>
            </Pressable>
          )}
        </View>
      </Card>

      <Card>
        <Row last icon={<Heart size={20} color={colors.primary} />} label="Saved places" value={p.savedCount === 0 ? 'Nothing saved yet' : `${p.savedCount} saved`} onPress={p.onOpenFavourites} />
      </Card>

      <Section title="Preferences" />
      <Card>
        <Row icon={<MapPin size={20} color={colors.ink} />} label="Start point" value={p.locLabel} onPress={p.onChangeStart} />
        <Row icon={<MapPin size={20} color={colors.ink} />} label="Location access" value={locValue}
          action={p.gps ? null : p.locState === 'denied' ? (Platform.OS !== 'web' ? <Pill label="Settings" onPress={openSettings} /> : null) : <Pill label="Allow" onPress={p.onAllowLocation} />} />
        <Row last icon={<Mic size={20} color={colors.ink} />} label="Microphone access" value={micValue}
          action={mic === 'prompt' ? <Pill label="Allow" onPress={() => requestMic().then(setMic)} /> : mic === 'denied' && Platform.OS !== 'web' ? <Pill label="Settings" onPress={openSettings} /> : null} />
      </Card>

      <Section title="About" />
      <Card>
        <Row icon={<Info size={20} color={colors.ink} />} label="About and data sources" onPress={() => setAbout((v) => !v)} />
        {about ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <Txt style={{ fontSize: 14, color: colors.text }}>Timings, prices and details come from official sources first. Where sources disagree, the value is marked Unverified, and every place shows its source and when it was last checked.</Txt>
            <Txt style={{ fontSize: 14, color: colors.text }}>Metro and cab fares are estimates. The real price is shown in the booking app. Tickets are booked on official sites only.</Txt>
          </View>
        ) : null}
        <Row icon={<ShieldCheck size={20} color={colors.ink} />} label="Privacy" value="Not available yet" />
        <Row last icon={<LifeBuoy size={20} color={colors.ink} />} label="Support" value="Not available yet" />
      </Card>

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Button label="Log out" outline onPress={p.onSignOut} />
      </View>

      {confirm ? (
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <Txt w="bold" style={{ fontSize: 17 }}>Delete your account?</Txt>
            <Txt style={{ fontSize: 14, color: colors.sub }}>This removes your name and saved places from this phone and logs you out. It can't be undone.</Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Keep account" outline onPress={() => setConfirm(false)} />
              <Pressable onPress={p.onDelete} accessibilityRole="button" accessibilityLabel="Delete account"
                style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 24, backgroundColor: '#b3261e', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                <Txt w="bold" style={{ color: colors.white, fontSize: 16 }}>Delete</Txt>
              </Pressable>
            </View>
          </View>
        </Card>
      ) : (
        <Pressable onPress={() => setConfirm(true)} accessibilityRole="button" accessibilityLabel="Delete account" style={({ pressed }) => ({ alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, opacity: pressed ? 0.6 : 1 })}>
          <Trash2 size={16} color="#b3261e" /><Txt w="semi" style={{ color: '#b3261e', fontSize: 14 }}>Delete account</Txt>
        </Pressable>
      )}
    </ScrollView>
  );
}

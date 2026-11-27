import React, { useEffect, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Camera, MessageSquareText, ChevronDown, ChevronRight, ChevronUp, Ticket, UserPlus, CircleUser, Heart, Info, Languages, LifeBuoy, LogOut, MapPin, Mic, Pencil, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFor } from '../theme';
import { tr, useLang, LANGUAGES } from '../i18n';
import { LocationState } from '../hooks/useLocation';
import { MicState, micPermission, requestMic } from '../lib/speech';
import { pickRawPhoto, pickSquarePhoto } from '../lib/photo';
import { CropSheet } from './CropSheet';
import { useExtLink } from '../lib/links';
import { FEEDBACK_URL } from '../config';
import { Button, Txt } from './ui';

type Props = {
  id: string; displayName?: string; photo?: string; onPhoto: (uri?: string) => void; savedCount: number; locLabel: string; gps: boolean; locState: LocationState;
  onRename: (name: string) => void; onOpenSaved: () => void; onOpenBookings: () => void; onInvite: () => void; onChangeStart: () => void; onAllowLocation: () => void;
  onSignOut: () => void; onDelete: () => void;
};

export const initialOf = (name?: string, id?: string) => {
  const c = (name || (id && id.includes('@') ? id : '') || '').trim().charAt(0);
  return c ? c.toUpperCase() : '';
};

function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>{children}</View>;
}
function Row({ icon, label, value, onPress, action, last, danger, open, url }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; action?: React.ReactNode; last?: boolean; danger?: boolean; open?: boolean; url?: string }) {
  const ref = useExtLink(url);
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.line }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? '#fdecea' : colors.fill, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt w="semi" style={{ fontSize: 16, color: danger ? '#b3261e' : colors.ink }}>{label}</Txt>
        {value ? <Txt style={{ fontSize: 13, color: colors.sub }}>{value}</Txt> : null}
      </View>
      {action ?? (open !== undefined ? (open ? <ChevronUp size={18} color={colors.sub} /> : <ChevronDown size={18} color={colors.sub} />) : onPress ? <ChevronRight size={18} color={colors.sub} /> : null)}
    </View>
  );
  return onPress ? <Pressable ref={ref} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>{body}</Pressable> : body;
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
  const { lang, setLang } = useLang();
  const isEmail = p.id.includes('@');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.displayName ?? '');
  const [mic, setMic] = useState<MicState>('prompt');
  const [about, setAbout] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { micPermission().then(setMic); }, []);
  const ini = initialOf(p.displayName, p.id);
  const [photoErr, setPhotoErr] = useState('');
  const [cropUri, setCropUri] = useState<string | null>(null);
  // Phones show their own crop screen. On the web the app shows one so the person can move and zoom the photo.
  const choosePhoto = async (camera: boolean) => {
    setPhotoErr('');
    if (Platform.OS === 'web') { const r = await pickRawPhoto(camera); if (r.error) setPhotoErr(r.error); else if (r.uri) setCropUri(r.uri); return; }
    const r = await pickSquarePhoto(camera); if (r.error) setPhotoErr(r.error); else if (r.uri) p.onPhoto(r.uri);
  };

  const locValue = p.gps ? tr('On') : p.locState === 'denied' ? tr('Off in your phone settings') : tr('Off');
  const micValue = mic === 'granted' ? tr('On') : mic === 'denied' ? tr('Off in your phone settings') : mic === 'unavailable' ? tr('Not available') : tr('Off');
  const openSettings = () => { if (Platform.OS !== 'web') Linking.openSettings().catch(() => {}); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 120, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Txt w="bold" style={{ fontSize: 20 }}>{tr('Profile')}</Txt>

      <Card>
        <View style={{ padding: 16, gap: 14 }}>
          {!editing ? (
            <Pressable onPress={() => { setDraft(p.displayName ?? ''); setEditing(true); }} accessibilityRole="button" accessibilityLabel={tr('Edit name')} hitSlop={6}
              style={({ pressed }) => ({ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Pencil size={18} color={colors.ink} />
            </Pressable>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable onPress={() => choosePhoto(false)} accessibilityRole="button" accessibilityLabel={p.photo ? tr('Change profile photo') : tr('Add profile photo')} style={{ width: 72, height: 72 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {p.photo ? <Image source={{ uri: p.photo }} accessibilityLabel={tr('Your profile photo')} style={{ width: 72, height: 72 }} /> : ini ? <Txt w="bold" style={{ color: colors.white, fontSize: 30 }}>{ini}</Txt> : <CircleUser size={38} color={colors.white} />}
              </View>
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dark, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={14} color={colors.white} />
              </View>
            </Pressable>
            <View style={{ flex: 1, paddingRight: 36 }}>
              <Txt w="bold" style={{ fontSize: 20 }} numberOfLines={1}>{p.displayName || tr('Add your name')}</Txt>
              <Txt style={{ fontSize: 14, color: colors.sub }} numberOfLines={1}>{p.id}</Txt>
              <Txt style={{ fontSize: 12, color: colors.sub }}>{isEmail ? tr('Signed in with email') : tr('Signed in with phone')}</Txt>
            </View>
          </View>
          {p.photo ? (
            <Pressable onPress={() => p.onPhoto(undefined)} accessibilityRole="button" accessibilityLabel={tr('Remove photo')} style={({ pressed }) => ({ alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}>
              <Txt w="semi" style={{ color: colors.sub, fontSize: 14 }}>{tr('Remove photo')}</Txt>
            </Pressable>
          ) : null}
          {photoErr ? <Txt style={{ color: colors.warn, fontSize: 13 }}>{photoErr}</Txt> : null}
          {editing ? (
            <View style={{ gap: 10 }}>
              <TextInput value={draft} onChangeText={setDraft} placeholder={tr('Your name')} placeholderTextColor="#777" autoFocus maxLength={40} accessibilityLabel={tr('Your name')}
                style={{ height: 48, borderRadius: 12, backgroundColor: colors.fill, paddingHorizontal: 14, fontSize: 16, color: colors.ink, fontFamily: fontFor('regular') }} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button label={tr('Cancel')} outline onPress={() => { setDraft(p.displayName ?? ''); setEditing(false); }} />
                <Button label={tr('Save')} onPress={() => { p.onRename(draft.trim()); setEditing(false); }} />
              </View>
            </View>
          ) : null}
        </View>
      </Card>

      <Card>
        <Row icon={<Heart size={20} color={colors.ink} />} label={tr('Saved places')} value={p.savedCount === 0 ? tr('Nothing saved yet') : tr('{n} saved', { n: p.savedCount })} onPress={p.onOpenSaved} />
        <Row icon={<Ticket size={20} color={colors.ink} />} label={tr('Bookings')} value={tr('Tickets you booked')} onPress={p.onOpenBookings} />
        <Row last icon={<UserPlus size={20} color={colors.ink} />} label={tr('Invite friends and family')} value={tr('See your wall and your posts')} onPress={p.onInvite} />
      </Card>

      <Section title={tr('Preferences')} />
      <Card>
        <Row icon={<Languages size={20} color={colors.ink} />} label={tr('Language')} value={LANGUAGES.find((l) => l.key === lang)?.label}
          action={<View style={{ flexDirection: 'row', gap: 6 }}>{LANGUAGES.map((l) => (
            <Pressable key={l.key} onPress={() => setLang(l.key)} accessibilityRole="button" accessibilityState={{ selected: lang === l.key }} accessibilityLabel={l.label}
              style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: lang === l.key ? colors.primary : colors.fill }}>
              <Txt w="semi" style={{ fontSize: 14, color: lang === l.key ? colors.white : colors.ink }}>{l.label}</Txt>
            </Pressable>))}</View>} />
        <Row icon={<MapPin size={20} color={colors.ink} />} label={tr('Start point')} value={p.locLabel} onPress={p.onChangeStart} />
        <Row icon={<MapPin size={20} color={colors.ink} />} label={tr('Location access')} value={locValue}
          action={p.gps ? null : p.locState === 'denied' ? (Platform.OS !== 'web' ? <Pill label={tr('Settings')} onPress={openSettings} /> : null) : <Pill label={tr('Allow')} onPress={p.onAllowLocation} />} />
        <Row last icon={<Mic size={20} color={colors.ink} />} label={tr('Microphone access')} value={micValue}
          action={mic === 'prompt' ? <Pill label={tr('Allow')} onPress={() => requestMic().then(setMic)} /> : mic === 'denied' && Platform.OS !== 'web' ? <Pill label={tr('Settings')} onPress={openSettings} /> : null} />
      </Card>

      <Section title={tr('About')} />
      <Card>
        <Row icon={<Info size={20} color={colors.ink} />} label={tr('About and data sources')} open={about} onPress={() => setAbout((v) => !v)} />
        {about ? (
          <View style={{ paddingLeft: 64, paddingRight: 16, paddingTop: 2, paddingBottom: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.text }}>{tr('Timings, prices and details come from official sources first. Where sources disagree, the value is marked Unverified, and every place shows its source and when it was last checked.')}</Txt>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: colors.text }}>{tr('Metro and cab fares are estimates. The real price is shown in the booking app. Tickets are booked on official sites only.')}</Txt>
          </View>
        ) : null}
        <Row icon={<MessageSquareText size={20} color={colors.ink} />} label={tr('Send feedback')} value={tr('Tell us what to improve')} url={FEEDBACK_URL} onPress={() => { Linking.openURL(FEEDBACK_URL).catch(() => {}); }} />
        <Row icon={<ShieldCheck size={20} color={colors.ink} />} label={tr('Privacy')} value={tr('Not available yet')} />
        <Row last icon={<LifeBuoy size={20} color={colors.ink} />} label={tr('Support')} value={tr('Not available yet')} />
      </Card>

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Button label={tr('Log out')} outline onPress={p.onSignOut} />
      </View>

      {confirm ? (
        <Card>
          <View style={{ padding: 16, gap: 12 }}>
            <Txt w="bold" style={{ fontSize: 17 }}>{tr('Delete your account?')}</Txt>
            <Txt style={{ fontSize: 14, color: colors.sub }}>{tr("This removes your name and saved places from this phone and logs you out. It can't be undone.")}</Txt>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label={tr('Keep account')} outline onPress={() => setConfirm(false)} />
              <Pressable onPress={p.onDelete} accessibilityRole="button" accessibilityLabel={tr('Delete account')}
                style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                <Txt w="bold" style={{ color: colors.white, fontSize: 16 }}>{tr('Delete')}</Txt>
              </Pressable>
            </View>
          </View>
        </Card>
      ) : (
        <Pressable onPress={() => setConfirm(true)} accessibilityRole="button" accessibilityLabel={tr('Delete account')} style={({ pressed }) => ({ alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, opacity: pressed ? 0.6 : 1 })}>
          <Trash2 size={16} color={colors.primary} /><Txt w="semi" style={{ color: colors.primary, fontSize: 14 }}>{tr('Delete account')}</Txt>
        </Pressable>
      )}
      <CropSheet uri={cropUri} onCancel={() => setCropUri(null)} onDone={(u) => { setCropUri(null); p.onPhoto(u); }} />
    </ScrollView>
  );
}

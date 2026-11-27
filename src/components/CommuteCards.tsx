import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Car, ChevronRight, MapPin, TrainFront } from 'lucide-react-native';
import type { Coords, Place } from '../types';
import { colors } from '../theme';
import { CAB_APPS, CabApp, estimateCab, estimateMetro, IXIGO_METRO_URL } from '../lib/commute';
import { formatAway } from '../lib/distance';
import { useExtLink } from '../lib/links';
import { NotAvailable, Txt, Unverified } from './ui';
import { tr } from '../i18n';

const open = (url: string) => { Linking.openURL(url).catch(() => {}); };

function Cta({ label, onPress, hint, url }: { label: string; onPress: () => void; hint: string; url?: string }) {
  const ref = useExtLink(url);
  return (
    <Pressable ref={ref} onPress={onPress} accessibilityRole="link" accessibilityLabel={label} accessibilityHint={hint} style={({ pressed }) => [s.cta, { opacity: pressed ? 0.8 : 1 }]}>
      <Txt w="bold" style={{ fontSize: 16, color: colors.white }}>{label}</Txt>
    </Pressable>
  );
}

function AppRow({ app: a, place: p, from }: { app: CabApp; place: Place; from: Coords | null }) {
  const url = a.url(p, from);
  const ref = useExtLink(url);
  return (
    <Pressable ref={ref} onPress={() => open(url)} accessibilityRole="link" accessibilityLabel={tr('Check price and book on {app}', { app: a.name })} accessibilityHint={tr(a.note)}
      style={({ pressed }) => [s.app, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w="semi" style={{ fontSize: 16 }}>{a.name}</Txt>
        <Txt style={{ fontSize: 12, color: colors.sub }}>{tr(a.note)}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Txt w="bold" style={{ fontSize: 14, color: colors.secondary }}>{tr('Check price')}</Txt>
          <ChevronRight size={18} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

/** "Getting there": one card for the metro and one for a cab, each with an estimated fare and a way to book. */
export function CommuteCards({ place: p, km, from, day, locState, onAllowLocation }: { place: Place; km: number | null; from: Coords | null; day: number; locState: 'idle' | 'asking' | 'denied' | 'error'; onAllowLocation: () => void }) {
  const metro = estimateMetro(km, day);
  const cab = estimateCab(km);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ paddingHorizontal: 4, gap: 2 }}>
        <Txt w="bold" style={{ fontSize: 18, color: colors.ink }}>{tr('Getting there')}</Txt>
        {km != null ? <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('{away} from you, in a straight line. Fares are estimates.', { away: formatAway(km) })}</Txt> : null}
      </View>

      <View style={s.card}>
        <View style={s.head}>
          <View style={[s.icon, { backgroundColor: '#e6efff' }]}><TrainFront size={22} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Txt w="bold" style={{ fontSize: 17 }}>{tr('Metro')}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              {p.metro ? <Txt style={{ fontSize: 14, color: colors.sub }}>{tr('Nearest: {station}', { station: p.metro })}</Txt> : <Txt style={{ fontSize: 14, color: colors.sub }}>{tr('Nearest metro:')} </Txt>}
              {!p.metro ? <NotAvailable size={14} /> : p.metroUnverified ? <Unverified /> : null}
            </View>
          </View>
        </View>
        {metro ? (
          <View style={s.fareBox}>
            <Txt w="bold" style={{ fontSize: 22, color: colors.ink }}>{tr('About ₹{fare}', { fare: metro.fare })}</Txt>
            <Txt style={{ fontSize: 13, color: colors.sub }}>
              {tr('Estimated one-way fare for one adult, {kind}. The exact fare depends on the station you board at. Airport Express costs more.', { kind: metro.sunday ? tr('Sunday rate') : tr('Monday to Saturday') })}
            </Txt>
          </View>
        ) : null}
        <Cta label={tr('Book metro ticket on ixigo')} hint={tr('Opens ixigo in your browser or app')} url={IXIGO_METRO_URL} onPress={() => open(IXIGO_METRO_URL)} />
        <Txt style={{ fontSize: 12, color: colors.sub }}>{tr('You choose your stations on ixigo. Tickets are QR codes for Delhi Metro.')}</Txt>
      </View>

      <View style={s.card}>
        <View style={s.head}>
          <View style={[s.icon, { backgroundColor: '#fff1d6' }]}><Car size={22} color="#9a5b00" /></View>
          <View style={{ flex: 1 }}>
            <Txt w="bold" style={{ fontSize: 17 }}>{tr('Cab')}</Txt>
            <Txt style={{ fontSize: 14, color: colors.sub }}>{tr('Pick the app you prefer')}</Txt>
          </View>
        </View>
        {cab ? (
          <View style={s.fareBox}>
            <Txt w="bold" style={{ fontSize: 22, color: colors.ink }}>{tr('₹{low} to ₹{high}', { low: cab.low, high: cab.high })}</Txt>
            <Txt style={{ fontSize: 13, color: colors.sub }}>
              {tr('Estimated for a basic cab, about {km} km by road. Real prices change with traffic and demand and are shown in each app before you book.', { km: cab.roadKm.toFixed(1) })}
            </Txt>
          </View>
        ) : null}
        {CAB_APPS.map((a) => <AppRow key={a.id} app={a} place={p} from={from} />)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fareBox: { backgroundColor: colors.fill, borderRadius: 12, padding: 12, gap: 4 },
  cta: { minHeight: 48, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  app: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
});

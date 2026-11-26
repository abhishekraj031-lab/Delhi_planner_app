import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Car, ChevronRight, MapPin, TrainFront } from 'lucide-react-native';
import type { Place } from '../types';
import { colors } from '../theme';
import { CAB_APPS, estimateCab, estimateMetro, IXIGO_METRO_URL } from '../lib/commute';
import { formatAway } from '../lib/distance';
import { NotAvailable, Txt, Unverified } from './ui';

const open = (url: string) => { Linking.openURL(url).catch(() => {}); };

function Cta({ label, onPress, hint }: { label: string; onPress: () => void; hint: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} accessibilityHint={hint} style={({ pressed }) => [s.cta, { opacity: pressed ? 0.8 : 1 }]}>
      <Txt w="bold" style={{ fontSize: 16, color: colors.white }}>{label}</Txt>
    </Pressable>
  );
}

/** "Getting there": one card for the metro and one for a cab, each with an estimated fare and a way to book. */
export function CommuteCards({ place: p, km, day, locState, onAllowLocation }: { place: Place; km: number | null; day: number; locState: 'idle' | 'asking' | 'denied' | 'error'; onAllowLocation: () => void }) {
  const metro = estimateMetro(km, day);
  const cab = estimateCab(km);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ paddingHorizontal: 4, gap: 2 }}>
        <Txt w="bold" style={{ fontSize: 18, color: colors.ink }}>Getting there</Txt>
        {km != null ? <Txt style={{ fontSize: 13, color: colors.sub }}>{`${formatAway(km)} from you, in a straight line. Fares are estimates.`}</Txt> : null}
      </View>

      {km == null ? (
        <View style={s.card}>
          <View style={s.head}>
            <View style={[s.icon, { backgroundColor: '#e6f6ec' }]}><MapPin size={22} color="#166534" /></View>
            <View style={{ flex: 1 }}>
              <Txt w="bold" style={{ fontSize: 17 }}>Allow location</Txt>
              <Txt style={{ fontSize: 14, color: colors.sub }}>See estimated metro and cab fares from where you are.</Txt>
            </View>
          </View>
          {locState === 'denied' ? <Txt style={{ fontSize: 13, color: colors.warn }}>Location is turned off for this app, so your phone may not ask again. Allow it in your phone settings, then tap Allow location.</Txt> : null}
          <Cta label={locState === 'asking' ? 'Finding your location…' : 'Allow location'} hint="Asks permission to use your location" onPress={onAllowLocation} />
          {locState === 'denied' && Platform.OS !== 'web' ? (
            <Pressable onPress={() => { Linking.openSettings().catch(() => {}); }} accessibilityRole="button" style={s.app}>
              <Txt w="semi" style={{ flex: 1, fontSize: 15 }}>Open phone settings</Txt><ChevronRight size={18} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={s.card}>
        <View style={s.head}>
          <View style={[s.icon, { backgroundColor: '#e6efff' }]}><TrainFront size={22} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Txt w="bold" style={{ fontSize: 17 }}>Metro</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              {p.metro ? <Txt style={{ fontSize: 14, color: colors.sub }}>Nearest: {p.metro}</Txt> : <Txt style={{ fontSize: 14, color: colors.sub }}>Nearest metro: </Txt>}
              {!p.metro ? <NotAvailable size={14} /> : p.metroUnverified ? <Unverified /> : null}
            </View>
          </View>
        </View>
        {metro ? (
          <View style={s.fareBox}>
            <Txt w="bold" style={{ fontSize: 22, color: '#1d5fc4' }}>About ₹{metro.fare}</Txt>
            <Txt style={{ fontSize: 13, color: colors.sub }}>
              Estimated one-way fare for one adult, {metro.sunday ? 'Sunday rate' : 'Monday to Saturday'}. The exact fare depends on the station you board at. Airport Express costs more.
            </Txt>
          </View>
        ) : null}
        <Cta label="Book metro ticket on ixigo" hint="Opens ixigo in your browser or app" onPress={() => open(IXIGO_METRO_URL)} />
        <Txt style={{ fontSize: 12, color: colors.sub }}>You choose your stations on ixigo. Tickets are QR codes for Delhi Metro.</Txt>
      </View>

      <View style={s.card}>
        <View style={s.head}>
          <View style={[s.icon, { backgroundColor: '#fff1d6' }]}><Car size={22} color="#9a5b00" /></View>
          <View style={{ flex: 1 }}>
            <Txt w="bold" style={{ fontSize: 17 }}>Cab</Txt>
            <Txt style={{ fontSize: 14, color: colors.sub }}>Pick the app you prefer</Txt>
          </View>
        </View>
        {cab ? (
          <View style={s.fareBox}>
            <Txt w="bold" style={{ fontSize: 22, color: '#1d5fc4' }}>₹{cab.low} to ₹{cab.high}</Txt>
            <Txt style={{ fontSize: 13, color: colors.sub }}>
              Estimated for a basic cab, about {cab.roadKm.toFixed(1)} km by road. Real prices change with traffic and demand and are shown in each app before you book.
            </Txt>
          </View>
        ) : null}
        {CAB_APPS.map((a) => (
          <Pressable key={a.id} onPress={() => open(a.url(p))} accessibilityRole="link" accessibilityLabel={`Check price and book on ${a.name}`} accessibilityHint={a.note}
            style={({ pressed }) => [s.app, { opacity: pressed ? 0.7 : 1 }]}>
            <View style={{ flex: 1 }}>
              <Txt w="semi" style={{ fontSize: 16 }}>{a.name}</Txt>
              <Txt style={{ fontSize: 12, color: colors.sub }}>{a.note}</Txt>
            </View>
            <Txt w="bold" style={{ fontSize: 14, color: colors.primary }}>Check price</Txt>
            <ChevronRight size={18} color={colors.primary} />
          </Pressable>
        ))}
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

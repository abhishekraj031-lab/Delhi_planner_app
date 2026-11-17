import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import type { Place } from '../types';
import { colors } from '../theme';
import { getStatus } from '../lib/status';
import { formatFee } from '../lib/pricing';
import { formatAway } from '../lib/distance';
import { Txt, Unverified } from './ui';
import { PlaceVisual } from './Visual';

type Props = { place: Place; km: number | null; day: number; today: Date | null; saved: boolean; onOpen: () => void; onToggleSave: () => void };

export const areaLabel = (p: Place) => (['Noida', 'Gurugram'].includes(p.area) ? p.area : `${p.area}, Delhi`);

const fmtTime = (m: number) => {
  const h = Math.floor(m / 60), min = m % 60, ap = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}${min ? `:${String(min).padStart(2, '0')}` : ''}${ap}`;
};

/** Status text for the badge on the photo: "Open till 5pm", "Today closed", etc. */
export function statusText(p: Place, day: number, today: Date | null) {
  const st = getStatus(p, day, today ?? undefined);
  if (st.kind === 'open') return { text: p.hours ? `Open till ${fmtTime(p.hours[1])}` : 'Open', muted: false, unverified: !!p.hoursUnverified };
  if (st.kind === 'unknown') return { text: 'Hours not available', muted: true, unverified: false };
  return { text: st.label, muted: false, unverified: false };
}

/** Airbnb-style listing: big rounded photo, badge on the photo, plain text lines underneath. */
function PlaceCardBase({ place, km, day, today, saved, onOpen, onToggleSave }: Props) {
  const fee = formatFee(place, day);
  const s = statusText(place, day, today);
  const metro = place.metro ? place.metro.split(' (')[0] : null;
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${place.name}. ${s.text}`} style={st.card}>
      <View>
        <PlaceVisual place={place} height={176} radius={{ borderRadius: 20 }} />
        <View style={st.badge}>
          <Txt w="semi" style={{ fontSize: 12, color: s.muted ? colors.sub : colors.ink }}>{s.text}</Txt>
          {s.unverified ? <Unverified /> : null}
        </View>
        <Pressable onPress={onToggleSave} hitSlop={14} accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`} style={st.heart}>
          <Heart size={28} color={saved ? '#ff385c' : colors.white} fill={saved ? '#ff385c' : 'rgba(0,0,0,0.35)'} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={st.text}>
        <View style={st.titleRow}>
          <Txt w="semi" style={{ fontSize: 16, lineHeight: 22, flex: 1 }} numberOfLines={1}>{place.name}</Txt>
          {fee ? (
            <View style={[st.fee, fee === 'Free' && st.feeFree]}>
              {fee === 'Free'
                ? <Txt w="bold" style={{ fontSize: 15, color: '#166534' }}>Free entry</Txt>
                : <><Txt w="bold" style={{ fontSize: 17, color: '#1d5fc4' }}>{fee}</Txt><Txt style={{ fontSize: 12, color: '#1d5fc4' }}> entry fee</Txt></>}
              {place.price.unverified ? <Unverified /> : null}
            </View>
          ) : <View style={st.feeNone}><Txt style={{ fontSize: 12, color: colors.sub }}>Fee not available</Txt></View>}
        </View>
        <Txt style={st.grey} numberOfLines={1}>
          {[place.area, km != null ? formatAway(km) : null, metro ? `${metro} metro` : null].filter(Boolean).join(' · ')}
        </Txt>
      </View>
    </Pressable>
  );
}
export const PlaceCard = React.memo(PlaceCardBase);

const st = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16 },
  heart: { position: 'absolute', top: 12, right: 12 },
  badge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', maxWidth: '75%', minHeight: 28, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  text: { marginTop: 8, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fee: { flexDirection: 'row', minHeight: 32, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#e8f0fe', alignItems: 'center' },
  feeFree: { backgroundColor: '#dcfce7' },
  feeNone: { minHeight: 32, paddingHorizontal: 10, borderRadius: 16, backgroundColor: colors.fill, justifyContent: 'center' },
  grey: { color: colors.sub, fontSize: 14, lineHeight: 20 },
});

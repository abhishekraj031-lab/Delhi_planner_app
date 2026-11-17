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
        <PlaceVisual place={place} height={224} radius={{ borderRadius: 20 }} />
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
        <Txt w="semi" style={{ fontSize: 16, lineHeight: 22 }} numberOfLines={1}>{place.name}</Txt>
        <Txt style={st.grey} numberOfLines={1}>{areaLabel(place)}{km != null ? ` · ${formatAway(km)} away` : ''}</Txt>
        <Txt style={[st.grey, !metro && { fontStyle: 'italic' }]} numberOfLines={1}>{metro ? `Near ${metro} metro` : 'Metro not available'}</Txt>
        <View style={st.feeRow}>
          {fee ? (
            <>
              <Txt w="semi" style={{ fontSize: 15 }}>{fee === 'Free' ? 'Free entry' : fee}</Txt>
              {fee !== 'Free' ? <Txt style={{ fontSize: 15 }}> entry fee</Txt> : null}
              {place.price.unverified ? <Unverified /> : null}
            </>
          ) : <Txt style={[st.grey, { fontStyle: 'italic' }]}>Fee not available</Txt>}
        </View>
      </View>
    </Pressable>
  );
}
export const PlaceCard = React.memo(PlaceCardBase);

const st = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 24 },
  heart: { position: 'absolute', top: 12, right: 12 },
  badge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', maxWidth: '75%', minHeight: 28, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  text: { marginTop: 10, gap: 1 },
  grey: { color: colors.sub, fontSize: 14, lineHeight: 20 },
  feeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
});

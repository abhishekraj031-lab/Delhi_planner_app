import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Clock4, Heart, MapPin, TicketCheck, TrainFront } from 'lucide-react-native';
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

/** Status text for the strip under the card: "Open till 5:00pm", "Today closed", etc. */
export function statusText(p: Place, day: number, today: Date | null) {
  const st = getStatus(p, day, today ?? undefined);
  if (st.kind === 'open') return { text: p.hours ? `Open till ${fmtTime(p.hours[1])}` : 'Open', muted: false, unverified: !!p.hoursUnverified };
  if (st.kind === 'unknown') return { text: 'Hours not available', muted: true, unverified: false };
  return { text: st.label, muted: false, unverified: false };
}

function PlaceCardBase({ place, km, day, today, saved, onOpen, onToggleSave }: Props) {
  const fee = formatFee(place, day);
  const s = statusText(place, day, today);
  const metro = place.metro ? place.metro.split(' (')[0] : null;
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${place.name}. ${s.text}`} style={st.card}>
      <View>
        <PlaceVisual place={place} height={144} radius={{ borderRadius: 12 }} />
        <Pressable onPress={onToggleSave} hitSlop={14} accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`} style={st.heart}>
          <Heart size={26} color={saved ? '#ff3b5c' : colors.white} fill={saved ? '#ff3b5c' : 'rgba(0,0,0,0.3)'} />
        </Pressable>
      </View>
      <View style={st.titleRow}>
        <View style={{ flex: 1 }}>
          <Txt w="bold" style={{ fontSize: 16, lineHeight: 22 }}>{place.name}</Txt>
          <View style={st.row}>
            <MapPin size={14} color={colors.sub} />
            <Txt style={{ color: colors.sub, fontSize: 12 }}>{areaLabel(place)}</Txt>
          </View>
        </View>
        <View style={st.fee}>
          <TicketCheck size={18} color={colors.white} />
          {fee ? (
            <>
              <Txt w="bold" style={{ color: colors.white, fontSize: 16 }}>{fee}</Txt>
              {place.price.unverified ? null : <Txt numberOfLines={1} style={{ color: colors.white, fontSize: 12 }}>{fee === 'Free' ? 'Entry' : 'Entry fee'}</Txt>}
              {place.price.unverified ? <Unverified /> : null}
            </>
          ) : <Txt style={{ color: colors.white, fontSize: 12 }}>Fee not available</Txt>}
        </View>
      </View>
      <View style={st.strip}>
        <View style={st.stripItem}>
          <TrainFront size={18} color={colors.ink} />
          {km != null ? <Txt w="bold" style={{ fontSize: 13 }}>{formatAway(km)}</Txt> : null}
          <Txt style={{ fontSize: 12, flexShrink: 1 }} numberOfLines={1}>{km != null ? `(${metro ?? 'Metro not available'})` : (metro ?? 'Metro not available')}</Txt>
        </View>
        <View style={st.sep} />
        <View style={[st.stripItem, { justifyContent: 'flex-end', flexWrap: 'wrap', rowGap: 2 }]}>
          <Clock4 size={18} color={colors.ink} />
          <Txt w="bold" style={{ fontSize: 13, color: s.muted ? colors.sub : colors.ink }}>{s.text}</Txt>
          {s.unverified ? <Unverified /> : null}
        </View>
      </View>
    </Pressable>
  );
}
export const PlaceCard = React.memo(PlaceCardBase);

const st = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, padding: 8, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  heart: { position: 'absolute', top: 10, right: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  fee: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.dark, maxWidth: '55%' },
  strip: { flexDirection: 'row', alignItems: 'center', marginTop: 8, minHeight: 36, borderRadius: 8, backgroundColor: colors.fill, paddingHorizontal: 10, paddingVertical: 4 },
  stripItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sep: { width: 1, alignSelf: 'stretch', backgroundColor: colors.line, marginHorizontal: 8 },
});

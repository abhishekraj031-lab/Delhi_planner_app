import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Clock4, Heart, MapPin, TicketCheck, TrainFront } from 'lucide-react-native';
import type { Place } from '../types';
import { colors } from '../theme';
import { getStatus } from '../lib/status';
import { formatFee } from '../lib/pricing';
import { formatAway } from '../lib/distance';
import { NotAvailable, Txt, Unverified } from './ui';
import { PlaceVisual } from './Visual';

type Props = { place: Place; km: number | null; day: number; today: Date | null; saved: boolean; onOpen: () => void; onToggleSave: () => void };

export const areaLabel = (p: Place) => (['Noida', 'Gurugram'].includes(p.area) ? p.area : `${p.area}, Delhi`);

function Stat({ icon, label, children, grow }: { icon: React.ReactNode; label: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <View style={[s.stat, grow && { flex: 1 }]}>
      {icon}
      <View style={{ flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>{children}</View>
        <Txt style={{ fontSize: 10 }}>{label}</Txt>
      </View>
    </View>
  );
}

function PlaceCardBase({ place, km, day, today, saved, onOpen, onToggleSave }: Props) {
  const st = getStatus(place, day, today ?? undefined);
  const fee = formatFee(place, day);
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${place.name}. ${st.label}`} style={s.card}>
      <View>
        <PlaceVisual place={place} height={141} radius={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
        <Pressable onPress={onToggleSave} hitSlop={10} accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`} style={s.heart}>
          <Heart size={24} color={saved ? '#ff3b5c' : colors.white} fill={saved ? '#ff3b5c' : 'rgba(0,0,0,0.3)'} />
        </Pressable>
        {st.kind === 'closed' || st.kind === 'partial' ? (
          <View style={s.badge}><Txt style={{ fontSize: 10, color: colors.white }}>{st.label}</Txt></View>
        ) : null}
      </View>
      <View style={s.body}>
        <Txt w="bold" style={{ fontSize: 14 }}>{place.name}</Txt>
        <View style={s.row}>
          <MapPin size={12} color={colors.ink} />
          <Txt style={{ flexShrink: 1 }}>{areaLabel(place)}{km != null ? ` · ${formatAway(km)}` : ''}</Txt>
        </View>
        <View style={s.stats}>
          <Stat icon={<TicketCheck size={24} color={colors.primary} />} label="Entry fee">
            {fee ? <Txt w="bold" style={s.val}>{fee}</Txt> : <NotAvailable size={14} />}
            {place.price.unverified && fee ? <Unverified /> : null}
          </Stat>
          <View style={s.div} />
          <Stat icon={<Clock4 size={24} color={colors.primary} />} label="Duration">
            {place.duration ? <Txt w="bold" style={s.val}>{place.duration}</Txt> : <NotAvailable size={14} />}
          </Stat>
          <View style={s.div} />
          <Stat icon={<TrainFront size={24} color={colors.primary} />} label="Nearest metro" grow>
            {place.metro ? <Txt w="bold" style={s.val} numberOfLines={1}>{place.metro.split(' (')[0]}</Txt> : <NotAvailable size={14} />}
          </Stat>
        </View>
      </View>
    </Pressable>
  );
}
export const PlaceCard = React.memo(PlaceCardBase);

const s = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12 },
  heart: { position: 'absolute', top: 12, right: 12 },
  badge: { position: 'absolute', right: 12, bottom: 12, height: 20, borderRadius: 99, paddingHorizontal: 10, backgroundColor: colors.dark, justifyContent: 'center' },
  body: { paddingTop: 12, paddingBottom: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  div: { width: 1, alignSelf: 'stretch', backgroundColor: colors.line },
  val: { fontSize: 14, lineHeight: 21 },
});

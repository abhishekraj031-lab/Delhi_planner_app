import React, { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import type { Place } from '../types';
import { colors } from '../theme';
import { SUPPORT_EMAIL } from '../config';
import { DAY_NAMES, FULL_DAY_NAMES, getStatus } from '../lib/status';
import { estimateTotal, formatFee, hasPrice, VisitorType } from '../lib/pricing';
import { formatAway } from '../lib/distance';
import { Button, Chip, NotAvailable, Txt, Unverified } from './ui';
import { PlaceVisual } from './Visual';
import { Sheet } from './Sheet';
import { areaLabel } from './PlaceCard';

type Props = { place: Place | null; km: number | null; day: number; today: Date | null; saved: boolean; onClose: () => void; onToggleSave: () => void };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ gap: 4 }}>
    <Txt w="bold" style={{ fontSize: 18, color: colors.heading }}>{title}</Txt>
    {children}
  </View>
);
const Body = ({ children }: { children: React.ReactNode }) => <Txt style={{ color: colors.heading, fontSize: 14, lineHeight: 21 }}>{children}</Txt>;
const Row = ({ label, value, unverified }: { label: string; value: string; unverified?: boolean }) => (
  <View style={s.row}>
    <Txt style={{ color: colors.heading, fontSize: 14, flex: 1 }}>{label}</Txt>
    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
      {value === 'Not available' ? <NotAvailable /> : <Txt w="semi" style={{ color: colors.heading, fontSize: 14, textAlign: 'right', flexShrink: 1 }}>{value}</Txt>}
      {unverified ? <Unverified /> : null}
    </View>
  </View>
);

export const directionsUrl = (p: Place) =>
  Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export function PlaceSheet({ place, km, day, today, saved, onClose, onToggleSave }: Props) {
  const [who, setWho] = useState<VisitorType>('i');
  const [count, setCount] = useState(2);
  const p = place;
  if (!p) return <Sheet visible={false} onClose={onClose} label="" />;
  const st = getStatus(p, day, today ?? undefined);
  const open = [1, 2, 3, 4, 5, 6, 0].filter((d) => !(p.closedDays ?? []).includes(d)).map((d) => DAY_NAMES[d]);
  const total = estimateTotal(p, day, who, count);
  const fee = formatFee(p, day);
  return (
    <Sheet visible onClose={onClose} label={p.name}>
      <View>
        <View>
          <PlaceVisual place={p} height={155} radius={{ borderRadius: 10 }} />
          <Pressable onPress={onToggleSave} hitSlop={14} accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved' : 'Save place'} style={{ position: 'absolute', top: 12, right: 12 }}>
            <Heart size={26} color={saved ? '#ff3b5c' : colors.white} fill={saved ? '#ff3b5c' : 'rgba(0,0,0,0.3)'} />
          </Pressable>
          {st.kind === 'closed' || st.kind === 'partial' ? (
            <View style={s.badge}><Txt style={{ fontSize: 12, color: colors.white }}>{st.label}</Txt></View>
          ) : null}
        </View>
        <View style={[s.row, { marginTop: 8, alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Txt w="bold" style={{ fontSize: 18, color: colors.heading }}>{p.name}</Txt>
            <Txt style={{ fontSize: 13, color: colors.heading }}>{areaLabel(p)}{km != null ? ` · ${formatAway(km)}` : ''}</Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Txt w="semi" style={{ fontSize: 14, color: colors.heading }}>Entry </Txt>
              {fee ? <Txt w="semi" style={{ fontSize: 14, color: colors.heading }}>{fee}</Txt> : <NotAvailable size={14} />}
              {p.price.unverified && fee ? <Unverified /> : null}
            </View>
            {p.duration ? <Txt style={{ fontSize: 13, color: colors.heading }}>{p.duration}</Txt> : <NotAvailable size={13} />}
          </View>
        </View>
      </View>

      <Section title="Overview">{p.description ? <Body>{p.description}</Body> : <NotAvailable />}</Section>
      <Section title="Visiting Details">
        {p.closedDays ? (
          <>
            <Body>Open - {open.join(', ')}</Body>
            <Body>Closed - {p.closedDays.length ? p.closedDays.map((d) => FULL_DAY_NAMES[d]).join(', ') : 'No weekly closed day'}</Body>
            {st.note ? <Txt style={{ color: colors.warn }}>{st.note}</Txt> : null}
          </>
        ) : <NotAvailable />}
      </Section>
      <Section title="Visiting Timing">
        {p.hoursText ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}><Body>{p.hoursText}</Body>{p.hoursUnverified ? <Unverified /> : null}</View>
        ) : <NotAvailable />}
      </Section>
      <Section title="Tickets">
        {p.tickets.map((t) => <Row key={t.label} label={t.label} value={t.value} unverified={t.unverified} />)}
        {hasPrice(p, day) && fee !== 'Free' ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Chip label="Indian" on={who === 'i'} onPress={() => setWho('i')} />
              <Chip label="Foreign" on={who === 'f'} onPress={() => setWho('f')} />
              <Chip label="−" on={false} onPress={() => setCount((c) => Math.max(1, c - 1))} />
              <Txt w="semi" style={{ fontSize: 14 }}>{count} visitors</Txt>
              <Chip label="+" on={false} onPress={() => setCount((c) => c + 1)} />
            </View>
            {total == null ? <NotAvailable /> : <Txt w="bold" style={{ fontSize: 16 }}>Estimate ₹{total}</Txt>}
            <Txt style={{ color: colors.sub, fontSize: 12 }}>Adult rate only. Children and seniors may pay less.</Txt>
          </View>
        ) : null}
      </Section>
      <Section title="Nearest Transport">{p.metro ? <Body>By Metro - {p.metro}</Body> : <NotAvailable />}</Section>
      <Section title="What’s allowed">{p.rules.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}</Section>

      <View style={{ gap: 4 }}>
        <Txt style={{ color: colors.sub, fontSize: 12, lineHeight: 18 }}>
          Source: {p.source}. {p.verifiedNote}
          {p.photoCredit ? `\nPhoto: ${p.photoCredit} (Wikimedia Commons)` : ''}
        </Txt>
        <Pressable accessibilityRole="link" hitSlop={{ top: 14, bottom: 14 }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Correction: ${p.name}`)}`)}>
          <Txt style={{ color: colors.sub, fontSize: 13, textDecorationLine: 'underline' }}>Report wrong information</Txt>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {p.bookUrl ? <Button label="Book tickets" outline onPress={() => Linking.openURL(p.bookUrl as string)} /> : null}
        <Button label="Get directions" onPress={() => Linking.openURL(directionsUrl(p))} />
      </View>
    </Sheet>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 3 },
  badge: { position: 'absolute', left: 12, top: 12, minHeight: 24, borderRadius: 99, paddingHorizontal: 10, backgroundColor: colors.dark, justifyContent: 'center' },
});

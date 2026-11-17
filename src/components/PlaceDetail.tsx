import React, { useState } from 'react';
import { Linking, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Place } from '../types';
import { colors } from '../theme';
import { SUPPORT_EMAIL } from '../config';
import { photos } from '../data/photos';
import { DAY_NAMES, FULL_DAY_NAMES, getStatus } from '../lib/status';
import { estimateTotal, formatFee, hasPrice, VisitorType } from '../lib/pricing';
import { formatAway } from '../lib/distance';
import { Button, Chip, NotAvailable, Txt, Unverified } from './ui';
import { PlaceVisual } from './Visual';
import { statusText } from './PlaceCard';

type Nearby = { place: Place; km: number };
type Props = { place: Place | null; km: number | null; day: number; today: Date | null; saved: boolean; nearby: Nearby[]; onOpenPlace: (id: string) => void; onClose: () => void; onToggleSave: () => void };

const PAGE_BG = '#f4f5fa';
const HERO_H = 280;
const STATUS_TONE = {
  open: { bg: '#dcfce7', fg: '#166534' },
  closed: { bg: '#fee2e2', fg: '#991b1b' },
  partial: { bg: '#fef3c7', fg: '#92400e' },
  unknown: { bg: colors.fill, fg: colors.sub },
} as const;

export const directionsUrl = (p: Place) =>
  Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

const areaText = (p: Place) => (['Noida', 'Gurugram'].includes(p.area) ? p.area : `${p.area}, Delhi`);

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      {title ? <Txt w="bold" style={s.cardTitle}>{title}</Txt> : null}
      {children}
    </View>
  );
}
const Body = ({ children }: { children: React.ReactNode }) => <Txt style={s.body}>{children}</Txt>;
function Row({ label, value, unverified }: { label: string; value: string; unverified?: boolean }) {
  return (
    <View style={s.row}>
      <Txt style={[s.body, { flex: 1 }]}>{label}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
        {value === 'Not available' ? <NotAvailable size={15} /> : <Txt w="semi" style={[s.body, { textAlign: 'right', flexShrink: 1 }]}>{value}</Txt>}
        {unverified ? <Unverified /> : null}
      </View>
    </View>
  );
}
const CircleBtn = ({ children, onPress, label, side, top }: { children: React.ReactNode; onPress: () => void; label: string; side: 'left' | 'right'; top: number }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={[s.circle, { top, [side]: 16 }]}>{children}</Pressable>
);

export function PlaceDetail({ place, km, day, today, saved, nearby, onOpenPlace, onClose, onToggleSave }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [who, setWho] = useState<VisitorType>('i');
  const [count, setCount] = useState(2);
  const [page, setPage] = useState(0);
  const p = place;
  if (!p) return null;

  // One photo per place today. Add more entries here later and the swipe + dots appear automatically.
  const images: (typeof photos)[string][] = photos[p.id] ? [photos[p.id]] : [];
  const slides = Math.max(1, images.length);
  const st = getStatus(p, day, today ?? undefined);
  const tone = STATUS_TONE[st.kind];
  const stText = statusText(p, day, today);
  const open = [1, 2, 3, 4, 5, 6, 0].filter((d) => !(p.closedDays ?? []).includes(d)).map((d) => DAY_NAMES[d]);
  const fee = formatFee(p, day);
  // Quick facts, shown only when the data is known.
  const facts: string[] = [];
  if (hasPrice(p, day) && p.price.weekday.i === 0 && !p.price.unverified) facts.push('Free entry');
  if (p.closedDays) {
    if (p.closedDays.length === 0) facts.push('Open daily');
    else if (p.closedDays.length < 7) facts.push(`Closed ${p.closedDays.map((d) => DAY_NAMES[d]).join(', ')}`);
  }
  if (p.metro && !p.metroUnverified) facts.push(`Metro: ${p.metro.replace(/\s*\(.*\)$/, '')}`);
  const total = estimateTotal(p, day, who, count);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const top = insets.top + 8;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
        <ScrollView key={p.id} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Photos */}
          <View style={{ height: HERO_H, backgroundColor: '#e9e9ef' }}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} scrollEnabled={slides > 1}>
              {(images.length ? images : [null]).map((_, i) => (
                <View key={i} style={{ width, height: HERO_H }}>
                  <PlaceVisual place={p} height={HERO_H} radius={{}} />
                </View>
              ))}
            </ScrollView>
            {slides > 1 ? (
              <View style={s.dots} pointerEvents="none">
                {Array.from({ length: slides }).map((_, i) => <View key={i} style={[s.dot, i === page && s.dotOn]} />)}
              </View>
            ) : null}
          </View>

          {/* Content */}
          <View style={s.sheet}>
            <View style={s.cards}>
              <Card>
                <Txt w="bold" style={{ fontSize: 24, lineHeight: 30 }}>{p.name}</Txt>
                <Txt style={{ fontSize: 15, color: colors.sub }}>{areaText(p)}{km != null ? ` · ${formatAway(km)} away` : ''}</Txt>
                <View style={s.chips}>
                  <View style={[s.pill, { backgroundColor: tone.bg, flexDirection: 'row', alignItems: 'center' }]}>
                    <Txt w="semi" style={{ fontSize: 13, color: tone.fg }}>{stText.text}</Txt>
                    {stText.unverified ? <Unverified /> : null}
                  </View>
                  <View style={[s.pill, { backgroundColor: colors.fill }]}>
                    {p.duration ? <Txt w="semi" style={{ fontSize: 13 }}>{p.duration}</Txt> : <NotAvailable size={13} />}
                  </View>
                  {facts.map((f) => (
                    <View key={f} style={[s.pill, { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }]}>
                      <Txt w="semi" style={{ fontSize: 13 }}>{f}</Txt>
                    </View>
                  ))}
                </View>
              </Card>

              <Card title="About">{p.description ? <Body>{p.description}</Body> : <NotAvailable size={15} />}</Card>

              {p.thingsToKnow?.length ? (
                <Card title="Things to know">
                  {p.thingsToKnow.map((t) => (
                    <View key={t} style={s.tip}><View style={s.bullet} /><Txt style={[s.body, { flex: 1 }]}>{t}</Txt></View>
                  ))}
                </Card>
              ) : null}

              <Card title="Opening hours">
                {p.closedDays ? (
                  <>
                    <Row label="Open" value={open.join(', ')} />
                    <Row label="Closed" value={p.closedDays.length ? p.closedDays.map((d) => FULL_DAY_NAMES[d]).join(', ') : 'No weekly closed day'} />
                  </>
                ) : <Row label="Open days" value="Not available" />}
                <View style={s.row}>
                  <Txt style={[s.body, { flex: 1 }]}>Timing</Txt>
                  {p.hoursText ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                      <Txt w="semi" style={[s.body, { textAlign: 'right', flexShrink: 1 }]}>{p.hoursText}</Txt>
                      {p.hoursUnverified ? <Unverified /> : null}
                    </View>
                  ) : <NotAvailable size={15} />}
                </View>
                {st.note ? <View style={s.note}><Txt style={{ fontSize: 14, color: colors.warn }}>{st.note}</Txt></View> : null}
              </Card>

              <Card title="Tickets">
                {p.tickets.length ? p.tickets.map((t) => <Row key={t.label} label={t.label} value={t.value} unverified={t.unverified} />) : <NotAvailable size={15} />}
                {hasPrice(p, day) && fee !== 'Free' ? (
                  <View style={s.estimate}>
                    <Txt w="semi" style={{ fontSize: 14 }}>Estimate for your group</Txt>
                    <View style={s.chips}>
                      <Chip label="Indian" on={who === 'i'} onPress={() => setWho('i')} />
                      <Chip label="Foreign" on={who === 'f'} onPress={() => setWho('f')} />
                    </View>
                    <View style={[s.chips, { alignItems: 'center' }]}>
                      <Chip label="−" on={false} onPress={() => setCount((c) => Math.max(1, c - 1))} />
                      <Txt w="semi" style={{ fontSize: 15, minWidth: 84, textAlign: 'center' }}>{count} visitor{count > 1 ? 's' : ''}</Txt>
                      <Chip label="+" on={false} onPress={() => setCount((c) => c + 1)} />
                    </View>
                    {total == null ? <NotAvailable size={15} /> : <Txt w="bold" style={{ fontSize: 18, color: '#1d5fc4' }}>Estimate ₹{total}</Txt>}
                    <Txt style={{ fontSize: 12, color: colors.sub }}>Adult rate only. Children and seniors may pay less.</Txt>
                  </View>
                ) : null}
              </Card>

              {nearby.length ? (
                <Card title="Nearby places">
                  <Txt style={{ fontSize: 13, color: colors.sub }}>Close by, so you can visit more than one in a day.</Txt>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 4 }}>
                    {nearby.map(({ place: n, km: d }) => (
                      <Pressable key={n.id} onPress={() => onOpenPlace(n.id)} accessibilityRole="button" accessibilityLabel={`Open ${n.name}`}
                        style={({ pressed }) => [s.near, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={{ borderRadius: 12, overflow: 'hidden' }}><PlaceVisual place={n} height={84} radius={{}} /></View>
                        <Txt w="semi" numberOfLines={1} style={{ fontSize: 14 }}>{n.name}</Txt>
                        <Txt numberOfLines={1} style={{ fontSize: 12, color: colors.sub }}>{d < 1 ? 'Under 1 km' : `${d.toFixed(1)} km`} from here</Txt>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Card>
              ) : null}

              <Card title="Getting there">
                <Row label="Nearest metro" value={p.metro ?? 'Not available'} unverified={!!p.metro && !!p.metroUnverified} />
                {km != null ? <Row label="From you" value={`${formatAway(km)} (straight line)`} /> : null}
              </Card>

              <Card title="What’s allowed">
                {p.rules.length ? p.rules.map((r) => <Row key={r.label} label={r.label} value={r.value} />) : <NotAvailable size={15} />}
              </Card>

              <Card>
                <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.sub }}>
                  Source: {p.source}. {p.verifiedNote}
                  {p.photoCredit ? `\nPhoto: ${p.photoCredit} (Wikimedia Commons)` : ''}
                </Txt>
                <Pressable accessibilityRole="link" hitSlop={{ top: 12, bottom: 12 }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Correction: ${p.name}`)}`)}>
                  <Txt style={{ fontSize: 14, color: colors.primary, textDecorationLine: 'underline' }}>Report wrong information</Txt>
                </Pressable>
              </Card>
            </View>
          </View>
        </ScrollView>

        <CircleBtn onPress={onClose} label="Back" side="left" top={top}><ChevronLeft size={26} color={colors.ink} /></CircleBtn>
        <CircleBtn onPress={onToggleSave} label={saved ? 'Remove from saved' : 'Save place'} side="right" top={top}>
          <Heart size={24} color={saved ? '#ff385c' : colors.ink} fill={saved ? '#ff385c' : 'none'} />
        </CircleBtn>

        {/* Bottom bar */}
        <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flexShrink: 1 }}>
            <Txt style={{ fontSize: 12, color: colors.sub }}>Entry fee</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {fee ? <Txt w="bold" style={{ fontSize: 20 }}>{fee}</Txt> : <NotAvailable size={14} />}
              {fee && p.price.unverified ? <Unverified /> : null}
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            {p.bookUrl ? <View style={{ flex: 1 }}><Button label="Book tickets" outline onPress={() => Linking.openURL(p.bookUrl as string)} /></View> : null}
            <View style={{ flex: 1 }}><Button label="Directions" onPress={() => Linking.openURL(directionsUrl(p))} /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: { marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: PAGE_BG, paddingTop: 16 },
  cards: { paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 8 },
  cardTitle: { fontSize: 18, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.heading },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, minHeight: 28 },
  near: { width: 150, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: { minHeight: 30, paddingHorizontal: 12, borderRadius: 15, justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 9 },
  note: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginTop: 4 },
  estimate: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  circle: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  dots: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { backgroundColor: colors.white, width: 9, height: 9, borderRadius: 5 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 12, paddingHorizontal: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
});

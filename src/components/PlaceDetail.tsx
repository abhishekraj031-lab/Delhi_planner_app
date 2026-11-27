import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ChevronLeft, Heart, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Coords, Place } from '../types';
import { colors } from '../theme';
import { SUPPORT_EMAIL } from '../config';
import { photos } from '../data/photos';
import { DAY_NAMES, FULL_DAY_NAMES, getStatus } from '../lib/status';
import { formatFee, hasPrice } from '../lib/pricing';
import { formatAway } from '../lib/distance';
import { formatChecked, formatCount, googleReviewsUrl } from '../lib/rating';
import { Button, NotAvailable, Txt, Unverified } from './ui';
import { PlaceVisual } from './Visual';
import { CommuteCards } from './CommuteCards';
import { areaLabel, statusText } from './PlaceCard';
import { tr } from '../i18n';
import { inFrame, post } from '../lib/bridge';

type Nearby = { place: Place; km: number };
type Props = { place: Place | null; km: number | null; loc: Coords | null; locState: 'idle' | 'asking' | 'denied' | 'error'; onAllowLocation: () => void; day: number; today: Date | null; saved: boolean; nearby: Nearby[]; onOpenPlace: (id: string) => void; onClose: () => void; onToggleSave: () => void };

const PAGE_BG = '#f4f5fa';
const HERO_H = 280;
const STATUS_TONE = {
  open: { bg: colors.fill, fg: colors.ink },
  closed: { bg: '#fee2e2', fg: '#991b1b' },
  partial: { bg: '#fef3c7', fg: '#92400e' },
  unknown: { bg: colors.fill, fg: colors.sub },
} as const;

export const directionsUrl = (p: Place) =>
  Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;


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
      <Txt style={[s.body, { flex: 1 }]}>{tr(label)}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
        {value === 'Not available' ? <NotAvailable size={15} /> : <Txt w="semi" style={[s.body, { textAlign: 'right', flexShrink: 1 }]}>{tr(value)}</Txt>}
        {unverified ? <Unverified /> : null}
      </View>
    </View>
  );
}
const CircleBtn = ({ children, onPress, label, side, top }: { children: React.ReactNode; onPress: () => void; label: string; side: 'left' | 'right'; top: number }) => (
  <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={[s.circle, { top, [side]: 16 }]}>{children}</Pressable>
);

export function PlaceDetail({ place, km, loc, locState, onAllowLocation, day, today, saved, nearby, onOpenPlace, onClose, onToggleSave }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroller = useRef<any>(null);
  // Every place opens at the top; the person scrolls down themselves.
  // Preview only: let the photo run under the phone's status bar, with no white strip above it.
  useEffect(() => {
    if (!place) return;
    post({ dx: 'bar', bg: 'transparent', fg: '#ffffff' });
    return () => post({ dx: 'bar', bg: '#ffffff', fg: '#111216' });
  }, [!!place]);
  useEffect(() => { setPage(0); scroller.current?.scrollTo({ y: 0, animated: false }); }, [place?.id]);
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
  if (hasPrice(p, day) && p.price.weekday.i === 0 && !p.price.unverified) facts.push(tr('Free entry'));
  if (p.closedDays) {
    if (p.closedDays.length === 0) facts.push(tr('Open daily'));
    else if (p.closedDays.length < 7) facts.push(tr('Closed {days}', { days: p.closedDays.map((d) => DAY_NAMES[d]).join(', ') }));
  }
  if (p.metro && !p.metroUnverified) facts.push(tr('Metro: {station}', { station: p.metro.replace(/\s*\(.*\)$/, '') }));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const top = insets.top + 8 + (inFrame ? 53 : 0);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
        <ScrollView key={p.id} ref={scroller} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
                <Txt style={{ fontSize: 15, color: colors.sub }}>{areaLabel(p)}{km != null ? ` · ${formatAway(km)}` : ''}</Txt>
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

              <Card title={tr('About')}>{p.description ? <Body>{p.description}</Body> : <NotAvailable size={15} />}</Card>

              {p.thingsToKnow?.length ? (
                <Card title={tr('Things to know')}>
                  {p.thingsToKnow.map((t) => (
                    <View key={t} style={s.tip}><View style={s.bullet} /><Txt style={[s.body, { flex: 1 }]}>{t}</Txt></View>
                  ))}
                </Card>
              ) : null}

              <Card title={tr('Opening hours')}>
                {p.closedDays ? (
                  <>
                    <Row label="Open" value={open.join(', ')} />
                    <Row label="Closed" value={p.closedDays.length ? p.closedDays.map((d) => FULL_DAY_NAMES[d]).join(', ') : 'No weekly closed day'} />
                  </>
                ) : <Row label="Open days" value="Not available" />}
                <View style={s.row}>
                  <Txt style={[s.body, { flex: 1 }]}>{tr('Timing')}</Txt>
                  {p.hoursText ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                      <Txt w="semi" style={[s.body, { textAlign: 'right', flexShrink: 1 }]}>{p.hoursText}</Txt>
                      {p.hoursUnverified ? <Unverified /> : null}
                    </View>
                  ) : <NotAvailable size={15} />}
                </View>
                {st.note ? <View style={s.note}><Txt style={{ fontSize: 14, color: colors.warn }}>{st.note}</Txt></View> : null}
              </Card>

              <Card title={tr('Tickets')}>
                {p.tickets.length ? p.tickets.map((t) => <Row key={t.label} label={t.label} value={t.value} unverified={t.unverified} />) : <NotAvailable size={15} />}
              </Card>


              <CommuteCards place={p} km={km} from={loc} day={day} locState={locState} onAllowLocation={onAllowLocation} />

              <Card title={tr('Google rating')}>
                {p.rating ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Txt w="bold" style={{ fontSize: 34, lineHeight: 40 }}>{p.rating.score.toFixed(1)}</Txt>
                      <View style={{ gap: 2 }}>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={16} color={colors.ink} strokeWidth={2}
                              fill={p.rating!.score >= i - 0.25 ? colors.ink : 'transparent'} />
                          ))}
                        </View>
                        <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('{count} Google reviews', { count: formatCount(p.rating.count) })}</Txt>
                      </View>
                    </View>
                    <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.sub }}>
                      {tr('Source: {source}. Checked {date}. Ratings change over time.', { source: p.rating.source, date: formatChecked(p.rating.checked) })}
                    </Txt>
                  </>
                ) : <NotAvailable size={15} />}
                <Pressable accessibilityRole="link" hitSlop={{ top: 12, bottom: 12 }} onPress={() => Linking.openURL(googleReviewsUrl(p))}>
                  <Txt w="semi" style={{ fontSize: 14, color: colors.secondary, textDecorationLine: 'underline' }}>{tr('See reviews on Google Maps')}</Txt>
                </Pressable>
              </Card>

              <Card title={tr('What’s allowed')}>
                {p.rules.length ? p.rules.map((r) => <Row key={r.label} label={r.label} value={r.value} />) : <NotAvailable size={15} />}
              </Card>

              <Card>
                <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.sub }}>
                  {tr('Source: {source}.', { source: p.source })} {p.verifiedNote}
                  {p.photoCredit ? `\n${tr('Photo: {credit} (Wikimedia Commons)', { credit: p.photoCredit })}` : ''}
                </Txt>
                <Pressable accessibilityRole="link" hitSlop={{ top: 12, bottom: 12 }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Correction: ${p.name}`)}`)}>
                  <Txt style={{ fontSize: 14, color: colors.primaryText, textDecorationLine: 'underline' }}>{tr('Report wrong information')}</Txt>
                </Pressable>
              </Card>
              {nearby.length ? (
                <Card title={tr('Nearby places')}>
                  <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('Close by, so you can visit more than one in a day.')}</Txt>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 4 }}>
                    {nearby.map(({ place: n, km: d }) => (
                      <Pressable key={n.id} onPress={() => onOpenPlace(n.id)} accessibilityRole="button" accessibilityLabel={tr('Open {name}', { name: n.name })}
                        style={({ pressed }) => [s.near, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={{ borderRadius: 12, overflow: 'hidden' }}><PlaceVisual place={n} height={84} radius={{}} /></View>
                        <Txt w="semi" numberOfLines={1} style={{ fontSize: 14 }}>{n.name}</Txt>
                        <Txt numberOfLines={1} style={{ fontSize: 12, color: colors.sub }}>{tr('{dist} from here', { dist: d < 1 ? tr('Under 1 km') : tr('{n} km', { n: d.toFixed(1) }) })}</Txt>
                        {getStatus(n, day).kind === 'closed' ? <Txt w="semi" numberOfLines={1} style={{ fontSize: 12, color: STATUS_TONE.closed.fg }}>{getStatus(n, day).label}</Txt> : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                </Card>
              ) : null}

            </View>
          </View>
        </ScrollView>

        <CircleBtn onPress={onClose} label={tr('Back')} side="left" top={top}><ChevronLeft size={26} color={colors.ink} /></CircleBtn>
        {/* Same heart as on the home cards: bare, white with a soft dark fill, top right of the photo. */}
        <Pressable onPress={onToggleSave} hitSlop={14} accessibilityRole="button" accessibilityLabel={saved ? tr('Remove from saved') : tr('Save place')} style={{ position: 'absolute', top: top + 8, right: 16 }}>
          <Heart size={28} color={saved ? '#ff385c' : colors.white} fill={saved ? '#ff385c' : 'rgba(0,0,0,0.35)'} strokeWidth={2} />
        </Pressable>

        {/* Bottom bar */}
        <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flexShrink: 1 }}>
            <Txt style={{ fontSize: 12, color: colors.sub }}>{tr('Entry fee')}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {fee ? <Txt w="bold" style={{ fontSize: 20 }}>{fee}</Txt> : <NotAvailable size={14} />}
              {fee && p.price.unverified ? <Unverified /> : null}
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            {p.bookUrl
              ? <View style={{ flex: 1 }}><Button label={tr('Book tickets')} url={p.bookUrl} onPress={() => Linking.openURL(p.bookUrl as string)} /></View>
              : <View style={{ flex: 1 }}><Button label={tr('Directions')} url={directionsUrl(p)} onPress={() => Linking.openURL(directionsUrl(p))} /></View>}
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
  circle: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  dots: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { backgroundColor: colors.white, width: 9, height: 9, borderRadius: 5 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 12, paddingHorizontal: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
});

import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AREAS } from '../data/areas';
import { colors } from '../theme';
import type { LocationState } from '../hooks/useLocation';
import type { Category, UserLocation } from '../types';
import { Button, Chip, Txt } from './ui';
import { Sheet } from './Sheet';
import { BUDGETS, DAYS_FOR, Extra, NO_EXTRA, OPEN_TILL, OPENS_BY, WHEN_OPTIONS, WHERES } from '../lib/filters';
import { clock, dayName, tr } from '../i18n';

type FilterProps = {
  visible: boolean; onClose: () => void; extra: Extra; category: Category | 'All'; categories: Category[];
  hasLocation: boolean; onSetLocation: () => void;
  countFor: (x: Extra, c: Category | 'All') => number; onApply: (x: Extra, c: Category | 'All') => void;
};
function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#E3E3E3', backgroundColor: colors.white }}>
      <View style={{ gap: 3 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
        {note ? <Txt style={{ color: colors.sub, fontSize: 12, lineHeight: 17 }}>{note}</Txt> : null}
      </View>
      {children}
    </View>
  );
}
const Divider = () => <View style={{ height: 1, backgroundColor: '#ECECEC' }} />;
const Row = ({ children }: { children: React.ReactNode }) => <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{children}</View>;

/** One sheet, grouped by what the visitor is deciding. Choices apply straight away; tapping a chosen chip clears it. */
export function FilterSheet(p: FilterProps) {
  // Choices are held here and only reach the list when the person taps the button at the bottom.
  const [x, setX] = useState<Extra>(p.extra);
  const [cat, setCat] = useState<Category | 'All'>(p.category);
  useEffect(() => { if (p.visible) { setX(p.extra); setCat(p.category); } }, [p.visible]);
  const set = (patch: Partial<Extra>) => setX((e) => ({ ...e, ...patch }));
  const count = p.countFor(x, cat);
  const dirty = JSON.stringify(x) !== JSON.stringify(NO_EXTRA);
  return (
    <Sheet visible={p.visible} onClose={p.onClose} label={tr('Filters')}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt w="bold" style={{ fontSize: 20, flex: 1 }}>{tr('Filters')}</Txt>
        {dirty ? <Pressable onPress={() => setX(NO_EXTRA)} hitSlop={8} accessibilityRole="button"><Txt w="semi" style={{ color: colors.primaryText }}>{tr('Clear all')}</Txt></Pressable> : null}
      </View>
      <Group title={tr('When are you going?')} note={tr('Weekdays is Monday to Friday. Places with unknown opening days are left out of day choices.')}>
        <Row>{WHEN_OPTIONS.map((o) => <Chip key={o.key} label={tr(o.label)} on={x.when === o.key} onPress={() => set({ when: o.key, pick: null, ...(o.key !== 'today' && x.now ? { now: false } : {}) })} />)}</Row>
        {x.when !== 'today' ? (
          <Row>{DAYS_FOR[x.when].map((d) => <Chip key={d} label={dayName(d, true)} on={x.pick === d} onPress={() => set({ pick: x.pick === d ? null : d })} />)}</Row>
        ) : null}
      </Group>
      <Group title={tr('Budget')} note={tr('Entry fee for an Indian adult on the chosen day. Places with no fee on record are left out.')}>
        <Row>{BUDGETS.map((o) => <Chip key={o.key} label={tr(o.label)} on={x.budget === o.key} onPress={() => set({ budget: x.budget === o.key ? null : o.key })} />)}</Row>
      </Group>
      <Group title={tr('Open hours')} note={tr('Based on opening and closing times on record. Places with no hours on record are left out. Pick both to plan a window, for example opens by 9 am and open till 6 pm.')}>
        <Row><Chip label={tr('Open now')} on={x.now} onPress={() => set(x.now ? { now: false } : { now: true, when: 'today', pick: null })} /></Row>
        <Divider />
        <Txt w="semi" style={{ fontSize: 13, color: colors.text }}>{tr('Opening time (opens by)')}</Txt>
        <Row>{OPENS_BY.map((o) => <Chip key={o.min} label={clock(o.min)} on={x.opensBy === o.min} onPress={() => set({ opensBy: x.opensBy === o.min ? null : o.min })} />)}</Row>
        <Divider />
        <Txt w="semi" style={{ fontSize: 13, color: colors.text }}>{tr('Closing time (open till at least)')}</Txt>
        <Row>{OPEN_TILL.map((o) => <Chip key={o.min} label={clock(o.min)} on={x.openTill === o.min} onPress={() => set({ openTill: x.openTill === o.min ? null : o.min })} />)}</Row>
      </Group>
      <Group title={tr('Where')} note={tr('Pick one. Distances are straight-line from your location. Metro uses the stations listed for each place.')}>
        <Row>{WHERES.map((o) => (
          <Chip key={o.key} label={tr(o.label)} on={x.where === o.key}
            onPress={() => (o.needsLocation && !p.hasLocation ? p.onSetLocation() : set({ where: x.where === o.key ? null : o.key }))} />
        ))}</Row>
        {!p.hasLocation ? <Pressable onPress={p.onSetLocation} accessibilityRole="button"><Txt w="semi" style={{ color: colors.primaryText, fontSize: 13 }}>{tr('Set your location to use distance options')}</Txt></Pressable> : null}
      </Group>
      <Group title={tr('Type')} note={tr('All shows every type together, so you can compare places across the city.')}>
        <Row>
          <Chip label={tr('All')} on={cat === 'All'} onPress={() => setCat('All')} />
          {p.categories.map((c) => <Chip key={c} label={tr(c)} on={cat === c} onPress={() => setCat(c)} />)}
        </Row>
      </Group>
      <Txt style={{ color: count === 0 ? colors.warn : colors.sub, fontSize: 13, textAlign: 'center' }}>{count === 0 ? tr('No places match') : count === 1 ? tr('1 place') : tr('{n} places', { n: count })}</Txt>
      <View style={{ flexDirection: 'row' }}><Button label={tr('Apply filters')} onPress={() => p.onApply(x, cat)} /></View>
    </Sheet>
  );
}

type LocProps = { visible: boolean; onClose: () => void; loc: UserLocation | null; state: LocationState; onUseCurrent: () => void; onChooseArea: (label: string) => void };
export function LocationSheet(p: LocProps) {
  return (
    <Sheet visible={p.visible} onClose={p.onClose} label={tr('Choose location')}>
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>{tr('Your location')}</Txt>
        <View style={{ flexDirection: 'row' }}><Button label={tr('Use my current location')} onPress={() => { p.onClose(); p.onUseCurrent(); }} /></View>
        {p.state === 'denied' ? <Txt style={{ color: colors.warn }}>{tr('Location is turned off for this app. You can allow it in your phone settings, or pick an area below.')}</Txt> : null}
      </View>
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>{tr('Or pick an area')}</Txt>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {AREAS.map((a) => <Chip key={a.label} label={tr(a.label)} on={p.loc?.label === a.label} onPress={() => { p.onChooseArea(a.label); p.onClose(); }} />)}
        </View>
      </View>
      <Txt style={{ color: colors.sub, fontSize: 12 }}>{tr('Your location stays on your phone and is only used to sort places. Distances are straight-line, not travel time.')}</Txt>
    </Sheet>
  );
}

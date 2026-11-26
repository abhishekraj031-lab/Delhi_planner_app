import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AREAS } from '../data/areas';
import { colors } from '../theme';
import type { LocationState } from '../hooks/useLocation';
import type { Category, UserLocation } from '../types';
import { Button, Chip, Txt } from './ui';
import { Sheet } from './Sheet';
import { BUDGETS, DAYS_FOR, Extra, HOURS, NO_EXTRA, WHEN_OPTIONS, WHERES } from '../lib/filters';
import { FULL_DAY_NAMES } from '../lib/status';

type FilterProps = {
  visible: boolean; onClose: () => void; extra: Extra; category: Category | 'All'; categories: Category[];
  hasLocation: boolean; onSetLocation: () => void;
  countFor: (x: Extra, c: Category | 'All') => number; onApply: (x: Extra, c: Category | 'All') => void;
};
function Group({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt w="bold" style={{ fontSize: 16 }}>{title}</Txt>
      {children}
      {note ? <Txt style={{ color: colors.sub, fontSize: 12 }}>{note}</Txt> : null}
    </View>
  );
}
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
    <Sheet visible={p.visible} onClose={p.onClose} label="Filters">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt w="bold" style={{ fontSize: 20, flex: 1 }}>Filters</Txt>
        {dirty ? <Pressable onPress={() => setX(NO_EXTRA)} hitSlop={8} accessibilityRole="button"><Txt w="semi" style={{ color: colors.primary }}>Clear all</Txt></Pressable> : null}
      </View>
      <Group title="When are you going?" note="Weekdays is Monday to Friday. Places with unknown opening days are left out of day choices.">
        <Row>{WHEN_OPTIONS.map((o) => <Chip key={o.key} label={o.label} on={x.when === o.key} onPress={() => set({ when: o.key, pick: null, ...(o.key !== 'today' && x.hours === 'now' ? { hours: null } : {}) })} />)}</Row>
        {x.when !== 'today' ? (
          <Row>{DAYS_FOR[x.when].map((d) => <Chip key={d} label={FULL_DAY_NAMES[d].slice(0, 3)} on={x.pick === d} onPress={() => set({ pick: x.pick === d ? null : d })} />)}</Row>
        ) : null}
      </Group>
      <Group title="Budget" note="Entry fee for an Indian adult on the chosen day. Places with no fee on record are left out.">
        <Row>{BUDGETS.map((o) => <Chip key={o.key} label={o.label} on={x.budget === o.key} onPress={() => set({ budget: x.budget === o.key ? null : o.key })} />)}</Row>
      </Group>
      <Group title="Open hours" note="Based on opening hours on record. Open now uses today's day and time.">
        <Row>{HOURS.map((o) => <Chip key={o.key} label={o.label} on={x.hours === o.key} onPress={() => set({ hours: x.hours === o.key ? null : o.key, ...(o.key === 'now' ? { when: 'today', pick: null } : {}) })} />)}</Row>
      </Group>
      <Group title="Where" note="Pick one. Distances are straight-line from your location. Metro uses the stations listed for each place.">
        <Row>{WHERES.map((o) => (
          <Chip key={o.key} label={o.label} on={x.where === o.key}
            onPress={() => (o.needsLocation && !p.hasLocation ? p.onSetLocation() : set({ where: x.where === o.key ? null : o.key }))} />
        ))}</Row>
        {!p.hasLocation ? <Pressable onPress={p.onSetLocation} accessibilityRole="button"><Txt w="semi" style={{ color: colors.primary, fontSize: 13 }}>Set your location to use distance options</Txt></Pressable> : null}
      </Group>
      <Group title="Type" note="All shows every type together, so you can compare places across the city.">
        <Row>
          <Chip label="All" on={cat === 'All'} onPress={() => setCat('All')} />
          {p.categories.map((c) => <Chip key={c} label={c} on={cat === c} onPress={() => setCat(c)} />)}
        </Row>
      </Group>
      <View style={{ flexDirection: 'row' }}><Button label={count === 0 ? 'No places match' : `Show ${count} ${count === 1 ? 'place' : 'places'}`} onPress={() => p.onApply(x, cat)} /></View>
    </Sheet>
  );
}

type LocProps = { visible: boolean; onClose: () => void; loc: UserLocation | null; state: LocationState; onUseCurrent: () => void; onChooseArea: (label: string) => void };
export function LocationSheet(p: LocProps) {
  return (
    <Sheet visible={p.visible} onClose={p.onClose} label="Choose location">
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>Your location</Txt>
        <View style={{ flexDirection: 'row' }}><Button label="Use my current location" onPress={() => { p.onClose(); p.onUseCurrent(); }} /></View>
        {p.state === 'denied' ? <Txt style={{ color: colors.warn }}>Location is turned off for this app. You can allow it in your phone settings, or pick an area below.</Txt> : null}
      </View>
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>Or pick an area</Txt>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {AREAS.map((a) => <Chip key={a.label} label={a.label} on={p.loc?.label === a.label} onPress={() => { p.onChooseArea(a.label); p.onClose(); }} />)}
        </View>
      </View>
      <Txt style={{ color: colors.sub, fontSize: 12 }}>Your location stays on your phone and is only used to sort places. Distances are straight-line, not travel time.</Txt>
    </Sheet>
  );
}

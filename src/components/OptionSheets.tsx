import React from 'react';
import { Pressable, View } from 'react-native';
import { AREAS } from '../data/areas';
import { colors } from '../theme';
import type { LocationState } from '../hooks/useLocation';
import type { Category, UserLocation } from '../types';
import { Button, Chip, Txt } from './ui';
import { Sheet } from './Sheet';
import { BUDGETS, DAY_OPTIONS, Extra, HOURS, WHEN_OPTIONS, WITHIN } from '../lib/filters';

type FilterProps = {
  visible: boolean; onClose: () => void; extra: Extra; setExtra: (f: (x: Extra) => Extra) => void; savedOnly: boolean; setSavedOnly: (v: boolean) => void; savedCount: number;
  hasLocation: boolean; onSetLocation: () => void; count: number; onClear: () => void; activeCount: number;
  categories: Category[]; category: Category | 'All'; setCategory: (c: Category | 'All') => void;
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
  const x = p.extra;
  const set = (patch: Partial<Extra>) => p.setExtra((e) => ({ ...e, ...patch }));
  return (
    <Sheet visible={p.visible} onClose={p.onClose} label="Filters">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Txt w="bold" style={{ fontSize: 20, flex: 1 }}>Filters</Txt>
        {p.activeCount ? <Pressable onPress={p.onClear} hitSlop={8} accessibilityRole="button"><Txt w="semi" style={{ color: colors.primary }}>Clear all</Txt></Pressable> : null}
      </View>
      <Group title="When are you going?" note="Weekdays is Monday to Friday. Places with unknown opening days are left out of day choices.">
        <Row>{WHEN_OPTIONS.map((o) => <Chip key={o.key} label={o.label} on={x.when === o.key} onPress={() => set({ when: x.when === o.key ? 'today' : o.key, ...(o.key !== 'today' && x.hours === 'now' ? { hours: null } : {}) })} />)}</Row>
        <Row>{DAY_OPTIONS.map((o) => <Chip key={o.key} label={o.label} on={x.when === o.key} onPress={() => set({ when: x.when === o.key ? 'today' : o.key, ...(x.hours === 'now' ? { hours: null } : {}) })} />)}</Row>
      </Group>
      <Group title="Budget" note="Entry fee for an Indian adult on the chosen day. Places with no fee on record are left out.">
        <Row>{BUDGETS.map((o) => <Chip key={o.key} label={o.label} on={x.budget === o.key} onPress={() => set({ budget: x.budget === o.key ? null : o.key })} />)}</Row>
      </Group>
      <Group title="Open hours" note="Based on opening hours on record. Open now uses today's day and time.">
        <Row>{HOURS.map((o) => <Chip key={o.key} label={o.label} on={x.hours === o.key} onPress={() => set({ hours: x.hours === o.key ? null : o.key, ...(o.key === 'now' ? { when: 'today' } : {}) })} />)}</Row>
      </Group>
      <Group title="Where" note={p.hasLocation ? 'Straight-line distance from your location. Metro uses the stations listed for each place.' : undefined}>
        {p.hasLocation ? (
          <Row>
            {WITHIN.map((k) => <Chip key={k} label={`Within ${k} km`} on={x.within === k} onPress={() => set({ within: x.within === k ? null : k })} />)}
            <Chip label="Near a metro station" on={x.metro} onPress={() => set({ metro: !x.metro })} />
          </Row>
        ) : (
          <View style={{ gap: 8 }}>
            <Row><Chip label="Near a metro station" on={x.metro} onPress={() => set({ metro: !x.metro })} /></Row>
            <Pressable onPress={p.onSetLocation} accessibilityRole="button"><Txt w="semi" style={{ color: colors.primary, fontSize: 13 }}>Set your location to filter by distance</Txt></Pressable>
          </View>
        )}
      </Group>
      <Group title="Type" note="All shows every type together, so you can compare places across the city.">
        <Row>
          <Chip label="All" on={p.category === 'All'} onPress={() => p.setCategory('All')} />
          {p.categories.map((c) => <Chip key={c} label={c} on={p.category === c} onPress={() => p.setCategory(c)} />)}
        </Row>
      </Group>
      <Group title="Only show">
        <Row><Chip label={`Saved (${p.savedCount})`} on={p.savedOnly} onPress={() => p.setSavedOnly(!p.savedOnly)} /></Row>
      </Group>
      <View style={{ flexDirection: 'row' }}><Button label={p.count === 0 ? 'No places match' : `Show ${p.count} ${p.count === 1 ? 'place' : 'places'}`} onPress={p.onClose} /></View>
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

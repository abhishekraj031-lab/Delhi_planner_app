import React from 'react';
import { View } from 'react-native';
import { AREAS } from '../data/areas';
import { colors } from '../theme';
import type { LocationState } from '../hooks/useLocation';
import type { UserLocation } from '../types';
import { Button, Chip, Txt } from './ui';
import { Sheet } from './Sheet';

export type DayChoice = 'today' | 'sat' | 'mon';
export const DAY_CHOICES: { key: DayChoice; label: string; day: (today: number) => number }[] = [
  { key: 'today', label: 'Today', day: (t) => t },
  { key: 'sat', label: 'Saturday', day: () => 6 },
  { key: 'mon', label: 'Monday', day: () => 1 },
];

type FilterProps = { visible: boolean; onClose: () => void; dayChoice: DayChoice; setDayChoice: (d: DayChoice) => void; freeOnly: boolean; setFreeOnly: (v: boolean) => void; savedOnly: boolean; setSavedOnly: (v: boolean) => void; savedCount: number };
export function FilterSheet(p: FilterProps) {
  return (
    <Sheet visible={p.visible} onClose={p.onClose} label="Filters">
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>Show places for</Txt>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {DAY_CHOICES.map((d) => <Chip key={d.key} label={d.label} on={p.dayChoice === d.key} onPress={() => p.setDayChoice(d.key)} />)}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 16 }}>Only show</Txt>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip label="Free entry" on={p.freeOnly} onPress={() => p.setFreeOnly(!p.freeOnly)} />
          <Chip label={`Saved (${p.savedCount})`} on={p.savedOnly} onPress={() => p.setSavedOnly(!p.savedOnly)} />
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}><Button label="Done" onPress={p.onClose} /></View>
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

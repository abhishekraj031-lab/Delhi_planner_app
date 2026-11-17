import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import type { Coords, Place } from '../types';
import { colors } from '../theme';
import { buildPlan, planMapsUrl } from '../lib/plan';
import { formatFee } from '../lib/pricing';
import { Button, Txt } from './ui';
import { Sheet } from './Sheet';
import { areaLabel, statusText } from './PlaceCard';

type Props = { visible: boolean; onClose: () => void; places: Place[]; day: number; dayLabel: string; today: Date | null; loc: Coords | null; saved: Set<string>; onSaveAll: (ids: string[]) => void; onOpenPlace: (id: string) => void };

/** "Plan my day": a short chain of nearby places that are open on the chosen day. */
export function PlanSheet({ visible, onClose, places, day, dayLabel, today, loc, saved, onSaveAll, onOpenPlace }: Props) {
  const stops = visible ? buildPlan(places, day, loc) : [];
  const allSaved = stops.length > 0 && stops.every((x) => saved.has(x.place.id));
  const url = planMapsUrl(stops);
  const total = stops.reduce((n, s) => n + (s.legKm ?? 0), 0);
  return (
    <Sheet visible={visible} onClose={onClose} label="Plan my day">
      <View style={{ gap: 4 }}>
        <Txt w="bold" style={{ fontSize: 20 }}>Plan my day</Txt>
        <Txt style={{ fontSize: 14, color: colors.sub }}>
          {stops.length ? `${stops.length} places close to each other, open ${dayLabel.toLowerCase()}. About ${total < 1 ? 'under 1' : total.toFixed(1)} km between them.` : 'No places with known opening days yet.'}
        </Txt>
      </View>
      <View style={{ gap: 0 }}>
        {stops.map(({ place, legKm }, i) => {
          const st = statusText(place, day, today);
          const fee = formatFee(place, day);
          return (
            <View key={place.id}>
              {legKm != null ? (
                <View style={s.leg}><View style={s.line} /><Txt style={{ fontSize: 12, color: colors.sub }}>{legKm < 1 ? 'Under 1 km' : `${legKm.toFixed(1)} km`} from the last stop</Txt></View>
              ) : null}
              <Pressable onPress={() => { onClose(); onOpenPlace(place.id); }} accessibilityRole="button" accessibilityLabel={`Stop ${i + 1}: ${place.name}`}
                style={({ pressed }) => [s.stop, { opacity: pressed ? 0.7 : 1 }]}>
                <View style={s.num}><Txt w="bold" style={{ fontSize: 14, color: colors.white }}>{i + 1}</Txt></View>
                <View style={{ flex: 1 }}>
                  <Txt w="semi" style={{ fontSize: 16 }}>{place.name}</Txt>
                  <Txt style={{ fontSize: 13, color: colors.sub }}>{[areaLabel(place), st.text, fee ? `${fee} entry` : null].filter(Boolean).join(' · ')}</Txt>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      {stops.length ? (
        <View style={{ gap: 8 }}>
          {url ? <Button label="Open route in Maps" onPress={() => Linking.openURL(url)} /> : null}
          <Button label={allSaved ? 'Saved to Favourites' : 'Save all to Favourites'} outline onPress={() => { if (!allSaved) onSaveAll(stops.map((x) => x.place.id)); }} />
        </View>
      ) : null}
      {stops.length ? <Txt style={{ fontSize: 12, color: colors.sub }}>Straight-line distances. Check the place page for opening hours before you go.</Txt> : null}
    </Sheet>
  );
}
const s = StyleSheet.create({
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 28 },
  line: { width: 2, height: 24, marginLeft: 13, backgroundColor: colors.line },
});

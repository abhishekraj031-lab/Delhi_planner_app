import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { tr } from '../i18n';
import { Place } from '../types';
import { PlaceCard } from './PlaceCard';
import { Button, Txt } from './ui';

type Row = { place: Place; km: number | null };

/** A page of the places the person has saved, opened from Profile. Back returns to Profile. */
export function SavedPlacesPage({ rows, day, today, nearestFirst, onBack, onOpen, onToggleSave, onExplore }: {
  rows: Row[]; day: number; today: Date | null; nearestFirst: boolean;
  onBack: () => void; onOpen: (id: string) => void; onToggleSave: (id: string) => void; onExplore: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10 }}>
        <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr('Back to profile')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt w="bold" style={{ fontSize: 20 }}>{tr('Saved places')}</Txt>
          <Txt style={{ color: colors.sub, fontSize: 13 }}>{rows.length === 0 ? tr('Nothing saved yet') : `${rows.length === 1 ? tr('1 place') : tr('{n} places', { n: rows.length })}${nearestFirst ? tr(', nearest first') : ''}`}</Txt>
        </View>
      </View>
      {rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingBottom: 80 }}>
          <Heart size={36} color={colors.primary} />
          <Txt w="bold" style={{ fontSize: 18 }}>{tr('Your wishlist is empty')}</Txt>
          <Txt style={{ color: colors.sub, textAlign: 'center' }}>{tr('Tap the heart on a place to save it and find it here.')}</Txt>
          <View style={{ flexDirection: 'row', width: 200 }}><Button label={tr('Explore places')} onPress={onExplore} /></View>
        </View>
      ) : (
        <FlatList data={rows} keyExtractor={(r) => r.place.id} contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <PlaceCard place={item.place} km={item.km} day={day} today={today} saved onOpen={() => onOpen(item.place.id)} onToggleSave={() => onToggleSave(item.place.id)} />
          )} />
      )}
    </View>
  );
}

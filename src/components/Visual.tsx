import React from 'react';
import { Image, View } from 'react-native';
import type { Place } from '../types';
import { photos } from '../data/photos';
import { Txt } from './ui';

/** Photo if we have one, otherwise a coloured placeholder with the place's emoji. */
export function PlaceVisual({ place, height, radius }: { place: Place; height: number; radius: object }) {
  const src = photos[place.id];
  if (src) return <Image source={src} resizeMode="cover" accessibilityLabel={`Photo of ${place.name}`} style={[{ width: '100%', height }, radius]} />;
  return (
    <View style={[{ width: '100%', height, backgroundColor: place.color, alignItems: 'center', justifyContent: 'center' }, radius]}>
      <Txt style={{ fontSize: Math.round(height * 0.4) }}>{place.emoji}</Txt>
    </View>
  );
}

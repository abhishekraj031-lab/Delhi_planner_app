import React, { useState } from 'react';
import { Image, LayoutChangeEvent, View } from 'react-native';
import type { Place } from '../types';
import { photos } from '../data/photos';
import { Txt } from './ui';

/** Share of the cropped-away height removed from the top (0 = keep the very top, 1 = keep the very bottom). */
const FOCUS_FROM_TOP = 0.15;
/** Photos whose subject sits low in the picture (a dome seen against open sky): keep their lower part in view instead. */
const FOCUS_BY_PLACE: Record<string, number> = { 'gurudwara-bangla-sahib': 1, 'national-zoological-park': 0.33 };

/**
 * Photo if we have one, otherwise a coloured placeholder with the place's emoji.
 * Photos fill the frame without stretching and keep the top of the picture (spires, domes) in view.
 */
export function PlaceVisual({ place, height, radius }: { place: Place; height: number; radius: object }) {
  const [w, setW] = useState(0);
  const photo = photos[place.id];
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  if (!photo) {
    return (
      <View style={[{ width: '100%', height, backgroundColor: place.color, alignItems: 'center', justifyContent: 'center' }, radius]}>
        <Txt style={{ fontSize: Math.round(height * 0.4) }}>{place.emoji}</Txt>
      </View>
    );
  }
  const ratio = photo.w / photo.h;
  const frameRatio = w ? w / height : 2;
  // Image taller than the frame: show it at full width, shifted so the top stays visible.
  const tall = ratio < frameRatio;
  const imgH = w ? w / ratio : height;
  const top = tall ? -(imgH - height) * (FOCUS_BY_PLACE[place.id] ?? FOCUS_FROM_TOP) : 0;
  return (
    <View onLayout={onLayout} style={[{ width: '100%', height, overflow: 'hidden', backgroundColor: '#e9e9ef' }, radius]}>
      {w > 0 ? (
        <Image source={photo.src} accessibilityLabel={`Photo of ${place.name}`}
          resizeMode={tall ? 'stretch' : 'cover'}
          style={tall ? { position: 'absolute', left: 0, top, width: w, height: imgH } : { width: '100%', height }} />
      ) : null}
    </View>
  );
}

import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, ImagePlus, Lock, MapPin, X } from 'lucide-react-native';
import { colors, fontFor } from '../theme';
import { tr } from '../i18n';
import { Place } from '../types';
import { shrinkWeb } from '../lib/wall';
import { Button, Txt } from './ui';
import { Sheet } from './Sheet';

/** New post: photo, the place it was taken at, a caption, and who can see it. */
export function NewPostSheet({ visible, onClose, places, onPost }: { visible: boolean; onClose: () => void; places: Place[]; onPost: (a: { photo: string; placeId?: string; caption: string }) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const [caption, setCaption] = useState('');
  const [err, setErr] = useState('');
  const close = () => { setPhoto(null); setPlaceId(undefined); setQ(''); setCaption(''); setErr(''); onClose(); };

  const pick = async (camera: boolean) => {
    setErr('');
    try {
      const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted && Platform.OS !== 'web') { setErr(camera ? tr('Camera is off for this app. Turn it on in your phone settings.') : tr('Photos are off for this app. Turn them on in your phone settings.')); return; }
      const opts = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 0.4, base64: true, allowsEditing: true, aspect: [1, 1] as [number, number] };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      const uri = a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
      setPhoto(Platform.OS === 'web' ? await shrinkWeb(uri) : uri);
    } catch { setErr(tr('Could not open your photos. Please try again.')); }
  };

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? places.filter((p) => p.name.toLowerCase().includes(s)) : places).slice(0, s ? 6 : 5);
  }, [q, places]);
  const chosen = places.find((p) => p.id === placeId);

  return (
    <Sheet visible={visible} onClose={close} label={tr('New post')}>
      <Txt w="bold" style={{ fontSize: 20 }}>{tr('New post')}</Txt>

      {photo ? (
        <View>
          <Image source={{ uri: photo }} accessibilityLabel={tr('Your photo')} style={{ width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: colors.fill }} />
          <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" accessibilityLabel={tr('Remove photo')} style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Pressable onPress={() => pick(false)} accessibilityRole="button" accessibilityLabel={tr('Choose a photo')}
            style={({ pressed }) => ({ height: 180, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}>
            <ImagePlus size={32} color={colors.primary} />
            <Txt w="semi" style={{ color: colors.primaryText, fontSize: 16 }}>{tr('Choose a photo')}</Txt>
            <Txt style={{ color: colors.sub, fontSize: 13 }}>{tr('From the places you visited')}</Txt>
          </Pressable>
          {Platform.OS !== 'web' ? (
            <Pressable onPress={() => pick(true)} accessibilityRole="button" accessibilityLabel={tr('Take a photo')} style={({ pressed }) => ({ flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'center', padding: 8, opacity: pressed ? 0.6 : 1 })}>
              <Camera size={18} color={colors.primary} /><Txt w="semi" style={{ color: colors.primaryText, fontSize: 15 }}>{tr('Take a photo')}</Txt>
            </Pressable>
          ) : null}
        </View>
      )}
      {err ? <Txt style={{ color: colors.warn, fontSize: 13 }}>{err}</Txt> : null}

      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 15 }}>{tr('Where was this?')}</Txt>
        {chosen ? (
          <Pressable onPress={() => setPlaceId(undefined)} accessibilityRole="button" accessibilityLabel={tr('Remove {name}', { name: chosen.name })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}>
            <MapPin size={16} color={colors.white} /><Txt w="semi" style={{ color: colors.white, fontSize: 14 }}>{chosen.name}</Txt><X size={16} color={colors.white} />
          </Pressable>
        ) : (
          <>
            <TextInput value={q} onChangeText={setQ} placeholder={tr('Search a place')} placeholderTextColor="#777" accessibilityLabel={tr('Search a place')}
              style={{ height: 48, borderRadius: 12, backgroundColor: colors.fill, paddingHorizontal: 14, fontSize: 16, color: colors.ink, fontFamily: fontFor('regular') }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {matches.map((p) => (
                <Pressable key={p.id} onPress={() => { setPlaceId(p.id); setQ(''); }} accessibilityRole="button" accessibilityLabel={p.name}
                  style={({ pressed }) => ({ borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}>
                  <Txt style={{ fontSize: 14 }}>{p.name}</Txt>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Txt w="bold" style={{ fontSize: 15 }}>{tr('Caption')}</Txt>
        <TextInput value={caption} onChangeText={setCaption} placeholder={tr('Say something about this place')} placeholderTextColor="#777" multiline maxLength={280} accessibilityLabel={tr('Caption')}
          style={{ minHeight: 84, borderRadius: 12, backgroundColor: colors.fill, padding: 14, fontSize: 16, color: colors.ink, textAlignVertical: 'top', fontFamily: fontFor('regular') }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.fill, borderRadius: 12, padding: 12 }}>
        <Lock size={18} color={colors.ink} />
        <View style={{ flex: 1 }}>
          <Txt w="semi" style={{ fontSize: 15 }}>{tr('Friends and family')}</Txt>
          <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('Only people you invite can see this.')}</Txt>
        </View>
        <Check size={18} color={colors.primary} />
      </View>

      <View style={{ flexDirection: 'row' }}>
        <Button label={tr('Post')} onPress={() => { if (!photo) { setErr(tr('Add a photo to post.')); return; } onPost({ photo, placeId, caption: caption.trim() }); close(); }} />
      </View>
    </Sheet>
  );
}

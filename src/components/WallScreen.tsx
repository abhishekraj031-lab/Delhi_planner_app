import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, TextInput, View } from 'react-native';
import { Heart, Lock, MapPin, MessageCircle, Plus, Send, Share2, Trash2, UserPlus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFor } from '../theme';
import { tr } from '../i18n';
import { Place } from '../types';
import { photos } from '../data/photos';
import { PEOPLE, Post, ago } from '../lib/wall';
import { loadJSON, saveJSON } from '../lib/storage';
import { Txt } from './ui';

const TINTS = ['#2c7aef', '#d9480f', '#2f9e44', '#9c36b5', '#c2255c', '#0b7285'];
const tint = (name: string) => TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export function Avatar({ name, size = 40, photo }: { name: string; size?: number; photo?: string }) {
  if (photo) return <Image source={{ uri: photo }} accessibilityLabel={tr("{name}'s photo", { name })} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint(name), alignItems: 'center', justifyContent: 'center' }}>
      <Txt w="bold" style={{ color: colors.white, fontSize: size * 0.45 }}>{name.trim().charAt(0).toUpperCase() || '?'}</Txt>
    </View>
  );
}

function PostCard({ p, place, me, myPhoto, onLike, onComment, onShare, onDelete, onOpenPlace }: {
  p: Post; place?: Place; me: string | null; myPhoto?: string; onLike: () => void; onComment: (text: string) => void; onShare: () => void; onDelete: () => void; onOpenPlace: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const src = p.photo ? { uri: p.photo } : p.samplePhoto && photos[p.samplePhoto] ? photos[p.samplePhoto].src : undefined;
  const send = () => { const t = text.trim(); if (!t) return; onComment(t); setText(''); setOpen(true); };
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 }}>
        <Avatar name={p.author} photo={p.mine ? myPhoto : undefined} />
        <View style={{ flex: 1 }}>
          <Txt w="bold" style={{ fontSize: 15 }} numberOfLines={1}>{p.mine ? tr('{name} (you)', { name: p.author }) : p.author}</Txt>
          <Txt style={{ fontSize: 12, color: colors.sub }} numberOfLines={1}>{[p.sample ? tr('Sample post') : p.relation ? tr(p.relation) : '', ago(p.t)].filter(Boolean).join(' · ')}</Txt>
        </View>
        {p.mine ? (
          <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr('Delete post')} style={{ padding: 6 }}><Trash2 size={18} color={colors.sub} /></Pressable>
        ) : null}
      </View>

      <View>
        {src ? <Image source={src} accessibilityLabel={place ? tr('Photo by {name} at {place}', { name: p.author, place: place.name }) : tr('Photo by {name}', { name: p.author })} style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.fill }} resizeMode="cover" /> : <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.fill }} />}
        {place ? (
          <Pressable onPress={onOpenPlace} accessibilityRole="button" accessibilityLabel={tr('Open {name}', { name: place.name })}
            style={{ position: 'absolute', left: 12, bottom: 12, maxWidth: '80%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 }}>
            <MapPin size={14} color={colors.ink} /><Txt w="semi" style={{ fontSize: 13 }} numberOfLines={1}>{place.name}</Txt>
          </Pressable>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Pressable onPress={onLike} hitSlop={8} accessibilityRole="button" accessibilityLabel={p.liked ? tr('Unlike') : tr('Like')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Heart size={24} color={p.liked ? '#e03150' : colors.ink} fill={p.liked ? '#e03150' : 'none'} />
            <Txt w="semi" style={{ fontSize: 14 }}>{p.likes}</Txt>
          </Pressable>
          <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr('Comments')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MessageCircle size={24} color={colors.ink} /><Txt w="semi" style={{ fontSize: 14 }}>{p.comments.length}</Txt>
          </Pressable>
          <Pressable onPress={onShare} hitSlop={8} accessibilityRole="button" accessibilityLabel={tr('Share')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Share2 size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Lock size={12} color={colors.sub} /><Txt style={{ fontSize: 12, color: colors.sub }}>{tr('Friends and family')}</Txt></View>
        </View>

        {p.caption ? <Txt style={{ fontSize: 15, color: colors.text }}><Txt w="bold" style={{ fontSize: 15 }}>{p.author} </Txt>{p.sample ? tr(p.caption) : p.caption}</Txt> : null}

        {!open && p.comments.length > 0 ? (
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button"><Txt style={{ fontSize: 14, color: colors.sub }}>{p.comments.length === 1 ? tr('View 1 comment') : tr('View all {n} comments', { n: p.comments.length })}</Txt></Pressable>
        ) : null}
        {open ? (
          <View style={{ gap: 8 }}>
            {p.comments.map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', gap: 8 }}>
                <Avatar name={c.who} size={26} photo={me && c.who === me ? myPhoto : undefined} />
                <Txt style={{ flex: 1, fontSize: 14, color: colors.text }}><Txt w="bold" style={{ fontSize: 14 }}>{c.who} </Txt>{p.sample ? tr(c.text) : c.text}  <Txt style={{ fontSize: 12, color: colors.sub }}>{ago(c.t)}</Txt></Txt>
              </View>
            ))}
            {p.comments.length === 0 ? <Txt style={{ fontSize: 14, color: colors.sub }}>{tr('No comments yet. Be the first.')}</Txt> : null}
          </View>
        ) : null}
        {open ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.fill, borderRadius: 22, paddingLeft: 14, paddingRight: 4, height: 44 }}>
            <TextInput value={text} onChangeText={setText} placeholder={me ? tr('Add a comment') : tr('Log in to comment')} placeholderTextColor="#777" onSubmitEditing={send} returnKeyType="send" maxLength={200} accessibilityLabel={tr('Add a comment')}
              style={{ flex: 1, fontSize: 15, color: colors.ink, fontFamily: fontFor('regular') }} />
            <Pressable onPress={send} accessibilityRole="button" accessibilityLabel={tr('Send comment')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: text.trim() ? colors.primary : colors.line, alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color={colors.white} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

type Props = {
  posts: Post[]; places: Place[]; me: string | null; myPhoto?: string;
  onNew: () => void; onInvite: () => void; onLike: (id: string) => void; onComment: (id: string, text: string) => void;
  onShare: (p: Post) => void; onDelete: (id: string) => void; onOpenPlace: (id: string) => void;
};

/** "My wall": photos of visited places, shared with friends and family, with likes and comments. */
export function WallScreen(p: Props) {
  const insets = useSafeAreaInsets();
  const byId = (id?: string) => p.places.find((x) => x.id === id);
  const [hideInvite, setHideInvite] = useState(true);
  useEffect(() => { loadJSON<boolean>('wall-invite-dismissed-v1', false).then((d) => setHideInvite(d)); }, []);
  const dismissInvite = () => { setHideInvite(true); saveJSON('wall-invite-dismissed-v1', true); };
  const header = (
    <View style={{ gap: 14, paddingBottom: 16 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Txt w="bold" style={{ fontSize: 20 }}>{tr('My wall')}</Txt>
        <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('Your visits, shared with friends and family')}</Txt>
      </View>
      {!hideInvite ? (
        <View style={{ marginHorizontal: 16, padding: 14, borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryLine, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {PEOPLE.map((x, i) => (<View key={x.name} style={{ marginLeft: i ? -10 : 0, borderWidth: 2, borderColor: colors.primarySoft, borderRadius: 22 }}><Avatar name={x.name} size={36} /></View>))}
            </View>
            <View style={{ flex: 1 }}>
              <Txt w="bold" style={{ fontSize: 16 }}>{tr('Invite friends and family')}</Txt>
              <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('Only people you invite can see your wall. Riya, Papa and Aman are samples.')}</Txt>
            </View>
            <Pressable onPress={dismissInvite} hitSlop={10} accessibilityRole="button" accessibilityLabel={tr('Close invite')} style={{ alignSelf: 'flex-start', padding: 2 }}><X size={20} color={colors.sub} /></Pressable>
          </View>
          <Pressable onPress={p.onInvite} accessibilityRole="button" accessibilityLabel={tr('Invite friends and family')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 22, height: 44, opacity: pressed ? 0.7 : 1 })}>
            <UserPlus size={18} color={colors.white} /><Txt w="bold" style={{ color: colors.white, fontSize: 15 }}>{tr('Invite')}</Txt>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12 }}>
      <FlatList data={p.posts} keyExtractor={(x) => x.id} ListHeaderComponent={header} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <PostCard p={item} place={byId(item.placeId)} me={p.me} myPhoto={p.myPhoto} onLike={() => p.onLike(item.id)} onComment={(t) => p.onComment(item.id, t)}
            onShare={() => p.onShare(item)} onDelete={() => p.onDelete(item.id)} onOpenPlace={() => item.placeId && p.onOpenPlace(item.placeId)} />
        )} />
      <Pressable onPress={p.onNew} accessibilityRole="button" accessibilityLabel={tr('Add a post')}
        style={({ pressed }) => ({ position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 28, paddingHorizontal: 20, height: 56, opacity: pressed ? 0.8 : 1, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 })}>
        <Plus size={22} color={colors.white} /><Txt w="bold" style={{ color: colors.white, fontSize: 16 }}>{tr('Post')}</Txt>
      </Pressable>
    </View>
  );
}

import React, { useState } from 'react';
import { FlatList, Image, Pressable, TextInput, View } from 'react-native';
import { Heart, Lock, MapPin, MessageCircle, Plus, Send, Share2, Trash2, UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { Place } from '../types';
import { photos } from '../data/photos';
import { PEOPLE, Post, ago } from '../lib/wall';
import { Txt } from './ui';

const TINTS = ['#2c7aef', '#d9480f', '#2f9e44', '#9c36b5', '#c2255c', '#0b7285'];
const tint = (name: string) => TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export function Avatar({ name, size = 40, photo }: { name: string; size?: number; photo?: string }) {
  if (photo) return <Image source={{ uri: photo }} accessibilityLabel={`${name}'s photo`} style={{ width: size, height: size, borderRadius: size / 2 }} />;
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
          <Txt w="bold" style={{ fontSize: 15 }} numberOfLines={1}>{p.mine ? `${p.author} (you)` : p.author}</Txt>
          <Txt style={{ fontSize: 12, color: colors.sub }} numberOfLines={1}>{[p.sample ? 'Sample post' : p.relation, ago(p.t)].filter(Boolean).join(' · ')}</Txt>
        </View>
        {p.mine ? (
          <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete post" style={{ padding: 6 }}><Trash2 size={18} color={colors.sub} /></Pressable>
        ) : null}
      </View>

      <View>
        {src ? <Image source={src} accessibilityLabel={`Photo by ${p.author}${place ? ` at ${place.name}` : ''}`} style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.fill }} resizeMode="cover" /> : <View style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.fill }} />}
        {place ? (
          <Pressable onPress={onOpenPlace} accessibilityRole="button" accessibilityLabel={`Open ${place.name}`}
            style={{ position: 'absolute', left: 12, bottom: 12, maxWidth: '80%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 }}>
            <MapPin size={14} color={colors.ink} /><Txt w="semi" style={{ fontSize: 13 }} numberOfLines={1}>{place.name}</Txt>
          </Pressable>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Pressable onPress={onLike} hitSlop={8} accessibilityRole="button" accessibilityLabel={p.liked ? 'Unlike' : 'Like'} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Heart size={24} color={p.liked ? '#e03150' : colors.ink} fill={p.liked ? '#e03150' : 'none'} />
            <Txt w="semi" style={{ fontSize: 14 }}>{p.likes}</Txt>
          </Pressable>
          <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Comments" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MessageCircle size={24} color={colors.ink} /><Txt w="semi" style={{ fontSize: 14 }}>{p.comments.length}</Txt>
          </Pressable>
          <Pressable onPress={onShare} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Share2 size={22} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Lock size={12} color={colors.sub} /><Txt style={{ fontSize: 12, color: colors.sub }}>Friends and family</Txt></View>
        </View>

        {p.caption ? <Txt style={{ fontSize: 15, color: colors.text }}><Txt w="bold" style={{ fontSize: 15 }}>{p.author} </Txt>{p.caption}</Txt> : null}

        {!open && p.comments.length > 0 ? (
          <Pressable onPress={() => setOpen(true)} accessibilityRole="button"><Txt style={{ fontSize: 14, color: colors.sub }}>{p.comments.length === 1 ? 'View 1 comment' : `View all ${p.comments.length} comments`}</Txt></Pressable>
        ) : null}
        {open ? (
          <View style={{ gap: 8 }}>
            {p.comments.map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', gap: 8 }}>
                <Avatar name={c.who} size={26} photo={me && c.who === me ? myPhoto : undefined} />
                <Txt style={{ flex: 1, fontSize: 14, color: colors.text }}><Txt w="bold" style={{ fontSize: 14 }}>{c.who} </Txt>{c.text}  <Txt style={{ fontSize: 12, color: colors.sub }}>{ago(c.t)}</Txt></Txt>
              </View>
            ))}
            {p.comments.length === 0 ? <Txt style={{ fontSize: 14, color: colors.sub }}>No comments yet. Be the first.</Txt> : null}
          </View>
        ) : null}
        {open ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.fill, borderRadius: 22, paddingLeft: 14, paddingRight: 4, height: 44 }}>
            <TextInput value={text} onChangeText={setText} placeholder={me ? 'Add a comment' : 'Log in to comment'} placeholderTextColor="#777" onSubmitEditing={send} returnKeyType="send" maxLength={200} accessibilityLabel="Add a comment"
              style={{ flex: 1, fontSize: 15, color: colors.ink }} />
            <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send comment" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: text.trim() ? colors.primary : colors.line, alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color={colors.white} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

type Props = {
  posts: Post[]; places: Place[]; me: string | null; myPhoto?: string; notice: string | null;
  onNew: () => void; onInvite: () => void; onLike: (id: string) => void; onComment: (id: string, text: string) => void;
  onShare: (p: Post) => void; onDelete: (id: string) => void; onOpenPlace: (id: string) => void;
};

/** "My wall": photos of visited places, shared with friends and family, with likes and comments. */
export function WallScreen(p: Props) {
  const insets = useSafeAreaInsets();
  const byId = (id?: string) => p.places.find((x) => x.id === id);
  const header = (
    <View style={{ gap: 14, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
        <View style={{ flex: 1 }}>
          <Txt w="bold" style={{ fontSize: 20 }}>My wall</Txt>
          <Txt style={{ fontSize: 13, color: colors.sub }}>Your visits, shared with friends and family</Txt>
        </View>
        <Pressable onPress={p.onNew} accessibilityRole="button" accessibilityLabel="Add a post" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 22, paddingHorizontal: 16, height: 44, opacity: pressed ? 0.7 : 1 })}>
          <Plus size={18} color={colors.white} /><Txt w="bold" style={{ color: colors.white, fontSize: 15 }}>Post</Txt>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row' }}>
          {PEOPLE.map((x, i) => (<View key={x.name} style={{ marginLeft: i ? -10 : 0, borderWidth: 2, borderColor: colors.white, borderRadius: 22 }}><Avatar name={x.name} size={40} /></View>))}
        </View>
        <Txt style={{ flex: 1, fontSize: 13, color: colors.sub }} numberOfLines={2}>{PEOPLE.map((x) => x.name).join(', ')} are on your wall (samples)</Txt>
        <Pressable onPress={p.onInvite} accessibilityRole="button" accessibilityLabel="Invite friends and family" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 12, height: 38, opacity: pressed ? 0.6 : 1 })}>
          <UserPlus size={16} color={colors.primary} /><Txt w="semi" style={{ color: colors.primary, fontSize: 14 }}>Invite</Txt>
        </Pressable>
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top + 12 }}>
      <FlatList data={p.posts} keyExtractor={(x) => x.id} ListHeaderComponent={header} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <PostCard p={item} place={byId(item.placeId)} me={p.me} myPhoto={p.myPhoto} onLike={() => p.onLike(item.id)} onComment={(t) => p.onComment(item.id, t)}
            onShare={() => p.onShare(item)} onDelete={() => p.onDelete(item.id)} onOpenPlace={() => item.placeId && p.onOpenPlace(item.placeId)} />
        )} />
      {p.notice ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: colors.dark, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
          <Txt w="semi" style={{ color: colors.white, fontSize: 14, textAlign: 'center' }}>{p.notice}</Txt>
        </View>
      ) : null}
    </View>
  );
}

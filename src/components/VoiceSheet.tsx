import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ArrowUp, Mic, Square, Volume2, VolumeX, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Coords, Place } from '../types';
import { colors, font } from '../theme';
import { formatAway, distanceKm } from '../lib/distance';
import { formatFee } from '../lib/pricing';
import { answerQuery, SUGGESTIONS, VoiceAnswer } from '../lib/voiceSearch';
import { autoListen, startListening, speak, stopSpeaking } from '../lib/speech';
import { statusText } from './PlaceCard';
import { Txt } from './ui';

type Msg = { id: number; from: 'me' | 'bot'; text: string; places?: Place[] };
const GREETING = 'Hi! Ask me about places to visit in Delhi. Tap the mic and speak, or type.';

type Props = { visible: boolean; onClose: () => void; places: Place[]; loc: Coords | null; day: number; today: Date | null; onOpenPlace: (id: string) => void };

/** Voice assistant for finding places. It answers from the app's own place data, so it never makes up details. */
export function VoiceSheet({ visible, onClose, places, loc, day, today, onOpenPlace }: Props) {
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'bot', text: GREETING }]);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const stopRef = useRef<null | (() => void)>(null);
  const idRef = useRef(1);
  const scroller = useRef<{ scrollToEnd: (o?: { animated?: boolean }) => void } | null>(null);
  const mutedRef = useRef(muted); mutedRef.current = muted;

  const ask = useCallback((q: string, spoken: boolean) => {
    const clean = q.trim();
    if (!clean) return;
    const a: VoiceAnswer = answerQuery(clean, places, { loc, now: today ?? new Date() });
    setMsgs((m) => [...m, { id: idRef.current++, from: 'me', text: clean }, { id: idRef.current++, from: 'bot', text: a.reply, places: a.places.slice(0, 5) }]);
    setText('');
    if (spoken && !mutedRef.current) speak(a.reply);
  }, [places, loc, today]);

  const stopListen = useCallback(() => { stopRef.current?.(); stopRef.current = null; setListening(false); }, []);
  const listen = useCallback(async () => {
    stopSpeaking(); setText(''); setListening(true);
    let last = '';
    stopRef.current = await startListening({
      onText: (t, final) => { last = t; setText(t); if (final) { stopListen(); ask(t, true); } },
      onEnd: () => { setListening(false); stopRef.current = null; },
      onError: (message) => setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text: message }]),
    });
    void last;
  }, [ask, stopListen]);

  useEffect(() => {
    if (visible && autoListen()) listen();
    if (!visible) { stopListen(); stopSpeaking(); }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60); }, [msgs.length]);

  const close = () => { stopListen(); stopSpeaking(); onClose(); };
  const open = (id: string) => { close(); setTimeout(() => onOpenPlace(id), 150); };
  const ready = text.trim().length > 0 && !listening;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={s.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" accessibilityRole="button" />
        <Pressable onPress={close} accessibilityLabel="Close" accessibilityRole="button" hitSlop={8} style={({ pressed }) => [s.fab, { opacity: pressed ? 0.7 : 1 }]}>
          <X size={22} color={colors.white} />
        </Pressable>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheet} accessibilityViewIsModal accessibilityLabel="Voice search">
          <View style={s.head}>
            <Txt w="bold" style={{ fontSize: 18 }}>Ask about places</Txt>
            <Pressable onPress={() => { setMuted((v) => !v); stopSpeaking(); }} accessibilityRole="button" accessibilityLabel={muted ? 'Turn on spoken answers' : 'Turn off spoken answers'} hitSlop={8} style={s.iconBtn}>
              {muted ? <VolumeX size={22} color={colors.sub} /> : <Volume2 size={22} color={colors.ink} />}
            </Pressable>
          </View>
          <ScrollView ref={scroller as never} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {msgs.map((m) => (
              <View key={m.id} style={{ alignItems: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 8 }}>
                <View style={[s.bubble, m.from === 'me' ? s.me : s.bot]}>
                  <Txt style={{ fontSize: 15, lineHeight: 21, color: m.from === 'me' ? colors.white : colors.ink }}>{m.text}</Txt>
                </View>
                {m.places?.map((p) => {
                  const st = statusText(p, day, today);
                  const fee = formatFee(p, day);
                  return (
                    <Pressable key={p.id} onPress={() => open(p.id)} accessibilityRole="button" accessibilityLabel={`${p.name}. Open details`} style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
                      <View style={[s.dot, { backgroundColor: p.color }]}><Txt style={{ fontSize: 20 }}>{p.emoji}</Txt></View>
                      <View style={{ flex: 1 }}>
                        <Txt w="semi" style={{ fontSize: 15 }} numberOfLines={1}>{p.name}</Txt>
                        <Txt style={{ fontSize: 13, color: colors.sub }} numberOfLines={1}>
                          {[p.area, fee ?? 'Price not available', st.text, loc ? formatAway(distanceKm(loc, p)) : null].filter(Boolean).join(' · ')}
                        </Txt>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
            {msgs.length === 1 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map((q) => (
                  <Pressable key={q} onPress={() => ask(q, false)} accessibilityRole="button" style={s.chip}><Txt style={{ fontSize: 14, color: colors.primary }}>{q}</Txt></Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
          <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
            <TextInput value={text} onChangeText={setText} editable={!listening} placeholder={listening ? 'Listening…' : 'Type your question'} placeholderTextColor="#333232"
              returnKeyType="send" onSubmitEditing={() => ready && ask(text, false)} accessibilityLabel="Type your question" style={s.input} />
            {ready ? (
              <Pressable onPress={() => ask(text, false)} accessibilityRole="button" accessibilityLabel="Send" style={[s.round, { backgroundColor: colors.primary }]}><ArrowUp size={24} color={colors.white} /></Pressable>
            ) : (
              <Pressable onPress={listening ? stopListen : listen} accessibilityRole="button" accessibilityLabel={listening ? 'Stop listening' : 'Speak'} style={[s.round, { backgroundColor: listening ? colors.warn : colors.dark }]}>
                {listening ? <Square size={20} color={colors.white} fill={colors.white} /> : <Mic size={24} color={colors.white} />}
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  fab: { alignSelf: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sheet: { height: '78%', backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '86%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  me: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bot: { backgroundColor: colors.fill, borderBottomLeftRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', minHeight: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 8, backgroundColor: colors.white },
  dot: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.primary },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  input: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: colors.fill, paddingHorizontal: 16, fontFamily: font.regular, fontSize: 16, color: '#333232' },
  round: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ArrowUp, Mic, Square, Volume2, VolumeX, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Coords, Place } from '../types';
import { colors, fontFor } from '../theme';
import { tr } from '../i18n';
import { formatAway, distanceKm } from '../lib/distance';
import { formatFee } from '../lib/pricing';
import { answerQuery, SUGGESTIONS, VoiceAnswer } from '../lib/voiceSearch';
import { autoListen, micPermission, requestMic, startListening, speak, stopSpeaking, MicState } from '../lib/speech';
import { onBridge, post, useBridgeCaps } from '../lib/bridge';
import { statusText } from './PlaceCard';
import { Button, Txt } from './ui';
import { FadeSlide } from './motion';
import { Orb, OrbMode, Rings, StreamText, TypingDots } from './AssistantOrb';

type Msg = { id: number; from: 'me' | 'bot'; text: string; places?: Place[]; stream?: boolean };
const STATUS: Record<OrbMode, string> = { idle: 'Ready to help', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Answering…' }; // shown through tr()
const GREETING = 'Hi! Ask me about places to visit in Delhi. Tap the mic and speak, or type.';

type Props = { visible: boolean; onClose: () => void; places: Place[]; loc: Coords | null; day: number; today: Date | null; onOpenPlace: (id: string) => void };

/** Voice assistant for finding places. It answers from the app's own place data, so it never makes up details. */
export function VoiceSheet({ visible, onClose, places, loc, day, today, onOpenPlace }: Props) {
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'bot', text: GREETING }]);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lastQ, setLastQ] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stopRef = useRef<null | (() => void)>(null);
  const idRef = useRef(1);
  const scroller = useRef<{ scrollToEnd: (o?: { animated?: boolean }) => void } | null>(null);
  const mutedRef = useRef(muted); mutedRef.current = muted;
  const micRef = useRef<unknown>(null);
  const bridged = useBridgeCaps().dictation;
  const [perm, setPerm] = useState<MicState | 'unknown'>('unknown');
  const allowRef = useRef<unknown>(null);
  const showAllow = (perm === 'prompt' || perm === 'denied');

  const ask = useCallback((q: string, spoken: boolean) => {
    const clean = q.trim();
    if (!clean) return;
    setMsgs((m) => [...m, { id: idRef.current++, from: 'me', text: clean }]);
    setText(''); setThinking(true); setLastQ(clean);
    // A short pause so the assistant visibly "thinks" before it answers.
    timers.current.push(setTimeout(() => {
      const a: VoiceAnswer = answerQuery(clean, places, { loc, now: today ?? new Date() });
      setThinking(false);
      setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text: a.reply, places: a.places.slice(0, 5), stream: true }]);
      if (spoken && !mutedRef.current) {
        speak(a.reply); setSpeaking(true);
        timers.current.push(setTimeout(() => setSpeaking(false), Math.min(14000, 700 + a.reply.length * 60)));
      }
    }, 750));
  }, [places, loc, today]);
  const endStream = useCallback((id: number) => setMsgs((m) => m.map((x) => (x.id === id ? { ...x, stream: false } : x))), []);

  /** Every visit starts a fresh conversation. */
  const reset = useCallback(() => {
    setMsgs([{ id: 0, from: 'bot', text: GREETING }]); idRef.current = 1;
    setText(''); setThinking(false); setSpeaking(false); setLastQ('');
  }, []);
  const stopListen = useCallback(() => { stopRef.current?.(); stopRef.current = null; setListening(false); }, []);
  const listen = useCallback(async () => {
    if (bridged) return;
    stopSpeaking(); setText(''); setListening(true);
    let last = '';
    stopRef.current = await startListening({
      onText: (t, final) => { last = t; setText(t); if (final) { stopListen(); ask(t, true); } },
      onEnd: () => { setListening(false); stopRef.current = null; },
      onError: (message) => setMsgs((m) => [...m, { id: idRef.current++, from: 'bot', text: message }]),
    });
    void last;
  }, [ask, stopListen, bridged]);

  useEffect(() => { if (visible && !bridged) micPermission().then(setPerm); }, [visible, bridged]);
  const allowMic = useCallback(async () => {
    const st = await requestMic(); setPerm(st);
    if (st === 'granted') listen();
  }, [listen]);

  const readyNow = text.trim().length > 0 && !listening;
  // Preview only: the page that hosts the preview owns the microphone, so tell it where our mic button is.
  useEffect(() => {
    if (!visible || !bridged) return;
    const off = onBridge((m) => {
      if (m.dx === 'partial') { setListening(true); setText(m.text); }
      else if (m.dx === 'perm') setPerm(m.state);
      else if (m.dx === 'state') setListening(m.state !== 'idle');
      else if (m.dx === 'result') { setListening(false); ask(m.text, true); }
      else if (m.dx === 'error' && m.code !== 'stopped' && m.code !== 'dismissed') {
        const msg = m.code === 'not_granted' ? "Microphone access is off for this preview. Turn it on in the page's Permissions menu, or type your question." : 'Voice input is not available right now. You can type your question instead.'; // translated when shown
        setMsgs((x) => [...x, { id: idRef.current++, from: 'bot', text: msg }]);
      }
    });
    const send = () => {
      const el: any = showAllow ? allowRef.current : micRef.current;
      const r = (readyNow && !showAllow) || !el?.getBoundingClientRect ? null : el.getBoundingClientRect();
      post({ dx: 'mic', rect: r && r.width ? { x: r.left, y: r.top, w: r.width, h: r.height } : null });
    };
    post({ dx: 'hello' }); // asks the preview page for the current microphone permission
    send(); const iv = setInterval(send, 250);
    return () => { off(); clearInterval(iv); post({ dx: 'mic', rect: null }); };
  }, [visible, bridged, readyNow, ask, showAllow]);

  useEffect(() => {
    if (visible) { timers.current.forEach(clearTimeout); timers.current = []; reset(); }
    if (visible && autoListen()) listen();
    if (!visible) { stopListen(); stopSpeaking(); }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60); }, [msgs.length, thinking]);

  const close = () => { stopListen(); stopSpeaking(); timers.current.forEach(clearTimeout); timers.current = []; setThinking(false); setSpeaking(false); onClose(); timers.current.push(setTimeout(reset, 350)); };
  const open = (id: string) => { close(); setTimeout(() => onOpenPlace(id), 150); };
  const ready = text.trim().length > 0 && !listening;
  const streaming = msgs.some((m) => m.stream);
  const mode: OrbMode = listening ? 'listening' : thinking ? 'thinking' : speaking || streaming ? 'speaking' : 'idle';
  const hero = msgs.length === 1 && !thinking;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View style={s.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={tr('Dismiss')} accessibilityRole="button" />
        <Pressable onPress={close} accessibilityLabel={tr('Close')} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [s.fab, { opacity: pressed ? 0.7 : 1 }]}>
          <X size={22} color={colors.white} />
        </Pressable>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheet} accessibilityViewIsModal accessibilityLabel={tr('Voice search')}>
          <View style={s.head}>
            {hero ? null : <Orb mode={mode} size={40} />}
            <View style={{ flex: 1 }}>
              <Txt w="bold" style={{ fontSize: 18 }}>{tr('Delhi assistant')}</Txt>
              <Txt style={{ fontSize: 13, color: mode === 'idle' ? colors.sub : colors.primary }}>{tr(STATUS[mode])}</Txt>
            </View>
            <Pressable onPress={() => { setMuted((v) => !v); stopSpeaking(); setSpeaking(false); }} accessibilityRole="button" accessibilityLabel={muted ? tr('Turn on spoken answers') : tr('Turn off spoken answers')} hitSlop={8} style={s.iconBtn}>
              {muted ? <VolumeX size={22} color={colors.sub} /> : <Volume2 size={22} color={colors.ink} />}
            </Pressable>
          </View>
          <ScrollView ref={scroller as never} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}>
            {hero ? (
              <FadeSlide k="hero" style={{ alignItems: 'center', gap: 6, paddingTop: 24, paddingBottom: 8 }} dy={14} ms={400}>
                <Orb mode={mode} size={120} />
                <Txt w="bold" style={{ fontSize: 22, marginTop: 14 }}>{tr('How can I help?')}</Txt>
                <Txt style={{ fontSize: 15, color: colors.text, textAlign: 'center' }}>{tr('Ask about free places, ticket prices, timings or the nearest metro. Tap the mic and speak, or type.')}</Txt>
                <Txt style={{ fontSize: 12, color: colors.sub, textAlign: 'center' }}>{tr("Answers come from the app's own place data.")}</Txt>
              </FadeSlide>
            ) : msgs.map((m) => (
              <FadeSlide key={m.id} k={String(m.id)} dy={12} ms={260} style={{ alignItems: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 8 }}>
                <View style={[s.bubble, m.from === 'me' ? s.me : s.bot]}>
                  {m.stream
                    ? <StreamText text={m.from === 'bot' ? tr(m.text) : m.text} onDone={() => endStream(m.id)} style={{ fontSize: 15, lineHeight: 21, color: colors.ink }} />
                    : <Txt style={{ fontSize: 15, lineHeight: 21, color: m.from === 'me' ? colors.white : colors.ink }}>{m.from === 'bot' ? tr(m.text) : m.text}</Txt>}
                </View>
                {!m.stream ? m.places?.map((p) => {
                  const st = statusText(p, day, today);
                  const fee = formatFee(p, day);
                  return (
                    <FadeSlide key={p.id} k={p.id} dy={8} ms={260} style={{ alignSelf: 'stretch' }}>
                      <Pressable onPress={() => open(p.id)} accessibilityRole="button" accessibilityLabel={tr('{name}. Open details', { name: tr(p.name) })} style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
                        <View style={[s.dot, { backgroundColor: p.color }]}><Txt style={{ fontSize: 20 }}>{p.emoji}</Txt></View>
                        <View style={{ flex: 1 }}>
                          <Txt w="semi" style={{ fontSize: 15 }} numberOfLines={1}>{tr(p.name)}</Txt>
                          <Txt style={{ fontSize: 13, color: colors.sub }} numberOfLines={1}>
                            {[tr(p.area), fee ?? tr('Price not available'), st.text, loc ? formatAway(distanceKm(loc, p)) : null].filter(Boolean).join(' · ')}
                          </Txt>
                        </View>
                      </Pressable>
                    </FadeSlide>
                  );
                }) : null}
              </FadeSlide>
            ))}
            {thinking ? (
              <FadeSlide k="typing" dy={8} ms={200} style={{ alignItems: 'flex-start' }}>
                <View style={[s.bubble, s.bot]}><TypingDots /></View>
              </FadeSlide>
            ) : null}
            {hero ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map((q) => (
                  <Pressable key={q} onPress={() => ask(q, false)} accessibilityRole="button" style={s.chip}><Txt style={{ fontSize: 14, color: colors.primary }}>{tr(q)}</Txt></Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
          {!hero ? (
            <View style={{ flexGrow: 0 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
                {SUGGESTIONS.map((q) => {
                  const on = q === lastQ;
                  return (
                    <Pressable key={q} onPress={() => ask(q, false)} accessibilityRole="button" accessibilityLabel={tr(q)} accessibilityState={{ selected: on }}
                      style={[s.chip, on && { backgroundColor: colors.primary }]}>
                      <Txt style={{ fontSize: 14, color: on ? colors.white : colors.primary }}>{tr(q)}</Txt>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
          {showAllow ? (
            <View style={s.allow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.allowIcon}><Mic size={22} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Txt w="bold" style={{ fontSize: 16 }}>{tr('Allow microphone')}</Txt>
                  <Txt style={{ fontSize: 13, color: colors.sub }}>{tr('Search for places by speaking. Your voice is turned into text on your phone.')}</Txt>
                </View>
              </View>
              {perm === 'denied' ? <Txt style={{ fontSize: 13, color: colors.warn }}>{tr('Microphone is turned off for this app, so your phone may not ask again. Allow it in your phone settings, or type your question.')}</Txt> : null}
              <View ref={allowRef as never} style={{ flexDirection: 'row' }}>
                <Button label={tr('Allow microphone')} onPress={allowMic} />
              </View>
              {perm === 'denied' && Platform.OS !== 'web' ? (
                <Pressable onPress={() => { Linking.openSettings().catch(() => {}); }} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Txt w="semi" style={{ fontSize: 15, color: colors.primary }}>{tr('Open phone settings')}</Txt>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
            <TextInput value={text} onChangeText={setText} editable={!listening} placeholder={listening ? tr('Listening…') : tr('Type your question')} placeholderTextColor="#333232"
              returnKeyType="send" onSubmitEditing={() => ready && ask(text, false)} accessibilityLabel={tr('Type your question')} style={[s.input, { fontFamily: fontFor('regular') }]} />
            {ready ? (
              <Pressable onPress={() => ask(text, false)} accessibilityRole="button" accessibilityLabel={tr('Send')} style={[s.round, { backgroundColor: colors.primary }]}><ArrowUp size={24} color={colors.white} /></Pressable>
            ) : (
              <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <Rings active={listening} size={48} color={colors.warn} />
                <Pressable ref={micRef as never} onPress={listening ? stopListen : listen} accessibilityRole="button" accessibilityLabel={listening ? tr('Stop listening') : tr('Speak')} style={[s.round, { backgroundColor: listening ? colors.warn : colors.dark }]}>
                  {listening ? <Square size={20} color={colors.white} fill={colors.white} /> : <Mic size={24} color={colors.white} />}
                </Pressable>
              </View>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '86%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  me: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bot: { backgroundColor: colors.fill, borderBottomLeftRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', minHeight: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 8, backgroundColor: colors.white },
  dot: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.primary },
  allow: { marginHorizontal: 16, marginBottom: 8, padding: 14, gap: 10, borderRadius: 14, backgroundColor: colors.fill },
  allowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  input: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: colors.fill, paddingHorizontal: 16, fontSize: 16, color: '#333232' },
  round: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});

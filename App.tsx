import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_500Medium } from '@expo-google-fonts/noto-sans-devanagari/500Medium';
import { NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari/600SemiBold';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';
import { LangProvider, LANGUAGES, useLang } from './src/i18n';
import { localizePlace } from './src/i18n/places';
import { Splash } from './src/components/Splash';
import { FadeSlide } from './src/components/motion';
import { AuthPrompt } from './src/components/AuthPrompt';
import { VoiceSheet } from './src/components/VoiceSheet';
import { BookingsPage } from './src/components/BookingsPage';
import { SavedPlacesPage } from './src/components/SavedPlacesPage';
import { ShareSheet } from './src/components/ShareSheet';
import { WallScreen } from './src/components/WallScreen';
import { NewPostSheet } from './src/components/NewPostSheet';
import { useWall } from './src/hooks/useWall';
import { shareText } from './src/lib/wall';
import { distanceKm } from './src/lib/distance';
import { Bell, ChevronDown, Church, CircleUser, Dome, FerrisWheel, Landmark, Lighthouse, Heart, MapPin, Search, ShoppingBag, SlidersHorizontal, Ticket, Trees, X } from 'lucide-react-native';
import type { Category, Place } from './src/types';
import { colors, font, fontFor } from './src/theme';
import { loadPlaces } from './src/data/repository';
import { categoriesWithPlaces, visiblePlaces } from './src/lib/places';
import { KEYS, loadJSON, saveJSON } from './src/lib/storage';
import { useLocation } from './src/hooks/useLocation';
import { SpeakingBars } from './src/components/AssistantOrb';
import { Chip, Txt } from './src/components/ui';
import { inFrame, onBridge, post } from './src/lib/bridge';
import { PlaceCard } from './src/components/PlaceCard';
import { PlaceDetail } from './src/components/PlaceDetail';
import { CatIcon } from './src/components/CatIcon';
import { TabBar, TabKey } from './src/components/TabBar';
import { ProfileScreen, initialOf } from './src/components/ProfileScreen';
import { EmptyState } from './src/components/EmptyState';
import { LoginScreen } from './src/components/LoginScreen';
import { useAuth } from './src/hooks/useAuth';
import { FilterSheet, LocationSheet } from './src/components/OptionSheets';
import { NotificationsSheet } from './src/components/NotificationsSheet';
import { Place as GeoPlace, reverseGeocode } from './src/lib/geocode';
import { activeTags, Extra, NO_EXTRA, whenInfo } from './src/lib/filters';

const ICONS: Record<Category, React.ComponentType<{ size?: number; color?: string }>> = {
  'Monuments': Dome, 'Modern Landmarks': Lighthouse, 'Museums': Landmark, 'Religious & spiritual': Church,
  'Gardens & Parks': Trees, 'Markets & Food': ShoppingBag, 'Entertainment': FerrisWheel,
};

const CAT_COLOR: Record<Category, string> = {
  'Monuments': '#e0662b', 'Modern Landmarks': '#7c4dff', 'Museums': '#0f9d8a', 'Religious & spiritual': '#d9476b',
  'Gardens & Parks': '#2e9e4f', 'Markets & Food': '#d99100', 'Entertainment': '#2c7aef',
};

function CategoryTab({ label, cat, on, onPress }: { label: string; cat: Category; on: boolean; onPress: () => void }) {
  const color = colors.primary; // the active category always uses the app's orange
  return (
    <Pressable onPress={onPress} hitSlop={4} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={({ pressed }) => ({ alignItems: 'center', gap: 6, minHeight: 74, paddingHorizontal: 14, paddingTop: 6, borderBottomWidth: 2, borderBottomColor: on ? color : 'transparent', opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
      <CatIcon cat={cat} size={40} on={on} />
      <Txt w={on ? 'semi' : 'regular'} style={{ fontSize: 12, color: on ? colors.ink : colors.sub, paddingBottom: 6 }}>{label}</Txt>
    </Pressable>
  );
}

function Home() {
  const insets = useSafeAreaInsets();
  const { lang, setLang, t: tt } = useLang();
  const [placesEn, setPlaces] = useState<Place[]>([]);
  const places = useMemo(() => (lang === 'hi' ? placesEn.map(localizePlace) : placesEn), [placesEn, lang]);
  const [savedAll, setSaved] = useState<Set<string>>(new Set());
  const [pendingSave, setPendingSave] = useState<{ ids: string[]; reopen: string | null } | null>(null);
  const [category, setCategory] = useState<Category | 'All'>('Monuments');
  const [query, setQuery] = useState('');
  const [extra, setExtra] = useState<Extra>(NO_EXTRA);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const aiRef = useRef<any>(null);
  // Scrolling down tucks the Welcome/location row away so more cards fit; it only comes back once the list is back at the very top.
  const hdr = useRef(new Animated.Value(1)).current;
  const hdrOpen = useRef(true);
  const onListScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const want = hdrOpen.current ? y < 56 : y <= 4;
    if (want === hdrOpen.current) return;
    hdrOpen.current = want;
    Animated.timing(hdr, { toValue: want ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [hdr]);
  // Preview only: the page around the preview owns the microphone, so it needs a real tap on the assistant button to start
  // listening. We tell it where the button is (only while it is actually visible) and it tells us when it was tapped.
  useEffect(() => {
    if (!inFrame) return;
    const off = onBridge((m) => { if (m.dx === 'open-ai') setShowVoice(true); });
    const send = () => {
      const el: any = aiRef.current; let rect = null;
      if (el?.getBoundingClientRect && typeof document !== 'undefined') {
        const r = el.getBoundingClientRect();
        const hit = r.width ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        if (hit && el.contains(hit)) rect = { x: r.left, y: r.top, w: r.width, h: r.height };
      }
      post({ dx: 'ai', rect });
    };
    send(); const iv = setInterval(send, 250);
    return () => { off(); clearInterval(iv); post({ dx: 'ai', rect: null }); };
  }, []);
  const [showNew, setShowNew] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [geo, setGeo] = useState<{ key: string; p: GeoPlace | null } | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [sub, setSub] = useState<'saved' | 'bookings' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('home');
  const [loginOpen, setLoginOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { user, ready: authReady, signIn, signOut, setDisplayName, setPhoto } = useAuth();
  // Saving needs a login: logged-out visitors see nothing saved, and are asked to log in first.
  const saved = useMemo(() => (user ? savedAll : new Set<string>()), [user, savedAll]);
  const { loc, state, requestCurrent, chooseArea } = useLocation();
  const wall = useWall();
  const me = user ? (user.displayName || tt('You')) : null;
  const toast = (m: string) => { setNotice(m); setTimeout(() => setNotice(null), 2200); };
  const doShare = async (text: string) => { const r = await shareText(text); if (r === 'unsupported') setShareMsg(text); };
  const invite = () => doShare(tt('Join me on Ghummakad. We can share photos of the places we visit in Delhi.'));
  const needLogin = (fn: () => void) => (user ? fn() : setLoginOpen(true));

  useEffect(() => {
    loadPlaces().then(setPlaces);
    loadJSON<string[]>(KEYS.saved, []).then((ids) => setSaved(new Set(ids)));
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const info = whenInfo(extra.when, extra.pick, now.getDay());
  const day = info.day;
  const today = extra.when === 'today' ? now : null;
  const tags = activeTags(extra);
  const clearTag = (k: string) => setExtra((x) => ({ ...x, ...(k === 'when' ? { when: 'today' as const, pick: null } : k === 'budget' ? { budget: null } : k === 'now' ? { now: false } : k === 'opensBy' ? { opensBy: null } : k === 'openTill' ? { openTill: null } : { where: null }) }));
  const clearAll = () => setExtra(NO_EXTRA);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveJSON(KEYS.saved, [...next]);
      return next;
    });
  }, []);

  const saveMany = useCallback((ids: string[]) => {
    setSaved((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      saveJSON(KEYS.saved, [...next]);
      return next;
    });
  }, []);

  const askLogin = (ids: string[]) => {
    setPendingSave({ ids, reopen: openId });
    setOpenId(null);
  };
  const requestToggle = (id: string) => (user ? toggleSave(id) : askLogin([id]));
  const closeLoginPrompt = () => {
    if (pendingSave?.reopen) setOpenId(pendingSave.reopen);
    setPendingSave(null);
  };
  const signInThenSave = async (id: string, code: string) => {
    const ok = await signIn(id, code);
    if (ok && pendingSave) {
      saveMany(pendingSave.ids);
      if (pendingSave.reopen) setOpenId(pendingSave.reopen);
      setPendingSave(null);
    }
    return ok;
  };

  const rows = useMemo(
    () => visiblePlaces(places, { category, query, savedOnly: false, day, extra, now }, saved, loc),
    [places, category, query, day, extra, now, saved, loc],
  );
  const favRows = useMemo(
    () => visiblePlaces(places, { category: 'All', query: '', savedOnly: true, day }, saved, loc),
    [places, day, saved, loc],
  );
  const openKm = rows.find((r) => r.place.id === openId)?.km ?? favRows.find((r) => r.place.id === openId)?.km ?? null;
  const openPlace = places.find((p) => p.id === openId) ?? null;
  const nearby = useMemo(
    () => openPlace
      ? places.filter((p) => p.id !== openPlace.id).map((place) => ({ place, km: distanceKm(openPlace, place) })).sort((a, b) => a.km - b.km).slice(0, 4)
      : [],
    [places, openPlace],
  );
  // Once logged in, the top bar shows the city and street address of the current location, like food delivery apps.
  const gpsKey = user && loc?.kind === 'gps' ? `${loc.lat.toFixed(3)},${loc.lng.toFixed(3)}` : null;
  useEffect(() => {
    if (!gpsKey || !loc) return;
    let live = true;
    reverseGeocode(loc.lat, loc.lng).then((p) => { if (live) setGeo({ key: gpsKey, p }); });
    return () => { live = false; };
  }, [gpsKey]);
  const geoHere = geo && geo.key === gpsKey ? geo.p : null;
  const place = state === 'asking' ? { title: tt('Finding your location…'), sub: tt('One moment') }
    : loc?.kind === 'gps' ? (geoHere ? { title: geoHere.city, sub: geoHere.address || tt('Current location') } : { title: tt('Current location'), sub: geo && geo.key === gpsKey ? tt('Address not available') : tt('Finding your address…') })
    : loc ? { title: tt(loc.label), sub: tt('Area you chose. Tap to change') }
    : { title: tt('Choose location'), sub: tt('Location is off. Tap to choose an area') };
  const locLabel = state === 'asking' ? tt('Finding your location…') : loc ? (loc.kind === 'gps' ? tt('Near your current location') : tt('Near {place}', { place: tt(loc.label) })) : tt('Location off. Choose an area');

  const tabs: Record<Exclude<TabKey, 'home'>, { title: string; hint: string; empty: string }> = {
    wall: { title: tt('My wall'), hint: tt('Log in to post on your wall.'), empty: '' },
    favourites: { title: tt('Favourites'), hint: tt('Log in to see your saved places.'), empty: tt('Nothing here yet.') },
    profile: { title: tt('Profile'), hint: tt('Log in to manage your profile.'), empty: tt('Signed in as {name}.', { name: user?.name ?? '' }) },
  };
  const changeTab = (t: TabKey) => { setLoginOpen(false); setSub(null); setTab(t); };
  if (tab !== 'home') {
    const t = tabs[tab];
    const empty = { icon: <Heart size={36} color={colors.primary} />, heading: tt('Your wishlist is empty'), message: tt('Save places you want to visit and find them all here.'), cta: user ? tt('Explore places') : tt('Log in to create wishlist') };
    let body: React.ReactNode;
    if (!authReady) body = <View style={{ flex: 1 }} />;
    else if (tab === 'profile' && user && sub === 'bookings') {
      body = <BookingsPage onBack={() => setSub(null)} onExplore={() => changeTab('home')} />;
    } else if (tab === 'profile' && user && sub === 'saved') {
      body = <SavedPlacesPage rows={favRows} day={day} today={today} nearestFirst={!!loc} onBack={() => setSub(null)} onOpen={setOpenId} onToggleSave={toggleSave} onExplore={() => changeTab('home')} />;
    } else if (tab === 'profile' || (!user && loginOpen)) {
      body = user
        ? <ProfileScreen id={user.name} displayName={user.displayName} photo={user.photo} onPhoto={setPhoto} savedCount={saved.size} locLabel={locLabel} gps={loc?.kind === 'gps'} locState={state}
            onRename={setDisplayName} onOpenSaved={() => setSub('saved')} onOpenBookings={() => setSub('bookings')} onInvite={invite} onChangeStart={() => { changeTab('home'); setShowLocation(true); }}
            onAllowLocation={requestCurrent} onSignOut={signOut}
            onDelete={async () => { setSaved(new Set()); await saveJSON(KEYS.saved, []); await setDisplayName(''); await setPhoto(undefined); await signOut(); changeTab('home'); }} />
        : <LoginScreen title={t.title} hint={t.hint} onSignIn={signIn} />;
    } else if (tab === 'wall') {
      const placeName = (id?: string) => places.find((x) => x.id === id)?.name;
      body = (
        <WallScreen posts={wall.posts} places={places} me={me} myPhoto={user?.photo}
          onNew={() => needLogin(() => setShowNew(true))}
          onInvite={() => needLogin(invite)}
          onLike={(id) => needLogin(() => wall.toggleLike(id))}
          onComment={(id, text) => needLogin(() => wall.addComment(id, me as string, text))}
          onShare={(post) => doShare(`${post.caption ? `${post.caption} - ` : ''}${placeName(post.placeId) ? `${placeName(post.placeId)}, ${tt('Delhi')}. ` : ''}${tt('Shared from Ghummakad.')}`)}
          onDelete={wall.removePost} onOpenPlace={setOpenId} />
      );
    } else if (tab === 'favourites' && user && favRows.length > 0) {
      body = (
        <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Txt w="bold" style={{ fontSize: 20 }}>{tt('Favourites')}</Txt>
            <Txt style={{ color: colors.sub, fontSize: 13 }}>{favRows.length === 1 ? tt('1 saved place') : tt('{n} saved places', { n: favRows.length })}{loc ? tt(', nearest first') : ''}</Txt>
          </View>
          <FlatList data={favRows} extraData={lang} keyExtractor={(r) => r.place.id} contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }) => (
              <PlaceCard place={item.place} km={item.km} day={day} today={today} saved onOpen={() => setOpenId(item.place.id)} onToggleSave={() => toggleSave(item.place.id)} />
            )} />
        </View>
      );
    } else {
      body = <EmptyState title={t.title} {...empty} onCta={() => (user ? changeTab('home') : setLoginOpen(true))} />;
    }
    return (
      <View style={s.screen}>
        <StatusBar style="dark" />
        <FadeSlide k={`${tab}-${!user && loginOpen}-${sub}`} dy={6} ms={240} style={{ flex: 1 }}>{body}</FadeSlide>
        {notice ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 84, backgroundColor: colors.dark, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
            <Txt w="semi" style={{ color: colors.white, fontSize: 14, textAlign: 'center' }}>{notice}</Txt>
          </View>
        ) : null}
        <TabBar key="tabbar" tab={tab} onChange={changeTab} />
        <ShareSheet text={shareMsg} onClose={() => setShareMsg(null)} />
        <NewPostSheet visible={showNew} onClose={() => setShowNew(false)} places={places} onPost={(a) => wall.addPost({ author: me ?? 'You', ...a })} />
        <PlaceDetail place={openPlace} km={openKm} loc={loc?.kind === 'gps' ? loc : null} locState={state} onAllowLocation={requestCurrent} day={day} today={today} saved={openId ? saved.has(openId) : false} nearby={nearby} onOpenPlace={setOpenId}
          onClose={() => setOpenId(null)} onToggleSave={() => openId && requestToggle(openId)} />
      </View>
    );
  }
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <FadeSlide k="home" dy={6} ms={240} style={{ flex: 1 }}>
      <Animated.View style={{ overflow: 'hidden', opacity: hdr, maxHeight: hdr.interpolate({ inputRange: [0, 1], outputRange: [0, 90] }) }}>
      <View style={s.header}>
        {user ? (
          <Pressable onPress={() => setShowLocation(true)} hitSlop={{ top: 8, bottom: 8, right: 16 }} accessibilityRole="button" accessibilityLabel={tt('Location: {where}. Change', { where: `${place.title}, ${place.sub}` })} style={{ flex: 1 }}>
            <View style={s.loc}>
              <MapPin size={20} color={colors.primary} />
              <Txt w="bold" numberOfLines={1} style={{ fontSize: 20, flexShrink: 1 }}>{place.title}</Txt>
              <ChevronDown size={18} color={colors.ink} />
            </View>
            <Txt numberOfLines={1} style={{ color: colors.sub, fontSize: 13, marginTop: 2 }}>{place.sub}</Txt>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }}>
            <Txt w="bold" style={{ fontSize: 20 }}>{tt('Welcome')}</Txt>
            <Pressable onPress={() => setShowLocation(true)} hitSlop={{ top: 8, bottom: 8, right: 16 }} accessibilityRole="button" accessibilityLabel={tt('Location: {where}. Change', { where: locLabel })} style={s.loc}>
              <MapPin size={14} color={colors.sub} />
              <Txt style={{ color: colors.sub, fontSize: 13 }}>{locLabel}</Txt>
            </Pressable>
          </View>
        )}
        <View accessibilityRole="radiogroup" accessibilityLabel={tt('Language')} style={{ flexDirection: 'row', height: 40, borderRadius: 20, backgroundColor: colors.fill, padding: 3, marginRight: 8 }}>
          {([['en', 'EN'], ['hi', 'हि']] as const).map(([k, lab]) => (
            <Pressable key={k} onPress={() => setLang(k)} accessibilityRole="radio" accessibilityState={{ checked: lang === k }} accessibilityLabel={LANGUAGES.find((l) => l.key === k)?.label}
              style={{ minWidth: 36, paddingHorizontal: 8, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: lang === k ? colors.primary : 'transparent' }}>
              <Txt w="bold" style={{ fontSize: 14, color: lang === k ? colors.white : colors.text, fontFamily: k === 'hi' ? 'NotoSansDevanagari_700Bold' : undefined }}>{lab}</Txt>
            </Pressable>))}
        </View>
        <Pressable onPress={() => setShowNotes(true)} accessibilityRole="button" accessibilityLabel={tt('Notifications')} style={s.avatar}>
          <Bell size={22} color={colors.ink} />
        </Pressable>
      </View>
      </Animated.View>
      <View style={s.searchRow}>
        <View style={s.search}>
          <Search size={20} color={colors.text} />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TextInput value={query} onChangeText={setQuery} placeholder="" accessibilityLabel={tt('Search places')} returnKeyType="search" style={[s.input, { fontFamily: fontFor('regular') }]} />
            {query ? null : <RotatingHint items={['India Gate', 'free places', 'Qutub Minar', 'nearest metro', 'Lotus Temple']} />}
          </View>
          <Pressable ref={aiRef} onPress={() => setShowVoice(true)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 8 }} accessibilityRole="button" accessibilityLabel={tt('Ask the Delhi assistant')} style={({ pressed }) => [s.mic, { opacity: pressed ? 0.8 : 1 }]}>
            <SpeakingBars size={24} />
          </Pressable>
        </View>
        <Pressable onPress={() => setShowFilters(true)} accessibilityRole="button" accessibilityLabel={tt('Filters')} style={s.filter}>
          <SlidersHorizontal size={24} color={colors.ink} />
        </Pressable>
      </View>
      <View style={{ flexGrow: 0 }}>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={categoriesWithPlaces(places)} extraData={lang} keyExtractor={(c) => c} contentContainerStyle={s.chips}
          renderItem={({ item }) => {
            const on = !query && category === item;
            return <CategoryTab label={tt(item)} cat={item} on={on} onPress={() => { setQuery(''); setCategory(item); }} />;
          }} />
      </View>
      {tags.length ? (
        <View style={s.tagRow}>
          <FlatList horizontal showsHorizontalScrollIndicator={false} data={tags} keyExtractor={(t) => t.key} style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => clearTag(item.key)} accessibilityRole="button" accessibilityLabel={tt('Remove filter {name}', { name: item.label })} style={s.tag}>
                <Txt w="medium" style={{ fontSize: 12, color: colors.secondary }}>{item.label}</Txt>
                <X size={14} color={colors.primary} />
              </Pressable>
            )} />
          <Pressable onPress={clearAll} accessibilityRole="button" hitSlop={8} style={{ paddingRight: 16, paddingLeft: 4 }}><Txt w="semi" style={{ fontSize: 12, color: colors.sub }}>{tt('Clear')}</Txt></Pressable>
        </View>
      ) : null}
      {info.hint ? <Txt style={s.hint}>{info.hint}</Txt> : null}
      {rows.length === 0 && tags.length ? <Txt style={s.hint}>{tt('{n} places match. Places with unknown opening days, prices or hours are left out of those filters.', { n: rows.length })}</Txt> : null}
      <FadeSlide k={query ? 'search' : String(category)} style={{ flex: 1 }}>
      <FlatList data={rows} extraData={lang} keyExtractor={(r) => r.place.id} style={{ backgroundColor: colors.white }} contentContainerStyle={{ paddingBottom: 24 }}
        initialNumToRender={6} windowSize={7} keyboardShouldPersistTaps="handled" onScroll={onListScroll} scrollEventThrottle={16}
        ListEmptyComponent={<Txt style={s.empty}>{tt('Nothing here yet. More places are coming soon — try another category or clear the filters.')}</Txt>}
        renderItem={({ item }) => (
          <PlaceCard place={item.place} km={item.km} day={day} today={today} saved={saved.has(item.place.id)}
            onOpen={() => setOpenId(item.place.id)} onToggleSave={() => requestToggle(item.place.id)} />
        )} />
      </FadeSlide>
      </FadeSlide>
      <TabBar key="tabbar" tab={tab} onChange={setTab} />
      <PlaceDetail place={openPlace} km={openKm} loc={loc?.kind === 'gps' ? loc : null} locState={state} onAllowLocation={requestCurrent} day={day} today={today} saved={openId ? saved.has(openId) : false} nearby={nearby} onOpenPlace={setOpenId}
        onClose={() => setOpenId(null)} onToggleSave={() => openId && requestToggle(openId)} />
      <VoiceSheet visible={showVoice} onClose={() => setShowVoice(false)} places={placesEn} loc={loc} day={day} today={today} onOpenPlace={setOpenId} />
      <AuthPrompt visible={pendingSave !== null} onClose={closeLoginPrompt} onSignIn={signInThenSave} />
      <FilterSheet visible={showFilters} onClose={() => setShowFilters(false)} extra={extra} category={category} categories={categoriesWithPlaces(places)}
        hasLocation={!!loc} onSetLocation={() => { setShowFilters(false); setShowLocation(true); }}
        countFor={(x, c) => visiblePlaces(places, { category: c, query, savedOnly: false, day: whenInfo(x.when, x.pick, now.getDay()).day, extra: x, now }, saved, loc).length}
        onApply={(x, c) => { setExtra(x); if (c !== category) { setQuery(''); setCategory(c); } setShowFilters(false); }} />
      <NotificationsSheet visible={showNotes} onClose={() => setShowNotes(false)} />
      <LocationSheet visible={showLocation} onClose={() => setShowLocation(false)} loc={loc} state={state} onUseCurrent={requestCurrent} onChooseArea={chooseArea} />
    </View>
  );
}

/** Placeholder that rolls through example searches, like Blinkit's search bar. Taps pass through to the input underneath. */
function RotatingHint({ items }: { items: string[] }) {
  const { t: tt } = useLang();
  const [i, setI] = useState(0);
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(y, { toValue: -1, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
        setI((n) => (n + 1) % items.length);
        y.setValue(1);
        Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      });
    }, 2600);
    return () => clearInterval(id);
  }, [items.length, y]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, opacity: y.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }), transform: [{ translateY: y.interpolate({ inputRange: [-1, 0, 1], outputRange: [-12, 0, 12] }) }] }}>
      <Txt numberOfLines={1} style={{ fontSize: 16, color: '#333232' }}>{tt('Search “{x}”', { x: tt(items[i]) })}</Txt>
    </Animated.View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Outfit_800ExtraBold, Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, NotoSansDevanagari_400Regular, NotoSansDevanagari_500Medium, NotoSansDevanagari_600SemiBold, NotoSansDevanagari_700Bold });
  if (!loaded) return null;
  return <SafeAreaProvider><LangProvider><Root /></LangProvider></SafeAreaProvider>;
}

/** The first time the app opens, ask which language to use. */
function Root() {
  const { ready } = useLang();
  const [splash, setSplash] = useState(true);
  // The app loads underneath while the splash plays, then the splash slides off to the left.
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {ready ? <Home /> : null}
      {splash ? <Splash onDone={() => setSplash(false)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    searchRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingHorizontal: 16, borderRadius: 26, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, color: '#333232', paddingVertical: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  mic: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  filter: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  chips: { paddingHorizontal: 4, paddingTop: 8, borderBottomWidth: 0 },
  hint: { color: colors.sub, fontSize: 12, marginHorizontal: 16, marginTop: 8 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexGrow: 0 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.primaryTint },
  empty: { color: colors.sub, textAlign: 'center', padding: 48 },
});

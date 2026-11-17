import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { FadeSlide } from './src/components/motion';
import { AuthPrompt } from './src/components/AuthPrompt';
import { PlanSheet } from './src/components/PlanSheet';
import { distanceKm } from './src/lib/distance';
import { Church, Dome, FerrisWheel, Landmark, Lighthouse, Heart, MapPin, Search, ShoppingBag, SlidersHorizontal, Ticket, Trees } from 'lucide-react-native';
import type { Category, Place } from './src/types';
import { colors, font } from './src/theme';
import { loadPlaces } from './src/data/repository';
import { categoriesWithPlaces, visiblePlaces } from './src/lib/places';
import { KEYS, loadJSON, saveJSON } from './src/lib/storage';
import { useLocation } from './src/hooks/useLocation';
import { Chip, Txt } from './src/components/ui';
import { PlaceCard } from './src/components/PlaceCard';
import { PlaceDetail } from './src/components/PlaceDetail';
import { TabBar, TabKey } from './src/components/TabBar';
import { EmptyTab } from './src/components/LoginRequired';
import { EmptyState } from './src/components/EmptyState';
import { LoginScreen } from './src/components/LoginScreen';
import { useAuth } from './src/hooks/useAuth';
import { DAY_CHOICES, DayChoice, FilterSheet, LocationSheet } from './src/components/OptionSheets';

const ICONS: Record<Category, React.ComponentType<{ size?: number; color?: string }>> = {
  'Monuments': Dome, 'Modern Landmarks': Lighthouse, 'Museums': Landmark, 'Religious & spiritual': Church,
  'Gardens & Parks': Trees, 'Markets & Food': ShoppingBag, 'Entertainment': FerrisWheel,
};

const CAT_COLOR: Record<Category, string> = {
  'Monuments': '#e0662b', 'Modern Landmarks': '#7c4dff', 'Museums': '#0f9d8a', 'Religious & spiritual': '#d9476b',
  'Gardens & Parks': '#2e9e4f', 'Markets & Food': '#d99100', 'Entertainment': '#2c7aef',
};

function CategoryTab({ label, color, on, Icon, onPress }: { label: string; color: string; on: boolean; Icon: React.ComponentType<{ size?: number; color?: string; fill?: string; strokeWidth?: number }>; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={({ pressed }) => ({ alignItems: 'center', gap: 6, minHeight: 60, paddingHorizontal: 14, paddingTop: 8, borderBottomWidth: 2, borderBottomColor: on ? color : 'transparent', opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
      <Icon size={26} color={on ? color : colors.sub} fill={on ? `${color}38` : 'none'} strokeWidth={on ? 2.2 : 1.8} />
      <Txt w={on ? 'semi' : 'regular'} style={{ fontSize: 12, color: on ? colors.ink : colors.sub, paddingBottom: 6 }}>{label}</Txt>
    </Pressable>
  );
}

function Home() {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<Place[]>([]);
  const [savedAll, setSaved] = useState<Set<string>>(new Set());
  const [pendingSave, setPendingSave] = useState<{ ids: string[]; reopen: string | null } | null>(null);
  const [category, setCategory] = useState<Category | 'All'>('Monuments');
  const [query, setQuery] = useState('');
  const [dayChoice, setDayChoice] = useState<DayChoice>('today');
  const [freeOnly, setFreeOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [tab, setTab] = useState<TabKey>('home');
  const [loginOpen, setLoginOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { user, ready: authReady, signIn, signOut } = useAuth();
  // Saving needs a login: logged-out visitors see nothing saved, and are asked to log in first.
  const saved = useMemo(() => (user ? savedAll : new Set<string>()), [user, savedAll]);
  const { loc, state, requestCurrent, chooseArea } = useLocation();

  useEffect(() => {
    loadPlaces().then(setPlaces);
    loadJSON<string[]>(KEYS.saved, []).then((ids) => setSaved(new Set(ids)));
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const choice = DAY_CHOICES.find((d) => d.key === dayChoice)!;
  const day = choice.day(now.getDay());
  const today = dayChoice === 'today' ? now : null;

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
    setShowPlan(false);
  };
  const requestToggle = (id: string) => (user ? toggleSave(id) : askLogin([id]));
  const requestSaveAll = (ids: string[]) => (user ? saveMany(ids) : askLogin(ids));
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
    () => visiblePlaces(places, { category, query, freeOnly, savedOnly, day }, saved, loc),
    [places, category, query, freeOnly, savedOnly, day, saved, loc],
  );
  const favRows = useMemo(
    () => visiblePlaces(places, { category: 'All', query: '', freeOnly: false, savedOnly: true, day }, saved, loc),
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
  const locLabel = state === 'asking' ? 'Finding your location…' : loc ? (loc.kind === 'gps' ? 'Near your current location' : `Near ${loc.label}`) : 'Location off. Choose an area';

  const tabs: Record<Exclude<TabKey, 'home'>, { title: string; hint: string; empty: string }> = {
    favourites: { title: 'Favourites', hint: 'Log in to see your saved places.', empty: 'Nothing here yet.' },
    bookings: { title: 'Bookings', hint: 'Log in to see your bookings.', empty: 'Nothing here yet.' },
    profile: { title: 'Profile', hint: 'Log in to manage your profile.', empty: `Signed in as ${user?.name ?? ''}.` },
  };
  const changeTab = (t: TabKey) => { setLoginOpen(false); setTab(t); };
  if (tab !== 'home') {
    const t = tabs[tab];
    const empty = tab === 'favourites'
      ? { icon: <Heart size={36} color={colors.primary} />, heading: 'Your wishlist is empty', message: 'Save places you want to visit and find them all here.', cta: user ? 'Explore places' : 'Log in to create wishlist' }
      : { icon: <Ticket size={36} color={colors.primary} />, heading: 'No bookings yet', message: 'Tickets you book on official sites will be listed here.', cta: user ? 'Explore places' : 'Log in to see bookings' };
    let body: React.ReactNode;
    if (!authReady) body = <View style={{ flex: 1 }} />;
    else if (tab === 'profile' || (!user && loginOpen)) {
      body = user
        ? <EmptyTab title={t.title} message={t.empty} onSignOut={signOut} />
        : <LoginScreen title={t.title} hint={t.hint} onSignIn={signIn} />;
    } else if (tab === 'favourites' && user && favRows.length > 0) {
      body = (
        <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Txt w="bold" style={{ fontSize: 20 }}>Favourites</Txt>
            <Txt style={{ color: colors.sub, fontSize: 13 }}>{favRows.length} saved {favRows.length === 1 ? 'place' : 'places'}{loc ? ', nearest first' : ''}</Txt>
          </View>
          <FlatList data={favRows} keyExtractor={(r) => r.place.id} contentContainerStyle={{ paddingBottom: 12 }}
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
        <FadeSlide k={`${tab}-${!user && loginOpen}`} style={{ flex: 1 }}>{body}</FadeSlide>
        <TabBar key="tabbar" tab={tab} onChange={changeTab} onPlan={() => { changeTab('home'); setShowPlan(true); }} />
        <PlaceDetail place={openPlace} km={openKm} day={day} today={today} saved={openId ? saved.has(openId) : false} nearby={nearby} onOpenPlace={setOpenId}
          onClose={() => setOpenId(null)} onToggleSave={() => openId && requestToggle(openId)} />
      </View>
    );
  }
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <FadeSlide k="home" style={{ flex: 1 }}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Txt w="bold" style={{ fontSize: 20 }}>Welcome</Txt>
          <Pressable onPress={() => setShowLocation(true)} hitSlop={{ top: 8, bottom: 8, right: 16 }} accessibilityRole="button" accessibilityLabel={`Location: ${locLabel}. Change`} style={s.loc}>
            <MapPin size={14} color={colors.sub} />
            <Txt style={{ color: colors.sub, fontSize: 13 }}>{locLabel}</Txt>
          </Pressable>
        </View>
      </View>
      <View style={s.searchRow}>
        <View style={s.search}>
          <Search size={20} color={colors.text} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search place, attractions..." placeholderTextColor="#333232"
            accessibilityLabel="Search places" returnKeyType="search" style={s.input} />
        </View>
        <Pressable onPress={() => setShowFilters(true)} accessibilityRole="button" accessibilityLabel="Filters" style={s.filter}>
          <SlidersHorizontal size={24} color={colors.ink} />
        </Pressable>
      </View>
      <View style={{ flexGrow: 0 }}>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={categoriesWithPlaces(places)} keyExtractor={(c) => c} contentContainerStyle={s.chips}
          renderItem={({ item }) => {
            const Icon = ICONS[item];
            const on = !query && category === item;
            return <CategoryTab label={item} color={CAT_COLOR[item]} on={on} Icon={Icon} onPress={() => { setQuery(''); setCategory(item); }} />;
          }} />
      </View>
      {loc ? <Txt style={s.hint}>Nearest first, by straight-line distance.</Txt> : null}
      {dayChoice !== 'today' ? <Txt style={s.hint}>Showing status for {choice.label}.</Txt> : null}
      <FadeSlide k={query ? 'search' : String(category)} style={{ flex: 1 }}>
      <FlatList data={rows} keyExtractor={(r) => r.place.id} style={{ backgroundColor: colors.white }} contentContainerStyle={{ paddingBottom: 12 }}
        initialNumToRender={6} windowSize={7} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Txt style={s.empty}>Nothing here yet. More places are coming soon — try another category or clear the filters.</Txt>}
        renderItem={({ item }) => (
          <PlaceCard place={item.place} km={item.km} day={day} today={today} saved={saved.has(item.place.id)}
            onOpen={() => setOpenId(item.place.id)} onToggleSave={() => requestToggle(item.place.id)} />
        )} />
      </FadeSlide>
      </FadeSlide>
      <TabBar key="tabbar" tab={tab} onChange={setTab} onPlan={() => setShowPlan(true)} />
      <PlaceDetail place={openPlace} km={openKm} day={day} today={today} saved={openId ? saved.has(openId) : false} nearby={nearby} onOpenPlace={setOpenId}
        onClose={() => setOpenId(null)} onToggleSave={() => openId && requestToggle(openId)} />
      <PlanSheet visible={showPlan} onClose={() => setShowPlan(false)} places={places} day={day} dayLabel={choice.label} today={today} loc={loc} saved={saved} onSaveAll={requestSaveAll} onOpenPlace={setOpenId} />
      <AuthPrompt visible={pendingSave !== null} onClose={closeLoginPrompt} onSignIn={signInThenSave} />
      <FilterSheet visible={showFilters} onClose={() => setShowFilters(false)} dayChoice={dayChoice} setDayChoice={setDayChoice}
        freeOnly={freeOnly} setFreeOnly={setFreeOnly} savedOnly={savedOnly} setSavedOnly={setSavedOnly} savedCount={saved.size} />
      <LocationSheet visible={showLocation} onClose={() => setShowLocation(false)} loc={loc} state={state} onUseCurrent={requestCurrent} onChooseArea={chooseArea} />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold });
  if (!loaded) return null;
  return <SafeAreaProvider><Home /></SafeAreaProvider>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    searchRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingHorizontal: 16, borderRadius: 26, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, color: '#333232', paddingVertical: 8 },
  filter: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  chips: { paddingHorizontal: 4, paddingTop: 8, borderBottomWidth: 0 },
  hint: { color: colors.sub, fontSize: 12, marginHorizontal: 16, marginTop: 8 },
  empty: { color: colors.sub, textAlign: 'center', padding: 48 },
});

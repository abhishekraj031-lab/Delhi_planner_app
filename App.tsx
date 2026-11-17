import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Church, Dome, FerrisWheel, Landmark, Lighthouse, Heart, MapPin, Search, ShoppingBag, SlidersHorizontal, Ticket, Trees } from 'lucide-react-native';
import type { Category, Place } from './src/types';
import { colors, font } from './src/theme';
import { loadPlaces } from './src/data/repository';
import { CATEGORIES, visiblePlaces } from './src/lib/places';
import { KEYS, loadJSON, saveJSON } from './src/lib/storage';
import { useLocation } from './src/hooks/useLocation';
import { Chip, Txt } from './src/components/ui';
import { PlaceCard } from './src/components/PlaceCard';
import { PlaceSheet } from './src/components/PlaceSheet';
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

function Home() {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<Place[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [dayChoice, setDayChoice] = useState<DayChoice>('today');
  const [freeOnly, setFreeOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [tab, setTab] = useState<TabKey>('home');
  const [loginOpen, setLoginOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { user, ready: authReady, signIn, signOut } = useAuth();
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

  const rows = useMemo(
    () => visiblePlaces(places, { category, query, freeOnly, savedOnly, day }, saved, loc),
    [places, category, query, freeOnly, savedOnly, day, saved, loc],
  );
  const openKm = rows.find((r) => r.place.id === openId)?.km ?? null;
  const openPlace = places.find((p) => p.id === openId) ?? null;
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
    } else {
      body = <EmptyState title={t.title} {...empty} onCta={() => (user ? changeTab('home') : setLoginOpen(true))} />;
    }
    return (
      <View style={s.screen}>
        <StatusBar style="dark" />
        {body}
        <TabBar tab={tab} onChange={changeTab} />
      </View>
    );
  }
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
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
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATEGORIES} keyExtractor={(c) => c} contentContainerStyle={s.chips}
          renderItem={({ item }) => {
            const Icon = ICONS[item];
            const on = !query && category === item;
            return <Chip label={item} on={on} onPress={() => { setQuery(''); setCategory(on ? 'All' : item); }} icon={<Icon size={12} color={on ? colors.white : colors.text} />} />;
          }} />
      </View>
      {loc ? <Txt style={s.hint}>Nearest first, by straight-line distance.</Txt> : null}
      {dayChoice !== 'today' ? <Txt style={s.hint}>Showing status for {choice.label}.</Txt> : null}
      <FlatList data={rows} keyExtractor={(r) => r.place.id} style={{ backgroundColor: colors.fill, marginTop: 8 }} contentContainerStyle={{ paddingBottom: 12 }}
        initialNumToRender={6} windowSize={7} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Txt style={s.empty}>No places match. Try another category or clear the filters.</Txt>}
        renderItem={({ item }) => (
          <PlaceCard place={item.place} km={item.km} day={day} today={today} saved={saved.has(item.place.id)}
            onOpen={() => setOpenId(item.place.id)} onToggleSave={() => toggleSave(item.place.id)} />
        )} />
      <TabBar tab={tab} onChange={setTab} />
      <PlaceSheet place={openPlace} km={openKm} day={day} today={today} saved={openId ? saved.has(openId) : false}
        onClose={() => setOpenId(null)} onToggleSave={() => openId && toggleSave(openId)} />
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
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    searchRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.fill },
  input: { flex: 1, fontFamily: font.regular, fontSize: 16, color: '#333232', paddingVertical: 8 },
  filter: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  hint: { color: colors.sub, fontSize: 12, marginHorizontal: 16, marginTop: 8 },
  empty: { color: colors.sub, textAlign: 'center', padding: 48 },
});

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { IconButton } from '@/src/components';
import { SwipeableChatRow } from '@/src/components/SwipeableChatRow';
import { getActiveChats, getArchivedChats, type ChatItem } from '@/src/data/mockChats';
import { fetchChats, apiChatToItem, updateChatSettings, deleteChat } from '@/src/services/chats';

type FilterKey = 'All' | 'Unread' | 'Favorites' | 'Groups';
const FILTERS: FilterKey[] = ['All', 'Unread', 'Favorites', 'Groups'];

// ── Branded three-dot loader ────────────────────────────────────────────────
function BrandedLoader() {
  const s0 = useRef(new Animated.Value(1)).current;
  const s1 = useRef(new Animated.Value(1)).current;
  const s2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    function bounce(s: Animated.Value, delay: number) {
      const rest = 600 - delay;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(s, { toValue: 1.55, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(s, { toValue: 1.0,  duration: 150, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
          Animated.delay(rest),
        ])
      );
    }
    const anim = Animated.parallel([bounce(s0, 0), bounce(s1, 150), bounce(s2, 300)]);
    anim.start();
    return () => anim.stop();
  }, []);

  const DOT_BG = ['#14213D', '#3D5AFE', '#F2A93B'];
  return (
    <View style={loaderStyles.row}>
      {([s0, s1, s2] as Animated.Value[]).map((s, i) => (
        <Animated.View key={i} style={[loaderStyles.dot, { backgroundColor: DOT_BG[i], transform: [{ scale: s }] }]} />
      ))}
    </View>
  );
}

// ── Pulsing status dot ──────────────────────────────────────────────────────
function PulsingDot({ color, size, absolute = false }: { color: string; size: number; absolute?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[
      {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 1.5, borderColor: '#FFFFFF',
        transform: [{ scale }], opacity,
      },
      absolute && { position: 'absolute', bottom: 0, right: 0 },
    ]} />
  );
}

// ── Animated entrance wrapper per chat row ─────────────────────────────────
interface AnimRowProps {
  index: number;
  chat: ChatItem;
  colors: any;
  onPress: () => void;
  onArchive: (id: string) => void;
  onPin?: (id: string) => void;
  onMute?: (id: string) => void;
  onDelete: (id: string) => void;
}
function AnimatedChatRow({ index, chat, colors, onPress, onArchive, onPin, onMute, onDelete }: AnimRowProps) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const delay = Math.min(index, 12) * 60;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, delay, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <SwipeableChatRow
        chat={chat}
        colors={colors}
        onPress={onPress}
        onArchive={onArchive}
        onPin={onPin}
        onMute={onMute}
        onDelete={onDelete}
      />
    </Animated.View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function ChatsScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [chats, setChats]           = useState<ChatItem[]>(getActiveChats);
  const [archivedChats, setArchivedChats] = useState<ChatItem[]>(getArchivedChats);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [showOverflow, setShowOverflow] = useState(false);
  const [filter, setFilter]         = useState<FilterKey>('All');
  const [query, setQuery]           = useState('');
  const searchRef = useRef<TextInput>(null);

  // Chip scale animations
  const chipScales = useRef(
    Object.fromEntries(FILTERS.map((f) => [f, new Animated.Value(1)])) as Record<FilterKey, Animated.Value>
  ).current;

  // FAB rotation animation
  const fabSpin = useRef(new Animated.Value(0)).current;
  const fabRotate = fabSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    loadChats().finally(() => { clearTimeout(timeout); setLoading(false); });
  }, []);

  async function loadChats() {
    try {
      const [active, archived] = await Promise.all([fetchChats(false), fetchChats(true)]);
      setChats(active.map(apiChatToItem));
      setArchivedChats(archived.map(apiChatToItem));
    } catch {
      // server not running — keep mock data
    }
  }

  function selectFilter(f: FilterKey) {
    Animated.spring(chipScales[f], { toValue: 1.05, useNativeDriver: true, friction: 6 }).start(() =>
      Animated.spring(chipScales[f], { toValue: 1, useNativeDriver: true, friction: 6 }).start()
    );
    setFilter(f);
  }

  function handleFabPress() {
    Animated.spring(fabSpin, { toValue: 1, useNativeDriver: true, friction: 4, tension: 100 }).start(() => {
      fabSpin.setValue(0);
      router.push('/new-chat');
    });
  }

  const archivedCount = archivedChats.length;

  const filtered = useMemo(() => {
    let list = chats;
    if (filter === 'Unread')         list = list.filter((c) => c.unreadCount > 0 && !c.type);
    else if (filter === 'Favorites') list = list.filter((c) => c.isFavorite && !c.type);
    else if (filter === 'Groups')    list = list.filter((c) => c.isGroup && !c.type);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });
  }, [chats, filter, query]);

  const handleArchive = useCallback(async (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    try { await updateChatSettings(id, { isArchived: true }); } catch {}
  }, []);

  const handlePin = useCallback(async (id: string) => {
    setChats((prev) => prev.map((c) => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    const chat = chats.find((c) => c.id === id);
    try { if (chat) await updateChatSettings(id, { isPinned: !chat.isPinned }); } catch {}
  }, [chats]);

  const handleMute = useCallback(async (id: string) => {
    setChats((prev) => prev.map((c) => c.id === id ? { ...c, isMuted: !c.isMuted } : c));
    const chat = chats.find((c) => c.id === id);
    try { if (chat) await updateChatSettings(id, { isMuted: !chat.isMuted }); } catch {}
  }, [chats]);

  const handleDelete = useCallback(async (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    try { await deleteChat(id); } catch {}
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: ChatItem; index: number }) => {
    const dest = item.type === 'vault' ? '/vault' : item.type === 'xen' ? '/xen' : `/chat/${item.id}`;
    return (
      <AnimatedChatRow
        index={index}
        chat={item}
        colors={colors}
        onPress={() => router.push(dest as any)}
        onArchive={handleArchive}
        onPin={handlePin}
        onMute={handleMute}
        onDelete={handleDelete}
      />
    );
  }, [colors, handleArchive, handlePin, handleMute, handleDelete]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* gradient layer: subtle highlight at top */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#14213D' }]} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.06)', bottom: '50%' }]} />

        <View style={styles.headerInner}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>HowFar</Text>
            <PulsingDot color="#4ADE80" size={8} />
          </View>
          <View style={styles.headerActions}>
            <IconButton name="camera-outline"    color="#FFFFFF" onPress={() => router.push('/camera')}    accessibilityLabel="Open camera" />
            <IconButton name="ellipsis-vertical" color="#FFFFFF" onPress={() => setShowOverflow(true)} accessibilityLabel="More options" />
          </View>
        </View>

        {/* ── Inline search bar ── */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={18} color="#3D5AFE" style={{ marginRight: 8 }} />
          <TextInput
            ref={searchRef}
            style={styles.searchBarInput}
            placeholder="Search chats..."
            placeholderTextColor="#9AA0B9"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9AA0B9" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter chips ── */}
      <View style={[styles.chipBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Animated.View key={f} style={{ transform: [{ scale: chipScales[f] }] }}>
                <TouchableOpacity
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => selectFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{f}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Loading or chat list ── */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <BrandedLoader />
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            archivedCount > 0 ? (
              <Pressable
                style={[styles.archivedRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                onPress={() => router.push('/archived')}
              >
                <View style={[styles.archivedIcon, { backgroundColor: colors.border }]}>
                  <Ionicons name="archive-outline" size={18} color={colors.textSecondary} />
                </View>
                <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>Archived</Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{archivedCount}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.border} />
              <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
                {query ? 'No results found' : 'No chats yet'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      )}

      {/* ── Overflow menu ── */}
      <Modal visible={showOverflow} transparent animationType="fade" onRequestClose={() => setShowOverflow(false)}>
        <Pressable style={overflowStyles.backdrop} onPress={() => setShowOverflow(false)} />
        <View style={[overflowStyles.menu, { backgroundColor: colors.surface }]}>
          {[
            { label: 'New group',        action: () => { setShowOverflow(false); router.push('/new-group/select-members'); } },
            { label: 'Starred messages', action: () => { setShowOverflow(false); router.push('/starred'); } },
            { label: 'Settings',         action: () => { setShowOverflow(false); router.push('/settings'); } },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={[overflowStyles.item, { borderBottomColor: colors.border }]} onPress={item.action}>
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accentAmber, bottom: insets.bottom + 72 }]}
        onPress={handleFabPress}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
          <Ionicons name="create-outline" size={26} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { width: '100%' },
  headerInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    gap: 8,
  },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 26, color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2FF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  searchBarInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#14213D',
    padding: 0,
  },

  chipBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  chipActive:   { backgroundColor: '#14213D' },
  chipInactive: { backgroundColor: '#F0F2FF' },
  chipText: { fontSize: 14 },
  chipTextActive:   { fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  chipTextInactive: { fontFamily: 'Inter_500Medium',   color: '#14213D' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  archivedIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  separator: { height: StyleSheet.hairlineWidth, marginLeft: 72 },
  empty: { alignItems: 'center', marginTop: 80 },

  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F2A93B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

const loaderStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

const overflowStyles = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    top: 56,
    right: 8,
    minWidth: 180,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

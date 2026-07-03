import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
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

export default function ChatsScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState<ChatItem[]>(getActiveChats);
  const [archivedChats, setArchivedChats] = useState<ChatItem[]>(getArchivedChats);
  const [refreshing, setRefreshing] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);

  // Load from API on mount; fall back to mock data if unreachable
  useEffect(() => {
    loadChats();
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
  const [filter, setFilter] = useState<FilterKey>('All');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);

  const archivedCount = archivedChats.length;

  const filtered = useMemo(() => {
    let list = chats;
    if (filter === 'Unread') list = list.filter((c) => c.unreadCount > 0);
    else if (filter === 'Favorites') list = list.filter((c) => c.isFavorite);
    else if (filter === 'Groups') list = list.filter((c) => c.isGroup);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
      );
    }
    // Pinned chats always float to top
    return [...list].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  }, [chats, filter, query]);

  const openSearch = () => {
    setSearching(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

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

  const renderItem = useCallback(({ item }: { item: ChatItem }) => (
    <SwipeableChatRow
      chat={item}
      colors={colors}
      onPress={() => router.push(`/chat/${item.id}`)}
      onArchive={handleArchive}
      onPin={handlePin}
      onMute={handleMute}
      onDelete={handleDelete}
    />
  ), [colors, handleArchive, handlePin, handleMute, handleDelete]);

  const totalUnread = chats.reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          {searching ? (
            <>
              <TextInput
                ref={searchRef}
                style={[styles.searchInput, { color: '#FFFFFF' }]}
                placeholder="Search…"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
              <TouchableOpacity onPress={closeSearch} style={styles.cancelBtn}>
                <Text style={[textStyles.label, { color: '#FFFFFF' }]}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>HowFar</Text>
              <View style={styles.headerActions}>
                {totalUnread > 0 && (
                  <View style={[styles.unreadPill, { backgroundColor: colors.accentAmber }]}>
                    <Text style={styles.unreadPillText}>{totalUnread}</Text>
                  </View>
                )}
                <IconButton
                  name="camera-outline"
                  color="#FFFFFF"
                  onPress={() => router.push('/camera')}
                  accessibilityLabel="Open camera"
                />
                <IconButton
                  name="search-outline"
                  color="#FFFFFF"
                  onPress={openSearch}
                  accessibilityLabel="Search chats"
                />
                <IconButton
                  name="ellipsis-vertical"
                  color="#FFFFFF"
                  onPress={() => setShowOverflow(true)}
                  accessibilityLabel="More options"
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* ── Filter chips ── */}
      <View style={[styles.chipBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: 'transparent', borderColor: colors.border },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    textStyles.label,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Chat list ── */}
      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {/* Pinned system chats */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
              Pinned
            </Text>

            {/* Vault */}
            <Pressable
              style={[styles.systemRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
              onPress={() => router.push('/vault')}
            >
              <View style={[styles.systemAvatar, { backgroundColor: '#0B9E8E' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.systemMid}>
                <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Inter_500Medium' }]}>Vault</Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary }]}>Your private notes</Text>
              </View>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Xen */}
            <Pressable
              style={[styles.systemRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
              onPress={() => router.push('/xen')}
            >
              <View style={[styles.systemAvatar, { backgroundColor: '#6B3FA0' }]}>
                <Ionicons name="hardware-chip-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.systemMid}>
                <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Inter_500Medium' }]}>Xen</Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary }]}>AI Assistant · Xensiq</Text>
              </View>
            </Pressable>

            <Text style={[styles.sectionLabel, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
              All chats
            </Text>

            {archivedCount > 0 && (
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
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.border} />
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
              {query ? 'No results found' : 'No chats yet'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* ── Overflow menu ── */}
      <Modal visible={showOverflow} transparent animationType="fade" onRequestClose={() => setShowOverflow(false)}>
        <Pressable style={overflowStyles.backdrop} onPress={() => setShowOverflow(false)} />
        <View style={[overflowStyles.menu, { backgroundColor: colors.surface }]}>
          {[
            { label: 'New group',  action: () => { setShowOverflow(false); router.push('/new-group/select-members'); } },
            { label: 'Starred messages', action: () => { setShowOverflow(false); showComingSoon('Starred messages'); } },
            { label: 'Settings',   action: () => { setShowOverflow(false); router.push('/settings'); } },
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
        onPress={() => router.push('/new-chat')}
        activeOpacity={0.85}
      >
        <Ionicons name="create-outline" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { width: '100%' },
  headerInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 22, flex: 1, paddingLeft: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  cancelBtn: { paddingHorizontal: 12 },
  unreadPill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 4,
  },
  unreadPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  chipBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  systemAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemMid: { flex: 1 },
  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  archivedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
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

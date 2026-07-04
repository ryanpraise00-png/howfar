import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { mockContacts, type Contact } from '@/src/data/mockContacts';
import { searchUsers, createDirectChat, type ApiUser } from '@/src/services/chats';
import { showError, showComingSoon } from '@/src/lib/toast';

const QUICK_ACTIONS = [
  { id: 'group',     icon: 'people' as const,        label: 'New group' },
  { id: 'contact',   icon: 'person-add' as const,    label: 'New contact' },
  { id: 'community', icon: 'globe' as const,          label: 'New community' },
];

// Group contacts alphabetically into sections
function buildSections(contacts: (Contact | ApiUser)[]) {
  const map = new Map<string, (Contact | ApiUser)[]>();
  for (const c of contacts) {
    const letter = c.name[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(c);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

export default function NewChatScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const alphabet = useMemo(() => {
    const letters = new Set(mockContacts.map((c) => c.name[0].toUpperCase()));
    return Array.from(letters).sort();
  }, []);

  // Debounced API search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); return; }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(query.trim());
        setSearchResults(results);
      } catch {
        // server unreachable — fall back to local mock filter below
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  // When query is set: use API results (or local mock filter if API empty)
  const displayContacts: (Contact | ApiUser)[] = useMemo(() => {
    if (!query.trim()) return mockContacts;
    if (searchResults.length > 0) return searchResults;
    // local fallback
    return mockContacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, searchResults]);

  const sections = useMemo(() => buildSections(displayContacts), [displayContacts]);

  const handleContactTap = useCallback(async (item: Contact | ApiUser) => {
    // If item has a userId from the API, open/create a direct chat
    const userId = (item as ApiUser).id;
    if (!userId) {
      // local mock contact — just navigate using contact id as chatId
      router.push(`/chat/${item.id}`);
      return;
    }

    setOpening(userId);
    try {
      const { chat } = await createDirectChat(userId);
      router.push(`/chat/${chat.id}`);
    } catch (err: any) {
      showError('Could not open chat', err?.message);
      // fallback
      router.push(`/chat/${userId}`);
    } finally {
      setOpening(null);
    }
  }, []);

  const isOnline = (item: Contact | ApiUser): boolean =>
    'isOnline' in item ? (item as ApiUser).isOnline : (item as Contact).isOnline;

  const statusText = (item: Contact | ApiUser): string =>
    'about' in item ? (item as ApiUser).about : (item as Contact).statusText;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>New Chat</Text>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search name or number"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          ListHeaderComponent={
            !query ? (
              <View style={styles.quickActions}>
                {QUICK_ACTIONS.map((a) => (
                  <TouchableOpacity key={a.id} style={styles.quickRow} onPress={() => {
                    if (a.id === 'group') router.push('/new-group/select-members');
                    else if (a.id === 'contact') router.push('/new-contact');
                    else if (a.id === 'community') showComingSoon('Communities');
                  }}>
                    <View style={[styles.quickIcon, { backgroundColor: colors.primary }]}>
                      <Ionicons name={a.icon} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={[textStyles.body, { color: colors.textPrimary }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>
            ) : null
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.contactRow, { borderBottomColor: colors.border }]}
              onPress={() => handleContactTap(item)}
              android_ripple={{ color: colors.border }}
            >
              <Avatar name={item.name} size="md" onlineIndicator={isOnline(item)} />
              <View style={styles.contactInfo}>
                <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Sora_600SemiBold' }]}>
                  {item.name}
                </Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {statusText(item)}
                </Text>
              </View>
              {opening === item.id && <ActivityIndicator size="small" color={colors.primary} />}
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />

        {/* A–Z index strip (only when not searching) */}
        {!query && (
          <View style={styles.indexStrip} pointerEvents="box-none">
            {alphabet.map((l) => (
              <Text key={l} style={[styles.indexLetter, { color: colors.primary }]}>{l}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
    gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 0 },
  quickActions: { paddingTop: 8 },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 8, marginBottom: 4 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactInfo: { flex: 1 },
  indexStrip: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  indexLetter: { fontFamily: 'Inter_500Medium', fontSize: 11 },
});

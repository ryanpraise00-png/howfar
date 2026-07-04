import { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { mockContacts, type Contact } from '@/src/data/mockContacts';
import { searchUsers, addChatMembers, type ApiUser } from '@/src/services/chats';
import { showError, showSuccess } from '@/src/lib/toast';

function buildSections(contacts: (Contact | ApiUser)[]) {
  const map = new Map<string, (Contact | ApiUser)[]>();
  for (const c of contacts) {
    const letter = c.name[0]?.toUpperCase() ?? '#';
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(c);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

type SelectableUser = Contact | ApiUser;

export default function SelectMembersScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { chatId, mode } = useLocalSearchParams<{ chatId?: string; mode?: string }>();
  const isAddMode = mode === 'add' && !!chatId;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectableUser[]>([]);
  const [apiResults, setApiResults] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setApiResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try { setApiResults(await searchUsers(query.trim())); }
      catch { setApiResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  const displayContacts: SelectableUser[] = useMemo(() => {
    if (!query.trim()) return mockContacts;
    if (apiResults.length > 0) return apiResults;
    return mockContacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [query, apiResults]);

  const sections = useMemo(() => buildSections(displayContacts), [displayContacts]);

  const toggle = (contact: SelectableUser) => {
    setSelected((prev) =>
      prev.some((c) => c.id === contact.id)
        ? prev.filter((c) => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const isSelected = (id: string) => selected.some((c) => c.id === id);

  const handleNext = async () => {
    if (selected.length === 0) return;
    if (isAddMode) {
      setAdding(true);
      try {
        await addChatMembers(chatId!, selected.map((c) => c.id));
        showSuccess(`Added ${selected.length} participant${selected.length > 1 ? 's' : ''}`);
        router.back();
      } catch {
        showError('Could not add participants');
      } finally {
        setAdding(false);
      }
      return;
    }
    const ids = selected.map((c) => c.id).join(',');
    router.push(`/new-group/group-details?members=${ids}`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isAddMode ? 'Add Participants' : 'New Group'}</Text>
          <Text style={styles.headerSub}>
            {selected.length === 0
              ? 'Add participants'
              : `${selected.length} participant${selected.length > 1 ? 's' : ''} selected`}
          </Text>
        </View>
        {selected.length > 0 && (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.accentAmber }]}
            onPress={handleNext}
            disabled={adding}
          >
            {adding
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Ionicons name={isAddMode ? 'checkmark' : 'arrow-forward'} size={22} color="#FFFFFF" />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* ── Selected chips strip ── */}
      {selected.length > 0 && (
        <View style={[styles.chipsWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {selected.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                onPress={() => toggle(c)}
              >
                <Avatar name={c.name} size="sm" />
                <Text style={[styles.chipName, { color: colors.primary }]} numberOfLines={1}>
                  {c.name.split(' ')[0]}
                </Text>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Search bar ── */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search contacts"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
        {searching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Contact list ── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const sel = isSelected(item.id);
          return (
            <Pressable
              style={[styles.contactRow, { borderBottomColor: colors.border }]}
              onPress={() => toggle(item)}
              android_ripple={{ color: colors.border }}
            >
              <Avatar name={item.name} size="md" onlineIndicator={item.isOnline} />
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Sora_600SemiBold' }]}>
                  {item.name}
                </Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {'about' in item ? item.about : item.statusText}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                {
                  borderColor: sel ? colors.primary : colors.border,
                  backgroundColor: sel ? colors.primary : 'transparent',
                },
              ]}>
                {sel && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  nextBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },

  chipsWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  chips: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: 140,
  },
  chipName: { fontFamily: 'Inter_500Medium', fontSize: 13, flexShrink: 1 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 0 },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 4 },
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

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

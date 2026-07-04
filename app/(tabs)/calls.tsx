import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar, ChatRowSkeleton } from '@/src/components';
import { fetchCalls, type ApiCallRecord } from '@/src/services/calls';

// ─── call row ────────────────────────────────────────────────────────────────

function CallRow({ item, colors, textStyles }: { item: ApiCallRecord; colors: any; textStyles: any }) {
  const isMissed = item.direction === 'missed';
  const dirIcon = isMissed ? 'call-outline' : item.direction === 'incoming' ? 'arrow-down-outline' : 'arrow-up-outline';
  const dirColor = isMissed ? colors.error : colors.textSecondary;
  const nameColor = isMissed ? colors.error : colors.textPrimary;

  return (
    <Pressable
      style={[styles.callRow, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/call/${item.id}/info`)}
      android_ripple={{ color: colors.border }}
    >
      <Avatar name={item.name} size="md" />
      <View style={styles.callInfo}>
        <Text style={[styles.callName, { color: nameColor }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.callMeta}>
          <Ionicons name={dirIcon} size={14} color={dirColor} />
          <Text style={[textStyles.caption, { color: dirColor }]}>
            {item.direction.charAt(0).toUpperCase() + item.direction.slice(1)}
            {item.duration ? ` · ${item.duration}` : ''}
          </Text>
        </View>
      </View>
      <Text style={[styles.callTime, { color: colors.textSecondary }]}>{item.timestamp}</Text>
      <TouchableOpacity
        style={[styles.callTypeBtn, { borderColor: colors.border }]}
        onPress={() => router.push(`/call/${item.kind}/${item.contactId}`)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={item.kind === 'video' ? 'videocam-outline' : 'call-outline'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
    </Pressable>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function CallsScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [calls, setCalls] = useState<ApiCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => { loadCalls(); }, []);

  async function loadCalls() {
    try {
      const data = await fetchCalls();
      setCalls(data);
    } catch {
      // server unreachable — show empty state
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCalls();
    setRefreshing(false);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return calls;
    const q = query.toLowerCase();
    return calls.filter((c) => c.name.toLowerCase().includes(q));
  }, [calls, query]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Calls</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/new-chat')}>
            <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search calls"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Call list ── */}
      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => <ChatRowSkeleton key={i} colors={colors} />)}
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CallRow item={item} colors={colors} textStyles={textStyles} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="call-outline" size={52} color={colors.border} />
              <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 12 }]}>
                {query ? 'No results' : 'No recent calls'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accentAmber, bottom: insets.bottom + 72 }]}
        onPress={() => showComingSoon('New call')}
        activeOpacity={0.85}
        accessibilityLabel="New call"
      >
        <Ionicons name="call-outline" size={24} color="#FFFFFF" />
        <View style={[styles.fabPlus, { backgroundColor: colors.primaryDark }]}>
          <Ionicons name="add" size={12} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 10 },
  headerInner: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 20, color: '#FFFFFF', flex: 1 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 4,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: '#FFFFFF', paddingVertical: 0 },
  callRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  callInfo: { flex: 1 },
  callName: { fontFamily: 'Sora_600SemiBold', fontSize: 15, marginBottom: 3 },
  callMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  callTime: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  callTypeBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', marginTop: 80 },
  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabPlus: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
});

import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SectionList, RefreshControl,
} from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { IconButton } from '@/src/components';
import { useAuthStore } from '@/src/store/authStore';
import { useStatusStore } from '@/src/store/statusStore';
import {
  fetchStatusFeed,
  apiFeedToContactStatuses,
  type ApiFeedContact,
  type ApiStatusPost,
} from '@/src/services/status';
import { relativeTime, type ContactStatus } from '@/src/data/mockStatuses';

// ─── status ring ─────────────────────────────────────────────────────────────

function StatusRing({
  size,
  viewed,
  hasStatus,
  dashed,
  color,
}: {
  size: number;
  viewed?: boolean;
  hasStatus: boolean;
  dashed?: boolean;
  color: string;
}) {
  if (!hasStatus) {
    return (
      <View style={[ringStyles.outer, {
        width: size + 6, height: size + 6, borderRadius: (size + 6) / 2,
        borderWidth: 2, borderColor: color, borderStyle: 'dashed',
      }]} />
    );
  }
  return (
    <View style={[ringStyles.outer, {
      width: size + 6, height: size + 6, borderRadius: (size + 6) / 2,
      borderWidth: 2.5, borderColor: viewed ? '#9CA3AF' : color,
    }]} />
  );
}
const ringStyles = StyleSheet.create({ outer: { alignItems: 'center', justifyContent: 'center' } });

// ─── my status row ───────────────────────────────────────────────────────────

function MyStatusRow({
  myStatus,
  colors,
  textStyles,
}: {
  myStatus: ApiStatusPost[];
  colors: any;
  textStyles: any;
}) {
  const { displayName, avatarUri } = useAuthStore();
  const hasPosted = myStatus.length > 0;
  const name = displayName || 'My status';

  const handlePress = () => {
    if (hasPosted) {
      router.push('/status/me/viewer');
    } else {
      router.push('/status/composer');
    }
  };

  const latest = myStatus[myStatus.length - 1];

  return (
    <TouchableOpacity
      style={[styles.statusRow, { borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        <StatusRing size={48} hasStatus={hasPosted} dashed color={colors.accentAmber} />
        <View style={styles.avatarInner}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar48} contentFit="cover" />
          ) : (
            <View style={[styles.avatarFallback48, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarInitial, { color: '#FFFFFF' }]}>
                {(displayName || 'Y')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.plusBadge, { backgroundColor: colors.accentAmber }]}>
          <Ionicons name="add" size={12} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
          {hasPosted && latest ? relativeTime(new Date(latest.createdAt).getTime()) : 'Tap to add a moment'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.composeBtn, { borderColor: colors.border }]}
        onPress={() => router.push('/status/composer')}
      >
        <Ionicons name="pencil" size={18} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── contact status row ───────────────────────────────────────────────────────

function ContactStatusRow({
  item,
  colors,
  textStyles,
  onPress,
}: {
  item: ContactStatus & { avatarUri?: string };
  colors: any;
  textStyles: any;
  onPress: () => void;
}) {
  const latest = item.items[item.items.length - 1];
  const initial = item.name[0].toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.statusRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        <StatusRing size={48} hasStatus viewed={item.viewed} color={colors.accentAmber} />
        <View style={styles.avatarInner}>
          {(item as any).avatarUri ? (
            <Image source={{ uri: (item as any).avatarUri }} style={styles.avatar48} contentFit="cover" />
          ) : (
            <View style={[styles.avatarFallback48, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarInitial, { color: '#FFFFFF' }]}>{initial}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
          {latest ? relativeTime(latest.postedAt) : ''}
        </Text>
      </View>

      {latest?.kind === 'image' && latest.imageUri && (
        <Image source={{ uri: latest.imageUri }} style={styles.thumbPreview} contentFit="cover" />
      )}
      {latest?.kind === 'text' && (
        <View style={[styles.textThumb, { backgroundColor: latest.bgColor ?? colors.primary }]}>
          <Text style={[styles.textThumbLabel, { color: latest.textColor ?? '#FFF' }]} numberOfLines={2}>
            {latest.text}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function UpdatesScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { myStatus, feed, setFeed } = useStatusStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const data = await fetchStatusFeed();
      setFeed(data.myStatus, data.contacts);
    } catch {
      // fall back to whatever is in the store / empty
    }
  }, [setFeed]);

  useEffect(() => { loadFeed(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  // Convert api feed to ContactStatus shape (used by ContactStatusRow)
  const contactList = apiFeedToContactStatuses(feed) as (ContactStatus & { avatarUri?: string })[];

  const unviewed = contactList.filter((s) => !s.viewed);
  const viewed   = contactList.filter((s) => s.viewed);

  const sections = [
    ...(unviewed.length > 0 ? [{ title: 'Recent moments', data: unviewed }] : []),
    ...(viewed.length > 0   ? [{ title: 'Viewed moments',  data: viewed  }] : []),
  ];

  const handleContactPress = useCallback((cs: ContactStatus) => {
    router.push(`/status/${cs.contactId}/viewer`);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Moments</Text>
          <View style={styles.headerRight}>
            <IconButton name="search-outline" color="#FFFFFF" onPress={() => showComingSoon('Search')} accessibilityLabel="Search updates" />
            <IconButton name="ellipsis-vertical" color="#FFFFFF" onPress={() => showComingSoon()} accessibilityLabel="More options" />
          </View>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.contactId}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <MyStatusRow myStatus={myStatus} colors={colors} textStyles={textStyles} />
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ContactStatusRow
            item={item}
            colors={colors}
            textStyles={textStyles}
            onPress={() => handleContactPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="ellipse-outline" size={52} color={colors.border} />
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 12 }]}>
              No moments yet
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { width: '100%' },
  headerInner: {
    height: 56, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16,
  },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 20, color: '#FFFFFF', flex: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.6 },

  statusRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { position: 'absolute', width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatar48: { width: 48, height: 48 },
  avatarFallback48: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: 'Sora_700Bold', fontSize: 18 },

  plusBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },

  rowInfo: { flex: 1 },
  rowName: { fontFamily: 'Sora_600SemiBold', fontSize: 15, marginBottom: 2 },

  composeBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  thumbPreview: { width: 44, height: 54, borderRadius: 6 },
  textThumb: {
    width: 44, height: 54, borderRadius: 6,
    padding: 4, alignItems: 'center', justifyContent: 'center',
  },
  textThumbLabel: { fontFamily: 'Inter_500Medium', fontSize: 9, textAlign: 'center', lineHeight: 12 },

  emptyWrap: { alignItems: 'center', marginTop: 60 },
});

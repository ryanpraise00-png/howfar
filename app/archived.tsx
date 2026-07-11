import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, RefreshControl, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme';
import { ScreenHeader, EmptyState, ChatRowSkeleton } from '@/src/components';
import { SwipeableChatRow } from '@/src/components/SwipeableChatRow';
import { FlashList } from '@shopify/flash-list';
import { fetchChats, apiChatToItem, unarchiveChat, deleteChat } from '@/src/services/chats';
import type { ChatItem } from '@/src/data/mockChats';
import { showError } from '@/src/lib/toast';

function AnimatedRow({ item, index, colors, onPress, onArchive, onDelete }: {
  item: ChatItem; index: number; colors: any;
  onPress: () => void; onArchive: (id: string) => void; onDelete: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <SwipeableChatRow
        chat={item}
        colors={colors}
        onPress={onPress}
        onArchive={onArchive}
        archiveLabel="Unarchive"
        onDelete={onDelete}
      />
    </Animated.View>
  );
}

export default function ArchivedScreen() {
  const { colors } = useTheme();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadArchived(); }, []);

  async function loadArchived() {
    try {
      const data = await fetchChats(true);
      setChats(data.map(apiChatToItem));
    } catch {
      // server unreachable — stay empty
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArchived();
    setRefreshing(false);
  }, []);

  const handleUnarchive = useCallback(async (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    try { await unarchiveChat(id); } catch { showError('Failed to unarchive'); }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    try { await deleteChat(id); } catch {}
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Archived" variant="navy" colors={colors} />

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => <ChatRowSkeleton key={i} colors={colors} />)}
        </View>
      ) : chats.length === 0 ? (
        <EmptyState
          icon="archive-outline"
          title="No archived chats"
          subtitle="Chats you archive will appear here."
          colors={colors}
        />
      ) : (
        <FlashList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedRow
              item={item}
              index={index}
              colors={colors}
              onPress={() => router.push(`/chat/${item.id}`)}
              onArchive={handleUnarchive}
              onDelete={handleDelete}
            />
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

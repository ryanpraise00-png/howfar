import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader, EmptyState } from '@/src/components';
import { getArchivedChats } from '@/src/data/mockChats';
import { FlashList } from '@shopify/flash-list';
import { ChatRow } from '@/src/components';

export default function ArchivedScreen() {
  const { colors } = useTheme();
  const archived = getArchivedChats();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Archived" variant="teal" colors={colors} />
      {archived.length === 0 ? (
        <EmptyState
          icon="archive-outline"
          title="No archived chats"
          subtitle="Chats you archive will appear here."
          colors={colors}
        />
      ) : (
        <FlashList
          data={archived}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatRow
              name={item.name}
              lastMessage={item.lastMessage}
              timestamp={item.timestamp}
              unreadCount={item.unreadCount}
              isPinned={item.isPinned}
              isMuted={item.isMuted}
              onPress={() => {}}
              colors={colors}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

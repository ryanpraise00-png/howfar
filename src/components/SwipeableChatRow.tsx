import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ChatRow } from './ChatRow';
import type { AppColors } from '@/src/theme/colors';
import type { ChatItem } from '@/src/data/mockChats';

interface Props {
  chat: ChatItem;
  colors: AppColors;
  onPress: () => void;
  onArchive: (id: string) => void;
  archiveLabel?: string;
  onPin?: (id: string) => void;
  onMute?: (id: string) => void;
  onDelete: (id: string) => void;
}

function ActionBtn({
  icon,
  label,
  bg,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.action, { backgroundColor: bg }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SwipeableChatRow({ chat, colors, onPress, onArchive, archiveLabel, onPin, onMute, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const close = () => swipeRef.current?.close();

  const renderLeft = () => (
    <View style={styles.leftActions}>
      <ActionBtn
        icon="archive-outline"
        label={archiveLabel ?? 'Archive'}
        bg="#6B7280"
        onPress={() => { close(); onArchive(chat.id); }}
      />
      {onPin && (
        <ActionBtn
          icon={chat.isPinned ? 'pin' : 'pin-outline'}
          label={chat.isPinned ? 'Unpin' : 'Pin'}
          bg={colors.primary}
          onPress={() => { close(); onPin(chat.id); }}
        />
      )}
    </View>
  );

  const renderRight = () => (
    <View style={styles.rightActions}>
      {onMute && (
        <ActionBtn
          icon={chat.isMuted ? 'volume-medium-outline' : 'volume-mute-outline'}
          label={chat.isMuted ? 'Unmute' : 'Mute'}
          bg={colors.accentTeal}
          onPress={() => { close(); onMute(chat.id); }}
        />
      )}
      <ActionBtn
        icon="trash-outline"
        label="Delete"
        bg={colors.error}
        onPress={() => {
          close();
          Alert.alert('Delete chat', `Delete conversation with ${chat.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(chat.id) },
          ]);
        }}
      />
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeft}
      renderRightActions={renderRight}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
    >
      <ChatRow
        name={chat.name}
        lastMessage={chat.lastMessage}
        timestamp={chat.timestamp}
        unreadCount={chat.unreadCount}
        isPinned={chat.isPinned}
        isMuted={chat.isMuted}
        onPress={onPress}
        colors={colors}
      />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftActions: { flexDirection: 'row' },
  rightActions: { flexDirection: 'row' },
  action: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
});

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { lightColors } from '@/src/theme';
import type { AppColors } from '@/src/theme/colors';

interface ChatRowProps {
  avatarUri?: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  onPress: () => void;
  colors?: AppColors;
}

export function ChatRow({
  avatarUri,
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isPinned = false,
  isMuted = false,
  onPress,
  colors = lightColors,
}: ChatRowProps) {
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      <Avatar uri={avatarUri} name={name} size="md" />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, { color: hasUnread ? colors.primary : colors.textSecondary }]}>
            {timestamp}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[styles.preview, { color: hasUnread ? colors.textPrimary : colors.textSecondary }]}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          <View style={styles.meta}>
            {isMuted && <Ionicons name="volume-mute" size={14} color={colors.textSecondary} />}
            {isPinned && !hasUnread && <Ionicons name="pin" size={14} color={colors.textSecondary} />}
            {hasUnread ? <Badge count={unreadCount} /> : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  body: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: 'Sora_600SemiBold', fontSize: 15, flex: 1, marginRight: 8 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  preview: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1, marginRight: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

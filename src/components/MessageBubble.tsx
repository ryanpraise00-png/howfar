import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { lightColors } from '@/src/theme';
import type { AppColors } from '@/src/theme/colors';

type MessageType = 'text' | 'image' | 'voice' | 'document' | 'location';
type MessageStatus = 'sent' | 'delivered' | 'read';

interface ReplyTo {
  name: string;
  text: string;
}

interface MessageBubbleProps {
  text?: string;
  imageUri?: string;
  type?: MessageType;
  isOutgoing: boolean;
  status: MessageStatus;
  timestamp: string;
  replyTo?: ReplyTo;
  reactions?: string[];
  colors?: AppColors;
}

const STATUS_ICONS: Record<MessageStatus, React.ComponentProps<typeof Ionicons>['name']> = {
  sent: 'checkmark',
  delivered: 'checkmark-done',
  read: 'checkmark-done',
};

export function MessageBubble({
  text,
  imageUri,
  type = 'text',
  isOutgoing,
  status,
  timestamp,
  replyTo,
  reactions,
  colors = lightColors,
}: MessageBubbleProps) {
  const bg = isOutgoing ? colors.bubbleSent : colors.bubbleIncoming;
  const textColor = isOutgoing ? '#FFFFFF' : colors.textPrimary;
  const metaColor = isOutgoing ? 'rgba(255,255,255,0.7)' : colors.textSecondary;
  const tickColor = status === 'read' ? colors.accentTeal : metaColor;

  return (
    <View style={[styles.wrapper, isOutgoing ? styles.outgoing : styles.incoming]}>
      {/* Reactions above bubble */}
      {reactions && reactions.length > 0 && (
        <View style={[styles.reactions, isOutgoing ? styles.reactionsRight : styles.reactionsLeft]}>
          {reactions.map((r, i) => (
            <Text key={i} style={styles.reactionEmoji}>{r}</Text>
          ))}
        </View>
      )}

      <View
        style={[
          styles.bubble,
          { backgroundColor: bg },
          isOutgoing ? styles.bubbleOut : styles.bubbleIn,
        ]}
      >
        {/* Reply preview */}
        {replyTo && (
          <View style={[styles.replyBar, { borderLeftColor: colors.accentTeal }]}>
            <Text style={[styles.replyName, { color: colors.accentTeal }]}>{replyTo.name}</Text>
            <Text style={[styles.replyText, { color: metaColor }]} numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
        )}

        {/* Image */}
        {type === 'image' && imageUri && (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
        )}

        {/* Voice */}
        {type === 'voice' && (
          <View style={styles.voiceRow}>
            <Ionicons name="mic" size={18} color={textColor} />
            <View style={[styles.waveform, { backgroundColor: isOutgoing ? 'rgba(255,255,255,0.3)' : colors.border }]} />
          </View>
        )}

        {/* Document */}
        {type === 'document' && (
          <View style={styles.docRow}>
            <Ionicons name="document-text" size={22} color={textColor} />
            <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>{text ?? 'Document'}</Text>
          </View>
        )}

        {/* Location */}
        {type === 'location' && (
          <View style={styles.docRow}>
            <Ionicons name="location" size={22} color={textColor} />
            <Text style={[styles.docName, { color: textColor }]}>{text ?? 'Location'}</Text>
          </View>
        )}

        {/* Text */}
        {(type === 'text' || (type === 'image' && text)) && (
          <Text style={[styles.text, { color: textColor }]}>{text}</Text>
        )}

        {/* Meta row */}
        <View style={[styles.meta, isOutgoing ? styles.metaRight : styles.metaLeft]}>
          <Text style={[styles.time, { color: metaColor }]}>{timestamp}</Text>
          {isOutgoing && (
            <Ionicons name={STATUS_ICONS[status]} size={14} color={tickColor} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 8, marginVertical: 2, maxWidth: '80%' },
  outgoing: { alignSelf: 'flex-end' },
  incoming: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: 18,
    padding: 10,
    minWidth: 80,
  },
  bubbleOut: { borderBottomRightRadius: 4 },
  bubbleIn: { borderBottomLeftRadius: 4 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  image: { width: 200, height: 140, borderRadius: 10, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  metaRight: { justifyContent: 'flex-end' },
  metaLeft: { justifyContent: 'flex-start' },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  replyBar: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 6,
    gap: 2,
  },
  replyName: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  replyText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  reactions: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  reactionsLeft: { justifyContent: 'flex-start' },
  reactionsRight: { justifyContent: 'flex-end' },
  reactionEmoji: { fontSize: 16 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  waveform: { flex: 1, height: 24, borderRadius: 4 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docName: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1 },
});

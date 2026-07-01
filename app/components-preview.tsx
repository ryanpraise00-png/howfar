import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/src/theme';
import {
  Avatar,
  Badge,
  ChatRow,
  MessageBubble,
  Input,
  IconButton,
  SectionHeader,
  EmptyState,
  ScreenHeader,
} from '@/src/components';
import { Ionicons } from '@expo/vector-icons';

export default function ComponentsPreview() {
  const { colors, textStyles, spacing } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Components Preview"
        subtitle="Section 2 — Design System"
        variant="teal"
        colors={colors}
        rightSlot={
          <IconButton name="ellipsis-vertical" color="#FFFFFF" onPress={() => Alert.alert('Menu')} />
        }
      />

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

        {/* ── Avatars ── */}
        <SectionHeader label="Avatars" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Avatar name="Ryan Praise" size="sm" />
            <Avatar name="Amara Osei" size="md" onlineIndicator />
            <Avatar name="Chidi Nwosu" size="lg" onlineIndicator />
            <Avatar
              uri="https://i.pravatar.cc/150?img=5"
              name="Photo User"
              size="md"
              onlineIndicator
            />
          </View>
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            sm / md (online) / lg (online) / photo
          </Text>
        </View>

        {/* ── Badges ── */}
        <SectionHeader label="Badges" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Badge count={1} />
            <Badge count={9} />
            <Badge count={42} />
            <Badge count={100} />
            <Badge count={200} max={99} />
          </View>
        </View>

        {/* ── IconButtons ── */}
        <SectionHeader label="Icon Buttons" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <IconButton name="mic" color={colors.primary} onPress={() => {}} />
            <IconButton name="send" color="#FFFFFF" backgroundColor={colors.primary} onPress={() => {}} />
            <IconButton name="camera" color={colors.primary} onPress={() => {}} />
            <IconButton name="attach" color="#FFFFFF" backgroundColor={colors.accentAmber} onPress={() => {}} />
            <IconButton name="search" color={colors.textSecondary} onPress={() => {}} />
          </View>
        </View>

        {/* ── Input.Pill ── */}
        <SectionHeader label="Input — Pill" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.surface, gap: spacing.sm }]}>
          <Input.Pill
            placeholder="Message…"
            colors={colors}
            leftSlot={<Ionicons name="happy-outline" size={20} color={colors.textSecondary} />}
            rightSlot={<Ionicons name="mic" size={20} color={colors.primary} />}
          />
          <Input.Pill
            placeholder="Search conversations"
            colors={colors}
            leftSlot={<Ionicons name="search" size={16} color={colors.textSecondary} />}
          />
        </View>

        {/* ── Chat Rows ── */}
        <SectionHeader label="Chat Rows" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={{ gap: 1 }}>
          <ChatRow
            name="Amara Osei"
            lastMessage="Are you home yet? We've been waiting! 🎉"
            timestamp="9:41 AM"
            unreadCount={3}
            onPress={() => {}}
            colors={colors}
          />
          <ChatRow
            name="HowFar Team"
            lastMessage="Ryan: Just pushed the new build 🚀"
            timestamp="Yesterday"
            isPinned
            onPress={() => {}}
            colors={colors}
          />
          <ChatRow
            name="Chidi Nwosu"
            lastMessage="Voice message · 0:42"
            timestamp="Mon"
            isMuted
            onPress={() => {}}
            colors={colors}
          />
          <ChatRow
            name="Sophia Mensah"
            lastMessage="Okay, see you there!"
            timestamp="Sun"
            unreadCount={124}
            onPress={() => {}}
            colors={colors}
          />
        </View>

        {/* ── Message Bubbles ── */}
        <SectionHeader label="Message Bubbles" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.bubblesCard, { backgroundColor: colors.bubbleIncoming }]}>
          <MessageBubble
            text="Hey! How far are you from the venue?"
            type="text"
            isOutgoing={false}
            status="delivered"
            timestamp="9:40 AM"
            colors={colors}
          />
          <MessageBubble
            text="About 10 minutes away, just left the house 🚗"
            type="text"
            isOutgoing
            status="read"
            timestamp="9:41 AM"
            reactions={['👍', '🎉']}
            colors={colors}
          />
          <MessageBubble
            text="Perfect! We'll hold the door 😄"
            type="text"
            isOutgoing={false}
            status="delivered"
            timestamp="9:42 AM"
            replyTo={{ name: 'Ryan', text: 'About 10 minutes away…' }}
            colors={colors}
          />
          <MessageBubble
            type="voice"
            isOutgoing
            status="delivered"
            timestamp="9:43 AM"
            colors={colors}
          />
          <MessageBubble
            text="Location"
            type="location"
            isOutgoing={false}
            status="sent"
            timestamp="9:44 AM"
            colors={colors}
          />
        </View>

        {/* ── Screen Headers ── */}
        <SectionHeader label="Screen Headers" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.surface, gap: spacing.sm, padding: 0, overflow: 'hidden' }]}>
          <ScreenHeader
            title="Amara Osei"
            subtitle="online"
            variant="teal"
            colors={colors}
            rightSlot={
              <View style={{ flexDirection: 'row' }}>
                <IconButton name="videocam-outline" color="#FFFFFF" />
                <IconButton name="call-outline" color="#FFFFFF" />
              </View>
            }
          />
          <View style={{ height: 8 }} />
          <ScreenHeader
            title="Settings"
            variant="white"
            colors={colors}
            rightSlot={<IconButton name="create-outline" color={colors.primary} />}
          />
        </View>

        {/* ── Empty States ── */}
        <SectionHeader label="Empty States" color={colors.textSecondary} backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.surface, minHeight: 280 }]}>
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            subtitle="Start chatting with friends and family — they'll appear here."
            ctaLabel="Start a Chat"
            onCta={() => Alert.alert('Start Chat')}
            colors={colors}
          />
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2, paddingBottom: 48 },
  card: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  bubblesCard: { padding: 8, gap: 4 },
});

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { getCallById } from '@/src/data/mockCalls';

export default function CallInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const call = getCallById(id ?? '');

  if (!call) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>Call not found.</Text>
        </View>
      </View>
    );
  }

  const isMissed = call.direction === 'missed';

  const dirLabel =
    call.direction === 'incoming' ? 'Incoming'
    : call.direction === 'outgoing' ? 'Outgoing'
    : 'Missed';

  const dirIcon: React.ComponentProps<typeof Ionicons>['name'] =
    isMissed ? 'call-outline'
    : call.direction === 'incoming' ? 'arrow-down-outline'
    : 'arrow-up-outline';

  const kindLabel = call.kind === 'video' ? 'Video call' : 'Voice call';
  const kindIcon: React.ComponentProps<typeof Ionicons>['name'] =
    call.kind === 'video' ? 'videocam-outline' : 'call-outline';

  const labelColor = isMissed ? colors.error : colors.textSecondary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call info</Text>
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Avatar name={call.name} size="lg" />
        <Text style={[styles.name, { color: colors.textPrimary }]}>{call.name}</Text>

        {/* Direction + kind badge */}
        <View style={styles.badgeRow}>
          <Ionicons name={dirIcon} size={15} color={labelColor} />
          <Ionicons name={kindIcon} size={15} color={labelColor} />
          <Text style={[styles.badgeText, { color: labelColor }]}>
            {dirLabel} {kindLabel}
          </Text>
        </View>

        <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          {call.timestamp}
          {call.duration ? `  ·  ${call.duration}` : '  ·  Not answered'}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={[styles.actionsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/call/${call.kind}/${call.contactId}`)}
        >
          <Ionicons name={kindIcon} size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Call again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          onPress={() => router.push(`/chat/${call.contactId}`)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* More from contact */}
      <TouchableOpacity
        style={[styles.contactRow, { borderBottomColor: colors.border }]}
        onPress={() => router.push(`/contact/${call.contactId}/info`)}
      >
        <Ionicons name="person-outline" size={20} color={colors.primary} />
        <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>View contact info</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 10, gap: 4,
  },
  back: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },

  hero: {
    alignItems: 'center', paddingVertical: 28,
    paddingHorizontal: 20, marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { fontFamily: 'Sora_700Bold', fontSize: 22, marginTop: 14 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  badgeText: { fontFamily: 'Inter_400Regular', fontSize: 14 },

  actionsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12,
    borderRadius: 12, gap: 8,
  },
  actionBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: '#FFFFFF' },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    gap: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

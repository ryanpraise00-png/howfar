import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { getGroupChat, type GroupMember } from '@/src/data/mockGroups';

// Palette for member color coding (same as conversation screen)
const SENDER_COLORS = ['#14213D', '#3D5AFE', '#5856D6', '#FF6B35', '#FF2D55', '#FF9500', '#34C759'];
function senderColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SENDER_COLORS[h % SENDER_COLORS.length];
}

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const group = getGroupChat(id ?? '');

  // Mock: current user is admin if the group has them as admin
  const isAdmin = group?.members.find((m) => m.contactId === 'me')?.isAdmin ?? false;

  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group?.name ?? '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(group?.description ?? '');

  if (!group) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>Group not found.</Text>
        </View>
      </View>
    );
  }

  const handleExitGroup = () => {
    Alert.alert(
      'Exit group?',
      `You will no longer receive messages from "${group.name}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.replace('/(tabs)') },
      ]
    );
  };

  const SETTINGS_ROWS = [
    { icon: 'timer-outline' as const,   label: 'Disappearing messages', value: 'Off' },
    { icon: 'megaphone-outline' as const, label: 'Who can send messages', value: 'All members' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Info</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.surface }]}>
          {group.groupPhotoUri ? (
            <Image source={{ uri: group.groupPhotoUri }} style={styles.groupPhoto} contentFit="cover" />
          ) : (
            <View style={[styles.groupPhotoFallback, { backgroundColor: colors.primary }]}>
              <Ionicons name="people" size={52} color="#FFFFFF" />
            </View>
          )}

          {/* Group name */}
          {editingName && isAdmin ? (
            <View style={[styles.editRow, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.editInput, { color: colors.textPrimary }]}
                value={groupName}
                onChangeText={setGroupName}
                autoFocus
                maxLength={100}
              />
              <TouchableOpacity onPress={() => setEditingName(false)}>
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => isAdmin && setEditingName(true)}
              activeOpacity={isAdmin ? 0.6 : 1}
            >
              <Text style={[styles.groupName, { color: colors.textPrimary }]}>{groupName}</Text>
              {isAdmin && <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />}
            </TouchableOpacity>
          )}

          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
            Group · {group.members.length} members
          </Text>

          {/* Description */}
          <View style={styles.descWrap}>
            {editingDesc && isAdmin ? (
              <View style={[styles.editRow, { borderColor: colors.border, marginTop: 8 }]}>
                <TextInput
                  style={[styles.editInput, { color: colors.textPrimary, flex: 1 }]}
                  value={description}
                  onChangeText={setDescription}
                  autoFocus
                  multiline
                  maxLength={500}
                  placeholder="Add group description"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => setEditingDesc(false)}>
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => isAdmin && setEditingDesc(true)}
                activeOpacity={isAdmin ? 0.6 : 1}
              >
                <Text style={[textStyles.body, { color: description ? colors.textPrimary : colors.textSecondary, textAlign: 'center', marginTop: 6 }]}>
                  {description || (isAdmin ? 'Add group description' : '')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Media row ── */}
        <TouchableOpacity
          style={[styles.card, styles.mediaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => showComingSoon('Media, links & docs')}
        >
          <View style={styles.mediaThumbs}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.mediaThumb, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.body, { color: colors.textPrimary }]}>Media, links and docs</Text>
            <Text style={[textStyles.caption, { color: colors.textSecondary }]}>14 items</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* ── Members ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {group.members.length} PARTICIPANTS
          </Text>

          {/* Add participants */}
          <TouchableOpacity
            style={[styles.addRow, { borderBottomColor: colors.border }]}
            onPress={() => showComingSoon('Add participants')}
          >
            <View style={[styles.addIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </View>
            <Text style={[textStyles.body, { color: colors.primary }]}>Add participants</Text>
          </TouchableOpacity>

          {group.members.map((member, i) => (
            <MemberRow
              key={member.contactId}
              member={member}
              colors={colors}
              textStyles={textStyles}
              isLast={i === group.members.length - 1}
              color={senderColor(member.contactId)}
            />
          ))}
        </View>

        {/* ── Settings ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GROUP SETTINGS</Text>
          {SETTINGS_ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.settingsRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
              onPress={() => showComingSoon(row.label)}
            >
              <Ionicons name={row.icon} size={20} color={colors.primary} />
              <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>{row.label}</Text>
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{row.value}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Exit group ── */}
        <TouchableOpacity
          style={[styles.exitBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleExitGroup}
        >
          <Ionicons name="exit-outline" size={22} color={colors.error} />
          <Text style={[textStyles.body, { color: colors.error }]}>Exit group</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function MemberRow({
  member,
  colors,
  textStyles,
  isLast,
  color,
}: {
  member: GroupMember;
  colors: any;
  textStyles: any;
  isLast: boolean;
  color: string;
}) {
  const name = member.contactId === 'me' ? 'You' : member.name;
  return (
    <TouchableOpacity
      style={[
        styles.memberRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      onPress={() =>
        member.contactId !== 'me' &&
        router.push(`/contact/${member.contactId}/info`)
      }
    >
      <Avatar name={name} size="md" />
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Sora_600SemiBold' }]}>
          {name}
        </Text>
        {member.isAdmin && (
          <Text style={[textStyles.caption, { color }]}>Group admin</Text>
        )}
      </View>
      {member.isAdmin && (
        <View style={[styles.adminBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
          <Text style={[styles.adminText, { color }]}>Admin</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: undefined,
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 4,
  },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },

  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  groupPhoto: { width: 110, height: 110, borderRadius: 55, marginBottom: 14 },
  groupPhotoFallback: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  groupName: { fontFamily: 'Sora_700Bold', fontSize: 22 },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    width: '100%',
    marginBottom: 4,
  },
  editInput: { fontFamily: 'Inter_400Regular', fontSize: 16, flex: 1 },
  descWrap: { width: '100%', alignItems: 'center', marginTop: 4, paddingHorizontal: 8 },

  card: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  mediaCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  mediaThumbs: { flexDirection: 'row', gap: 4 },
  mediaThumb: {
    width: 44, height: 44, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminText: { fontFamily: 'Inter_500Medium', fontSize: 11 },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
});

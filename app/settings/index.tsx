import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';
import { useAuthStore } from '@/src/store/authStore';
import { Avatar } from '@/src/components';

const SETTINGS_ROWS = [
  { icon: 'key-outline' as const,          iconBg: '#5856D6', label: 'Account',          route: '/settings/account' },
  { icon: 'lock-closed-outline' as const,  iconBg: '#FF6B35', label: 'Privacy',           route: '/settings/privacy' },
  { icon: 'chatbubble-outline' as const,   iconBg: '#34C759', label: 'Chats',             route: '/settings/chats' },
  { icon: 'notifications-outline' as const,iconBg: '#FF9500', label: 'Notifications',     route: '/settings/notifications' },
  { icon: 'server-outline' as const,       iconBg: '#007AFF', label: 'Storage',  route: '/settings/storage' },
  { icon: 'help-circle-outline' as const,  iconBg: '#6B7280', label: 'Help',              route: '/settings/help' },
  { icon: 'share-social-outline' as const, iconBg: '#FF2D55', label: 'Invite a Friend',   route: null },
] as const;

export default function SettingsScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const { displayName, about, avatarUri } = useAuthStore();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Profile row */}
        <TouchableOpacity
          style={[styles.profileRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          onPress={() => router.push('/settings/profile-edit')}
          activeOpacity={0.7}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatar} contentFit="cover" />
          ) : (
            <Avatar name={displayName || 'You'} size="lg" />
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {displayName || 'Your Name'}
            </Text>
            <Text style={[textStyles.body, { color: colors.textSecondary }]} numberOfLines={1}>
              {about || "Hey! I'm on HowFar"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Settings list */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SETTINGS_ROWS.map((row, i) => (
            <SettingsRow
              key={row.label}
              icon={row.icon}
              iconBg={row.iconBg}
              label={row.label}
              colors={colors}
              onPress={() => {
                if (row.route) {
                  router.push(row.route as any);
                } else {
                  Share.share({ message: 'Join me on HowFar — the fast, private messenger. Download at https://howfar.app', title: 'Join me on HowFar' });
                }
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    height: undefined, paddingHorizontal: 8, paddingBottom: 10, gap: 4,
  },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },

  profileRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 14, marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Sora_700Bold', fontSize: 17, marginBottom: 2 },

  card: { marginHorizontal: 0 },
});

import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch,
} from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';
import { mockContacts } from '@/src/data/mockContacts';

export default function ContactInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const contact = mockContacts.find((c) => c.id === id);
  const [muted, setMuted] = useState(false);

  if (!contact) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>Contact not found.</Text>
        </View>
      </View>
    );
  }

  const initial = contact.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surface }]}>
          {contact.avatarUri ? (
            <Image source={{ uri: contact.avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitials}>{initial}</Text>
            </View>
          )}
          <Text style={[styles.name, { color: colors.textPrimary }]}>{contact.name}</Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
            {contact.phone}
          </Text>

          {/* Quick action buttons */}
          <View style={styles.quickActions}>
            {[
              { icon: 'chatbubble-outline' as const,  label: 'Message', action: () => router.push(`/chat/${contact.id}`) },
              { icon: 'call-outline' as const,         label: 'Voice',   action: () => router.push(`/call/voice/${contact.id}`) },
              { icon: 'videocam-outline' as const,     label: 'Video',   action: () => router.push(`/call/video/${contact.id}`) },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.action}>
                <View style={[styles.quickIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name={a.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[textStyles.caption, { color: colors.primary, marginTop: 4 }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {contact.statusText && (
            <View style={[styles.statusBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>ABOUT</Text>
              <Text style={[textStyles.body, { color: colors.textPrimary, marginTop: 4 }]}>{contact.statusText}</Text>
            </View>
          )}
        </View>

        {/* Media */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            label="Media, links and docs"
            value="14"
            icon="images-outline"
            iconBg="#FF9500"
            colors={colors}
            onPress={() => showComingSoon('Media, links and docs')}
          />
        </View>

        {/* Chat settings */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} style={styles.toggleIcon} />
            <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>Mute notifications</Text>
            <Switch
              value={muted}
              onValueChange={setMuted}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <SettingsRow
            label="Disappearing messages"
            value="Off"
            icon="timer-outline"
            iconBg="#34C759"
            colors={colors}
            onPress={() => showComingSoon('Disappearing messages')}
          />
          <SettingsRow
            label="Encryption"
            value="Tap to view"
            icon="lock-closed-outline"
            iconBg="#5856D6"
            colors={colors}
            onPress={() => showComingSoon('Encryption QR code')}
          />
        </View>

        {/* Danger zone */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
          <SettingsRow
            label={`Block ${contact.name.split(' ')[0]}`}
            icon="ban-outline"
            danger
            showChevron={false}
            colors={colors}
            onPress={() => Alert.alert(
              `Block ${contact.name}?`,
              'They will not be able to call you or send you messages.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Block', style: 'destructive', onPress: () => showComingSoon('Blocking') },
              ]
            )}
          />
          <SettingsRow
            label={`Report ${contact.name.split(' ')[0]}`}
            icon="flag-outline"
            danger
            showChevron={false}
            colors={colors}
            onPress={() => Alert.alert(
              `Report ${contact.name}?`,
              'The last 5 messages will be shared with HowFar.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Report', style: 'destructive', onPress: () => showComingSoon('Reporting') },
              ]
            )}
          />
        </View>
      </ScrollView>
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
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },

  hero: {
    alignItems: 'center', paddingVertical: 28,
    paddingHorizontal: 20, marginBottom: 12,
  },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 14 },
  avatarFallback: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarInitials: { fontFamily: 'Sora_700Bold', fontSize: 38, color: '#FFFFFF' },
  name: { fontFamily: 'Sora_700Bold', fontSize: 22 },

  quickActions: { flexDirection: 'row', gap: 24, marginTop: 20 },
  quickBtn: { alignItems: 'center' },
  quickIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },

  statusBox: {
    width: '100%', marginTop: 16,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },

  card: { marginHorizontal: 0, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 14,
  },
  toggleIcon: { width: 34, textAlign: 'center' },
});

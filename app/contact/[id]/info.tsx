import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, Modal, Pressable,
} from 'react-native';
import { showError, showSuccess } from '@/src/lib/toast';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';
import { mockContacts } from '@/src/data/mockContacts';
import { updateChatSettings, blockUser, reportUser } from '@/src/services/chats';

const DISAPPEARING_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
  { label: '90 days', value: 7776000 },
];

const REPORT_REASONS = [
  'Spam',
  'Inappropriate content',
  'Harassment or bullying',
  'Scam or fraud',
  'Other',
];

export default function ContactInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const contact = mockContacts.find((c) => c.id === id);
  const [muted, setMuted] = useState(false);
  const [disappearingTtl, setDisappearingTtl] = useState(0);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  const disappearingLabel = DISAPPEARING_OPTIONS.find((o) => o.value === disappearingTtl)?.label ?? 'Off';

  async function handleSetDisappearing(value: number) {
    setDisappearingTtl(value);
    setShowDisappearing(false);
    try {
      await updateChatSettings(id, { disappearingMsgTtl: value });
      showSuccess('Disappearing messages updated');
    } catch {
      showError('Could not update setting');
    }
  }

  async function handleBlock() {
    if (!contact) return;
    Alert.alert(
      `Block ${contact.name}?`,
      'They will not be able to call you or send you messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block', style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(id);
              showSuccess(`${contact.name.split(' ')[0]} blocked`);
            } catch {
              showError('Could not block user');
            }
          },
        },
      ],
    );
  }

  async function handleReport(reason: string) {
    if (!contact) return;
    setShowReport(false);
    try {
      await reportUser(id, reason);
      showSuccess('Report submitted');
    } catch {
      showError('Could not submit report');
    }
  }

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

          <View style={styles.quickActions}>
            {[
              { icon: 'chatbubble-outline' as const, label: 'Message', action: () => router.push(`/chat/${contact.id}`) },
              { icon: 'call-outline' as const,        label: 'Voice',   action: () => router.push(`/call/voice/${contact.id}`) },
              { icon: 'videocam-outline' as const,    label: 'Video',   action: () => router.push(`/call/video/${contact.id}`) },
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
            onPress={() => router.push(`/chat/${id}/media`)}
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
            value={disappearingLabel}
            icon="timer-outline"
            iconBg="#34C759"
            colors={colors}
            onPress={() => setShowDisappearing(true)}
          />
          <SettingsRow
            label="Encryption"
            value="Tap to view"
            icon="lock-closed-outline"
            iconBg="#5856D6"
            colors={colors}
            onPress={() => router.push(`/contact/${id}/encryption`)}
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
            onPress={handleBlock}
          />
          <SettingsRow
            label={`Report ${contact.name.split(' ')[0]}`}
            icon="flag-outline"
            danger
            showChevron={false}
            colors={colors}
            onPress={() => setShowReport(true)}
          />
        </View>
      </ScrollView>

      {/* Disappearing messages modal */}
      <Modal visible={showDisappearing} transparent animationType="slide" onRequestClose={() => setShowDisappearing(false)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setShowDisappearing(false)} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[modalStyles.title, { color: colors.textPrimary }]}>Disappearing Messages</Text>
          {DISAPPEARING_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[modalStyles.option, { borderBottomColor: colors.border }]}
              onPress={() => handleSetDisappearing(opt.value)}
            >
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>{opt.label}</Text>
              {disappearingTtl === opt.value && (
                <Ionicons name="checkmark" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Report modal */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setShowReport(false)} />
        <View style={[modalStyles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[modalStyles.title, { color: colors.textPrimary }]}>Report {contact.name.split(' ')[0]}</Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginBottom: 12, paddingHorizontal: 20 }]}>
            The last 5 messages will be shared with HowFar.
          </Text>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[modalStyles.option, { borderBottomColor: colors.border }]}
              onPress={() => handleReport(reason)}
            >
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>{reason}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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
  hero: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, marginBottom: 12 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 14 },
  avatarFallback: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarInitials: { fontFamily: 'Sora_700Bold', fontSize: 38, color: '#FFFFFF' },
  name: { fontFamily: 'Sora_700Bold', fontSize: 22 },
  quickActions: { flexDirection: 'row', gap: 24, marginTop: 20 },
  quickBtn: { alignItems: 'center' },
  quickIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statusBox: { width: '100%', marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  card: { marginHorizontal: 0, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 14,
  },
  toggleIcon: { width: 34, textAlign: 'center' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 16, paddingHorizontal: 20, marginBottom: 16 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  colors: any;
}

function ToggleRow({ label, value, onToggle, colors }: ToggleRowProps) {
  return (
    <View style={[toggleStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[toggleStyles.label, { color: colors.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
});

export default function NotificationsScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState({ vibrate: true, preview: true, reactions: true });
  const [groups, setGroups]     = useState({ vibrate: true, preview: true, reactions: false });
  const [calls, setCalls]       = useState({ vibrate: true });

  const patch = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
    (val: boolean) => setter((prev) => ({ ...prev, [key]: val }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Messages */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MESSAGES</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Notification tone"
            value="Default"
            icon="musical-note-outline"
            iconBg="#5856D6"
            colors={colors}
            onPress={() => showComingSoon('Notification tone')}
          />
          <ToggleRow label="Vibrate"               value={messages.vibrate}   onToggle={patch(setMessages, 'vibrate')}   colors={colors} />
          <ToggleRow label="Show preview"          value={messages.preview}   onToggle={patch(setMessages, 'preview')}   colors={colors} />
          <ToggleRow label="Reaction notifications"value={messages.reactions} onToggle={patch(setMessages, 'reactions')} colors={colors} />
        </View>

        {/* Groups */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>GROUPS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Notification tone"
            value="Default"
            icon="musical-note-outline"
            iconBg="#FF9500"
            colors={colors}
            onPress={() => showComingSoon('Notification tone')}
          />
          <ToggleRow label="Vibrate"               value={groups.vibrate}   onToggle={patch(setGroups, 'vibrate')}   colors={colors} />
          <ToggleRow label="Show preview"          value={groups.preview}   onToggle={patch(setGroups, 'preview')}   colors={colors} />
          <ToggleRow label="Reaction notifications"value={groups.reactions} onToggle={patch(setGroups, 'reactions')} colors={colors} />
        </View>

        {/* Calls */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>CALLS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Ringtone"
            value="Default"
            icon="call-outline"
            iconBg="#34C759"
            colors={colors}
            onPress={() => showComingSoon('Ringtone')}
          />
          <ToggleRow label="Vibrate" value={calls.vibrate} onToggle={patch(setCalls, 'vibrate')} colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 10, gap: 4,
  },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },
  sectionLabel: {
    fontFamily: 'Inter_500Medium', fontSize: 12,
    letterSpacing: 0.6, paddingHorizontal: 16,
    paddingTop: 20, paddingBottom: 6,
  },
  card: {},
});

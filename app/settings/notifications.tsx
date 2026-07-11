import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';
import SectionDivider from '@/src/components/SectionDivider';

const TONES = ['Default', 'Chord', 'Ping', 'Synth', 'None'] as const;
type Tone = typeof TONES[number];

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
        trackColor={{ false: colors.border, true: '#3D5AFE' }}
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

type ToneType = 'messages' | 'groups' | 'calls';

export default function NotificationsScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState({ vibrate: true, preview: true, reactions: true });
  const [groups, setGroups]     = useState({ vibrate: true, preview: true, reactions: false });
  const [calls, setCalls]       = useState({ vibrate: true });

  const [messageTone, setMessageTone] = useState<Tone>('Default');
  const [groupTone, setGroupTone]     = useState<Tone>('Default');
  const [callTone, setCallTone]       = useState<Tone>('Default');
  const [toneSheet, setToneSheet]     = useState<ToneType | null>(null);

  const toneFor = (t: ToneType) => t === 'messages' ? messageTone : t === 'groups' ? groupTone : callTone;
  const setToneFor = (t: ToneType, tone: Tone) => {
    if (t === 'messages') setMessageTone(tone);
    else if (t === 'groups') setGroupTone(tone);
    else setCallTone(tone);
    AsyncStorage.setItem(`@notif_tone_${t}`, tone).catch(() => {});
    setToneSheet(null);
  };

  const patch = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) =>
    (val: boolean) => setter((prev) => ({ ...prev, [key]: val }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#14213D' }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.06)', bottom: '50%' }]} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Messages */}
        <SectionDivider label="MESSAGES" bgColor={colors.surface} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Notification tone"
            value={messageTone}
            icon="musical-note-outline"
            iconBg="#5856D6"
            colors={colors}
            onPress={() => setToneSheet('messages')}
          />
          <ToggleRow label="Vibrate"               value={messages.vibrate}   onToggle={patch(setMessages, 'vibrate')}   colors={colors} />
          <ToggleRow label="Show preview"          value={messages.preview}   onToggle={patch(setMessages, 'preview')}   colors={colors} />
          <ToggleRow label="Reaction notifications"value={messages.reactions} onToggle={patch(setMessages, 'reactions')} colors={colors} />
        </View>

        {/* Groups */}
        <SectionDivider label="GROUPS" bgColor={colors.surface} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Notification tone"
            value={groupTone}
            icon="musical-note-outline"
            iconBg="#FF9500"
            colors={colors}
            onPress={() => setToneSheet('groups')}
          />
          <ToggleRow label="Vibrate"               value={groups.vibrate}   onToggle={patch(setGroups, 'vibrate')}   colors={colors} />
          <ToggleRow label="Show preview"          value={groups.preview}   onToggle={patch(setGroups, 'preview')}   colors={colors} />
          <ToggleRow label="Reaction notifications"value={groups.reactions} onToggle={patch(setGroups, 'reactions')} colors={colors} />
        </View>

        {/* Calls */}
        <SectionDivider label="CALLS" bgColor={colors.surface} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Ringtone"
            value={callTone}
            icon="call-outline"
            iconBg="#34C759"
            colors={colors}
            onPress={() => setToneSheet('calls')}
          />
          <ToggleRow label="Vibrate" value={calls.vibrate} onToggle={patch(setCalls, 'vibrate')} colors={colors} />
        </View>
      </ScrollView>

      {/* Tone picker bottom sheet */}
      <Modal visible={toneSheet !== null} transparent animationType="slide" onRequestClose={() => setToneSheet(null)}>
        <TouchableOpacity style={toneStyles.backdrop} activeOpacity={1} onPress={() => setToneSheet(null)} />
        <View style={[toneStyles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[toneStyles.sheetTitle, { color: colors.textPrimary }]}>
            {toneSheet === 'calls' ? 'Ringtone' : 'Notification Tone'}
          </Text>
          {TONES.map((tone) => {
            const selected = toneSheet !== null && toneFor(toneSheet) === tone;
            return (
              <TouchableOpacity
                key={tone}
                style={[toneStyles.toneRow, { borderBottomColor: colors.border }]}
                onPress={() => toneSheet && setToneFor(toneSheet, tone)}
              >
                <Text style={[toneStyles.toneLabel, { color: colors.textPrimary }]}>{tone}</Text>
                {selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const toneStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 40, paddingTop: 8 },
  sheetTitle: { fontFamily: 'Sora_700Bold', fontSize: 16, textAlign: 'center', paddingVertical: 14 },
  toneRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  toneLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
});

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

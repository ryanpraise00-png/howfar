import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';

type VisibilityOption = 'Everyone' | 'My Contacts' | 'Nobody';
type DisappearOption = 'Off' | '24 hours' | '7 days' | '90 days';

interface VisibilitySetting {
  key: string;
  label: string;
  value: VisibilityOption;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = ['Everyone', 'My Contacts', 'Nobody'];
const DISAPPEAR_OPTIONS: DisappearOption[] = ['Off', '24 hours', '7 days', '90 days'];

export default function PrivacyScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<VisibilitySetting[]>([
    { key: 'lastSeen',    label: 'Last seen & online', value: 'Everyone' },
    { key: 'profilePhoto',label: 'Profile photo',      value: 'Everyone' },
    { key: 'about',       label: 'About',              value: 'My Contacts' },
    { key: 'status',      label: 'Status',             value: 'My Contacts' },
    { key: 'readReceipts',label: 'Read receipts',      value: 'Everyone' },
  ]);

  const [disappear, setDisappear] = useState<DisappearOption>('Off');
  const [sheetTarget, setSheetTarget] = useState<'visibility' | 'disappear' | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const openVisibility = (key: string) => {
    setActiveKey(key);
    setSheetTarget('visibility');
  };

  const setVisibility = (val: VisibilityOption) => {
    setSettings((prev) => prev.map((s) => s.key === activeKey ? { ...s, value: val } : s));
    setSheetTarget(null);
  };

  const currentValue = settings.find((s) => s.key === activeKey)?.value;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Visibility settings */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>WHO CAN SEE MY INFO</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {settings.map((s) => (
            <SettingsRow
              key={s.key}
              label={s.label}
              value={s.value}
              colors={colors}
              onPress={() => openVisibility(s.key)}
            />
          ))}
        </View>

        {/* Disappearing messages */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>DEFAULT TIMER</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Disappearing messages"
            value={disappear}
            icon="timer-outline"
            colors={colors}
            onPress={() => setSheetTarget('disappear')}
          />
        </View>

        {/* Other */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>OTHER</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            label="Blocked contacts"
            value="0"
            icon="ban-outline"
            iconBg="#FF2D55"
            colors={colors}
            onPress={() => showComingSoon('Blocked contacts')}
          />
        </View>
      </ScrollView>

      {/* Visibility bottom sheet */}
      <Modal
        visible={sheetTarget === 'visibility'}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetTarget(null)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetTarget(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            {settings.find((s) => s.key === activeKey)?.label}
          </Text>
          {VISIBILITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.border }]}
              onPress={() => setVisibility(opt)}
            >
              <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>{opt}</Text>
              <View style={[
                styles.radio,
                { borderColor: opt === currentValue ? colors.primary : colors.border },
              ]}>
                {opt === currentValue && (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Disappear bottom sheet */}
      <Modal
        visible={sheetTarget === 'disappear'}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetTarget(null)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetTarget(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Disappearing messages</Text>
          {DISAPPEAR_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.border }]}
              onPress={() => { setDisappear(opt); setSheetTarget(null); }}
            >
              <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>{opt}</Text>
              <View style={[styles.radio, { borderColor: opt === disappear ? colors.primary : colors.border }]}>
                {opt === disappear && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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
  card: { borderRadius: 0 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 17, marginBottom: 16 },
  radioRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});

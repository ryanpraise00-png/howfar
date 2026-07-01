import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { SettingsRow } from '@/src/components';

type ThemeOption = 'Light' | 'Dark' | 'System';
type FontSizeOption = 'Small' | 'Medium' | 'Large';

export default function ChatsSettingsScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const [theme, setTheme] = useState<ThemeOption>('System');
  const [fontSize, setFontSize] = useState<FontSizeOption>('Medium');
  const [sheetTarget, setSheetTarget] = useState<'theme' | 'font' | null>(null);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DISPLAY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="color-palette-outline"
            iconBg="#5856D6"
            label="Theme"
            value={theme}
            colors={colors}
            onPress={() => setSheetTarget('theme')}
          />
          <SettingsRow
            icon="image-outline"
            iconBg="#FF9500"
            label="Wallpaper"
            colors={colors}
            onPress={() => showComingSoon('Wallpaper')}
          />
          <SettingsRow
            icon="text-outline"
            iconBg="#34C759"
            label="Font size"
            value={fontSize}
            colors={colors}
            onPress={() => setSheetTarget('font')}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>BACKUP</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="cloud-upload-outline"
            iconBg="#007AFF"
            label="Chat backup"
            value="Never"
            colors={colors}
            onPress={() => showComingSoon('Chat backup')}
          />
          <SettingsRow
            icon="download-outline"
            iconBg="#FF6B35"
            label="Import chats"
            colors={colors}
            onPress={() => showComingSoon('Import chats')}
          />
        </View>
      </ScrollView>

      {/* Theme sheet */}
      <Modal visible={sheetTarget === 'theme'} transparent animationType="slide" onRequestClose={() => setSheetTarget(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetTarget(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Theme</Text>
          {(['Light', 'Dark', 'System'] as ThemeOption[]).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.border }]}
              onPress={() => { setTheme(opt); setSheetTarget(null); }}
            >
              <Ionicons
                name={opt === 'Light' ? 'sunny-outline' : opt === 'Dark' ? 'moon-outline' : 'phone-portrait-outline'}
                size={20} color={colors.textSecondary} style={{ marginRight: 12 }}
              />
              <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>{opt}</Text>
              <View style={[styles.radio, { borderColor: opt === theme ? colors.primary : colors.border }]}>
                {opt === theme && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Font size sheet */}
      <Modal visible={sheetTarget === 'font'} transparent animationType="slide" onRequestClose={() => setSheetTarget(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetTarget(null)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Font size</Text>
          {(['Small', 'Medium', 'Large'] as FontSizeOption[]).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.border }]}
              onPress={() => { setFontSize(opt); setSheetTarget(null); }}
            >
              <Text style={[
                textStyles.body,
                {
                  color: colors.textPrimary, flex: 1,
                  fontSize: opt === 'Small' ? 13 : opt === 'Large' ? 17 : 15,
                },
              ]}>{opt}</Text>
              <View style={[styles.radio, { borderColor: opt === fontSize ? colors.primary : colors.border }]}>
                {opt === fontSize && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
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
  card: {},
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

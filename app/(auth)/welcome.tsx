import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/store/authStore';

const LANGUAGES = [
  { code: 'en' as const, label: 'English' },
  { code: 'fr' as const, label: 'French' },
  { code: 'pidgin' as const, label: 'Pidgin' },
];

export default function WelcomeScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const { language, setLanguage } = useAuthStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.primary }]}>
      {/* Logo area */}
      <View style={styles.hero}>
        <View style={[styles.logoCircle, { backgroundColor: colors.surface }]}>
          <Text style={[textStyles.display, { color: colors.primary }]}>HF</Text>
        </View>
        <Text style={[styles.appName, { color: '#FFFFFF' }]}>HowFar</Text>
        <Text style={[styles.tagline, { color: 'rgba(255,255,255,0.8)' }]}>
          Privacy-first chat, built for how we talk
        </Text>
      </View>

      {/* Language selector */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.langBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}
          onPress={() => setSheetOpen(true)}
        >
          <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
          <Text style={[textStyles.label, { color: '#FFFFFF' }]}>{selectedLang.label}</Text>
          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Agree & Continue */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.accentAmber }]}
          onPress={() => router.push('/(auth)/phone-entry')}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: '#1C1C1E' }]}>Agree & Continue</Text>
        </TouchableOpacity>

        <Text style={[styles.legal, { color: 'rgba(255,255,255,0.65)' }]}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>

      {/* Language sheet */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
            Select Language
          </Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(i) => i.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.langItem,
                  { borderBottomColor: colors.border },
                  item.code === language && { backgroundColor: colors.primaryDark + '18' },
                ]}
                onPress={() => { setLanguage(item.code); setSheetOpen(false); }}
              >
                <Text style={[textStyles.body, { color: colors.textPrimary }]}>{item.label}</Text>
                {item.code === language && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  appName: { fontFamily: 'Sora_700Bold', fontSize: 36, letterSpacing: -1 },
  tagline: { fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, gap: 16 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: 'center',
  },
  cta: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { fontFamily: 'Sora_700Bold', fontSize: 16 },
  legal: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  legalLink: { fontFamily: 'Inter_500Medium', textDecorationLine: 'underline', color: 'rgba(255,255,255,0.85)' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
    maxHeight: '50%',
  },
  langItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

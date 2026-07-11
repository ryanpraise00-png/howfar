import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader } from '@/src/components';
import SectionDivider from '@/src/components/SectionDivider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQS = [
  {
    q: 'How do I delete a message?',
    a: 'Long-press any message bubble to enter selection mode, then tap the trash icon. You can delete for yourself or for everyone (your own messages only).',
  },
  {
    q: 'Are my messages encrypted?',
    a: "Yes. HowFar uses end-to-end encryption for all direct messages. Only you and the recipient can read them. Tap \"Encryption\" in a contact's info screen to verify the key fingerprint.",
  },
  {
    q: 'What is the Vault?',
    a: 'The Vault is a private space for your personal notes. Notes are stored only on your device and are never shared or synced to our servers.',
  },
  {
    q: 'How do disappearing messages work?',
    a: 'When disappearing messages are enabled in a chat, messages are automatically deleted after the configured time (24 hours, 7 days, or 90 days) from both devices.',
  },
  {
    q: 'How do I back up my chats?',
    a: "Go to Settings → Storage to manage local cache. For full backup, enable your device's encrypted iCloud or Google Drive backup.",
  },
];

export default function HelpScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Help & Support" variant="navy" colors={colors} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
      >
        <SectionDivider label="FREQUENTLY ASKED QUESTIONS" bgColor={colors.surface} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.faqRow, { borderTopColor: colors.border }, i === 0 && { borderTopWidth: 0 }]}
                onPress={() => setOpenIndex(isOpen ? null : i)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQ, { color: colors.textPrimary, flex: 1 }]}>{faq.q}</Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                </View>
                {isOpen && (
                  <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
                    {faq.a}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionDivider label="CONTACT & LEGAL" bgColor={colors.surface} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.linkRow, { borderTopWidth: 0 }]}
            onPress={() => Linking.openURL('mailto:support@howfar.app')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>Contact support</Text>
            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkRow, { borderTopColor: colors.border }]}
            onPress={() => Linking.openURL('https://howfar.app/privacy')}
          >
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkRow, { borderTopColor: colors.border }]}
            onPress={() => Linking.openURL('https://howfar.app/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: 'Inter_500Medium', fontSize: 12,
    letterSpacing: 0.6, paddingHorizontal: 16, marginBottom: 8,
  },
  card: { marginHorizontal: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  faqRow: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

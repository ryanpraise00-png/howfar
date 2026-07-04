import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { mockContacts } from '@/src/data/mockContacts';

export default function EncryptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const contact = mockContacts.find((c) => c.id === id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Encryption</Text>
      </View>

      <View style={styles.body}>
        {/* Lock icon */}
        <View style={[styles.iconWrap, { backgroundColor: colors.accent + '18' }]}>
          <Ionicons name="lock-closed" size={56} color={colors.accent} />
        </View>

        <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginTop: 24, textAlign: 'center' }]}>
          End-to-end encrypted
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 }]}>
          Messages and calls to {contact?.name ?? 'this contact'} are secured with end-to-end encryption.
          Only you and {contact?.name?.split(' ')[0] ?? 'they'} can read or listen to them.
        </Text>

        {/* QR placeholder */}
        <View style={[styles.qrPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.qrGrid}>
            {Array.from({ length: 25 }).map((_, i) => (
              <View
                key={i}
                style={[styles.qrCell, { backgroundColor: (i + Math.floor(i / 5)) % 2 === 0 ? colors.textPrimary : 'transparent' }]}
              />
            ))}
          </View>
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 12 }]}>
            Scan to verify security code
          </Text>
        </View>

        <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
          Tap to scan or compare the safety number on {contact?.name?.split(' ')[0] ?? 'their'} device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 8, gap: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, flex: 1 },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  qrPlaceholder: {
    marginTop: 32, padding: 20, borderRadius: 16,
    borderWidth: 1, alignItems: 'center',
  },
  qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 125, height: 125 },
  qrCell: { width: 25, height: 25 },
});

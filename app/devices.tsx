import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { showComingSoon } from '@/src/lib/toast';

const MOCK_DEVICES = [
  { id: 'current', name: 'This device', detail: 'Active now', isCurrent: true },
];

export default function DevicesScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connected Devices</Text>
      </View>

      <FlatList
        data={MOCK_DEVICES}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVE SESSIONS</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.deviceRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={[styles.deviceIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Inter_500Medium' }]}>{item.name}</Text>
              <Text style={[textStyles.caption, { color: item.isCurrent ? colors.accentTeal : colors.textSecondary }]}>{item.detail}</Text>
            </View>
            {item.isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: colors.accentTeal + '18', borderColor: colors.accentTeal + '40' }]}>
                <Text style={[styles.currentText, { color: colors.accentTeal }]}>Current</Text>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() =>
              Alert.alert(
                'Log out all other devices?',
                'All other sessions will be signed out immediately.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Log out others', style: 'destructive', onPress: () => showComingSoon('Log out devices') },
                ]
              )
            }
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[textStyles.body, { color: colors.error }]}>Log out all other devices</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, gap: 4 },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },
  sectionLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.6, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  deviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  currentBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  currentText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 16, marginTop: 24, paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
});

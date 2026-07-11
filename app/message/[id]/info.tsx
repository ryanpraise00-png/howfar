import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import SectionDivider from '@/src/components/SectionDivider';
import { router, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { fetchMessageReceipts } from '@/src/services/chats';

interface Receipt {
  userId: string;
  name: string;
  avatarUrl: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetchMessageReceipts(id)
      .then(setReceipts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const read = receipts.filter((r) => r.readAt);
  const delivered = receipts.filter((r) => !r.readAt && r.deliveredAt);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#14213D' }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.06)', bottom: '50%' }]} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Message Info</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-outline" size={48} color={colors.border} />
          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 12 }]}>
            No receipt data yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...read, ...delivered]}
          keyExtractor={(item) => item.userId}
          ListHeaderComponent={() => (
            <>
              {read.length > 0 && (
                <SectionDivider label="Read by" color="#3D5AFE" bgColor={colors.surface} />
              )}
            </>
          )}
          renderItem={({ item, index }) => {
            const isFirstDelivered = !item.readAt && index === read.length;
            return (
              <>
                {isFirstDelivered && delivered.length > 0 && (
                  <SectionDivider label="Delivered to" color="#14213D" bgColor={colors.surface} />
                )}
                <View style={[styles.row, { borderBottomColor: colors.border }]}>
                  <Avatar name={item.name} size="md" />
                  <View style={styles.info}>
                    <Text style={[textStyles.body, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
                      {item.readAt ? `Read ${formatTime(item.readAt)}` : `Delivered ${formatTime(item.deliveredAt)}`}
                    </Text>
                  </View>
                </View>
              </>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 8, gap: 4, overflow: 'hidden' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, flex: 1 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1 },
});

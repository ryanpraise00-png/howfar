import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { api } from '@/src/services/api';
import SectionDivider from '@/src/components/SectionDivider';

interface StarredMessage {
  id: string;
  content: string | null;
  type: string;
  createdAt: string;
  chat: { id: string; name: string; avatarUrl: string | null };
}

interface Section {
  title: string;
  chatId: string;
  data: StarredMessage[];
}

export default function StarredScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<StarredMessage[]>('/api/messages/starred')
      .then((msgs) => {
        const map = new Map<string, Section>();
        for (const m of msgs) {
          const key = m.chat.id;
          if (!map.has(key)) map.set(key, { title: m.chat.name, chatId: key, data: [] });
          map.get(key)!.data.push(m);
        }
        setSections(Array.from(map.values()));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#14213D' }]} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.06)', bottom: '50%' as any }]} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Starred Messages</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="star-outline" size={52} color={colors.border} />
          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 16 }]}>No starred messages yet</Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>Star messages to save them here</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderSectionHeader={({ section }) => (
            <SectionDivider label={section.title.toUpperCase()} color="#3D5AFE" bgColor={colors.surface} />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => router.push(`/chat/${item.chat.id}` as any)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.body, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.content ?? `[${item.type.toLowerCase()}]`}
                </Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
              <Ionicons name="star" size={16} color="#F2A93B" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, gap: 4 },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});

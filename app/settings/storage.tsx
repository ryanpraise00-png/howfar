import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/theme';
import { ScreenHeader } from '@/src/components';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showSuccess } from '@/src/lib/toast';

async function estimateAsyncStorageBytes(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let total = 0;
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) {
      total += (k?.length ?? 0) + (v?.length ?? 0);
    }
    return total;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const PREFS_KEY = '@storage_prefs';

interface StoragePrefs {
  autoDownloadImages: boolean;
  autoDownloadVideos: boolean;
  autoDownloadDocs: boolean;
}

const DEFAULT_PREFS: StoragePrefs = {
  autoDownloadImages: true,
  autoDownloadVideos: false,
  autoDownloadDocs: false,
};

export default function StorageScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [cacheBytes, setCacheBytes] = useState<number | null>(null);
  const [prefs, setPrefs] = useState<StoragePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    estimateAsyncStorageBytes().then(setCacheBytes);
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    });
  }, []);

  async function savePrefs(next: StoragePrefs) {
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear cache?',
      'This will remove locally cached data. Your messages will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const keep = keys.filter((k) => k.startsWith('@auth') || k === PREFS_KEY);
              const remove = keys.filter((k) => !keep.includes(k));
              await AsyncStorage.multiRemove(remove);
              const fresh = await estimateAsyncStorageBytes();
              setCacheBytes(fresh);
              showSuccess('Cache cleared');
            } catch {
              // silent
            }
          },
        },
      ],
    );
  }, []);

  const TOGGLE_ROWS: { label: string; sub: string; key: keyof StoragePrefs }[] = [
    { label: 'Images', sub: 'Auto-download on mobile data', key: 'autoDownloadImages' },
    { label: 'Videos', sub: 'Auto-download on mobile data', key: 'autoDownloadVideos' },
    { label: 'Documents', sub: 'Auto-download on mobile data', key: 'autoDownloadDocs' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Storage" variant="teal" colors={colors} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
      >
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>STORAGE USAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.storageRow}>
            <View style={[styles.storageIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="server-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>App data</Text>
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
                {cacheBytes === null ? 'Calculating…' : formatBytes(cacheBytes)}
              </Text>
            </View>
          </View>
          <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.barFill,
                {
                  backgroundColor: colors.primary,
                  width: cacheBytes ? `${Math.min((cacheBytes / (5 * 1024 * 1024)) * 100, 100)}%` : '0%',
                },
              ]}
            />
          </View>
          <Text style={[textStyles.caption, { color: colors.textSecondary, paddingHorizontal: 16, paddingBottom: 12 }]}>
            of 5 MB estimated limit
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleClearCache}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[textStyles.body, { color: colors.error }]}>Clear cache</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>NETWORK USAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {TOGGLE_ROWS.map((row, i) => (
            <View
              key={row.key}
              style={[styles.toggleRow, { borderTopColor: colors.border }, i === 0 && { borderTopWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.body, { color: colors.textPrimary }]}>{row.label}</Text>
                <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{row.sub}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={(v) => savePrefs({ ...prefs, [row.key]: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
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

  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  storageIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  barTrack: { marginHorizontal: 16, height: 6, borderRadius: 3, marginBottom: 6 },
  barFill: { height: 6, borderRadius: 3 },

  clearBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 12, marginTop: 12,
    paddingVertical: 16, borderRadius: 14, borderWidth: 1, gap: 10,
  },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 12,
  },
});

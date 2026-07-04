import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { mockMessages } from '@/src/data/mockMessages';
import { mockGroupMessages } from '@/src/data/mockGroupMessages';
import { getGroupChat } from '@/src/data/mockGroups';
import type { MessageEntry } from '@/src/data/mockMessages';

const { width } = Dimensions.get('window');
const MEDIA_SIZE = (width - 4) / 3;

type Tab = 'media' | 'links' | 'docs';

export default function MediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('media');

  const isGroup = !!getGroupChat(id ?? '');
  const allMessages = (isGroup ? mockGroupMessages : mockMessages)
    .filter((m): m is MessageEntry => m._type === 'message');

  const mediaItems = allMessages.filter((m) => m.kind === 'image' && m.imageUri);
  const linkItems = allMessages.filter((m) => m.kind === 'link' && m.linkPreview);
  const docItems = allMessages.filter((m) => m.kind === 'document' && m.documentName);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'media', label: 'Media', count: mediaItems.length },
    { key: 'links', label: 'Links', count: linkItems.length },
    { key: 'docs',  label: 'Docs',  count: docItems.length },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media, Links & Docs</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
            ]}>
              {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Media grid */}
      {activeTab === 'media' && (
        mediaItems.length === 0 ? (
          <EmptyTab icon="images-outline" label="No media yet" colors={colors} textStyles={textStyles} />
        ) : (
          <FlatList
            data={mediaItems}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.imageUri }}
                style={{ width: MEDIA_SIZE, height: MEDIA_SIZE, margin: 1 }}
                contentFit="cover"
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* Links list */}
      {activeTab === 'links' && (
        linkItems.length === 0 ? (
          <EmptyTab icon="link-outline" label="No links yet" colors={colors} textStyles={textStyles} />
        ) : (
          <FlatList
            data={linkItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => item.linkPreview ? (
              <View style={[styles.linkRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={[styles.linkAccent, { backgroundColor: colors.accent }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.linkDomain, { color: colors.accent }]}>{item.linkPreview.domain}</Text>
                  <Text style={[textStyles.body, { color: colors.textPrimary }]} numberOfLines={2}>{item.linkPreview.title}</Text>
                  {item.linkPreview.description && (
                    <Text style={[textStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>{item.linkPreview.description}</Text>
                  )}
                </View>
                <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
              </View>
            ) : null}
          />
        )
      )}

      {/* Docs list */}
      {activeTab === 'docs' && (
        docItems.length === 0 ? (
          <EmptyTab icon="document-outline" label="No documents yet" colors={colors} textStyles={textStyles} />
        ) : (
          <FlatList
            data={docItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <View style={[styles.docRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={[styles.docIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="document-text" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.body, { color: colors.textPrimary }]} numberOfLines={1}>{item.documentName}</Text>
                  {item.documentSize && (
                    <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{item.documentSize}</Text>
                  )}
                  <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{item.timestamp}</Text>
                </View>
                <TouchableOpacity>
                  <Ionicons name="download-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}
    </View>
  );
}

function EmptyTab({ icon, label, colors, textStyles }: { icon: any; label: string; colors: any; textStyles: any }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={52} color={colors.border} />
      <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 12 }]}>{label}</Text>
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

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkAccent: { width: 3, borderRadius: 2, alignSelf: 'stretch' },
  linkDomain: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

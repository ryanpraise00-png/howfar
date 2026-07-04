import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { showSuccess, showError } from '@/src/lib/toast';
import { fetchChats, apiChatToItem } from '@/src/services/chats';
import type { ChatItem } from '@/src/data/mockChats';
import { emitSendMessage } from '@/src/services/socket';
import { mockMessages } from '@/src/data/mockMessages';

export default function ForwardScreen() {
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchChats(false).then((data) => setChats(data.map(apiChatToItem))).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    return chats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [chats, query]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function handleForward() {
    if (selected.size === 0) return;
    setSending(true);

    // Find the message text to forward
    const msg = mockMessages.find((m) => m._type === 'message' && m.id === messageId);
    const text = (msg as any)?.text ?? '';

    try {
      for (const chatId of selected) {
        emitSendMessage({
          localId: `fwd-${Date.now()}-${chatId}`,
          chatId,
          type: 'TEXT',
          content: text,
        });
      }
      showSuccess(`Forwarded to ${selected.size} chat${selected.size > 1 ? 's' : ''}`);
      router.back();
    } catch {
      showError('Could not forward message');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Forward to</Text>
        {selected.size > 0 && (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.accentAmber }]}
            onPress={handleForward}
            disabled={sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Ionicons name="send" size={18} color="#FFFFFF" />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search chats"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Selected chips */}
      {selected.size > 0 && (
        <View style={[styles.selectedBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
            {selected.size} selected
          </Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          return (
            <Pressable
              style={[styles.chatRow, { borderBottomColor: colors.border }]}
              onPress={() => toggle(item.id)}
            >
              <Avatar name={item.name} size="md" />
              <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[
                styles.checkbox,
                { borderColor: isSelected ? colors.accent : colors.border },
                isSelected && { backgroundColor: colors.accent },
              ]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 8, gap: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, flex: 1 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 0 },
  selectedBar: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
});

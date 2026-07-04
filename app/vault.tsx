import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { showSuccess } from '@/src/lib/toast';
import ChatBackground from '@/src/components/ChatBackground';

const STORAGE_KEY = '@vault_messages';

interface VaultMessage {
  id: string;
  text: string;
  timestamp: string;
}

function makeId() {
  return `vault-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function VaultScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<VaultMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<VaultMessage | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setMessages(JSON.parse(raw));
    });
  }, []);

  async function persist(msgs: VaultMessage[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const msg: VaultMessage = {
      id: makeId(),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const next = [msg, ...messages];
    setMessages(next);
    persist(next);
    setInputText('');
    setReplyTo(null);
  }, [inputText, messages]);

  const handleLongPress = useCallback((msg: VaultMessage) => {
    setSelectedId(msg.id);
  }, []);

  // ── Selection bar actions ─────────────────────────────────────────────────

  function selectionReply() {
    const msg = messages.find((m) => m.id === selectedId);
    if (!msg) return;
    setReplyTo(msg);
    setSelectedId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function selectionCopy() {
    const msg = messages.find((m) => m.id === selectedId);
    if (msg?.text) {
      await Clipboard.setStringAsync(msg.text);
      showSuccess('Copied to clipboard');
    }
    setSelectedId(null);
  }

  function selectionForward() {
    const id = selectedId;
    setSelectedId(null);
    router.push({ pathname: '/forward', params: { messageId: id ?? '' } });
  }

  function selectionDelete() {
    const msgId = selectedId;
    setSelectedId(null);
    Alert.alert('Delete note', 'Remove this note from your Vault?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          const next = messages.filter((m) => m.id !== msgId);
          setMessages(next);
          persist(next);
        },
      },
    ]);
  }

  function selectionInfo() {
    const msg = messages.find((m) => m.id === selectedId);
    setSelectedId(null);
    if (msg) {
      Alert.alert('Note info', `Saved at ${msg.timestamp}`, [{ text: 'OK' }]);
    }
  }

  const SelectionBar = () => (
    <View style={[selStyles.bar, { backgroundColor: '#0B9E8E', paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => setSelectedId(null)}>
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={selStyles.actions}>
        <TouchableOpacity style={selStyles.btn} onPress={selectionReply}>
          <Ionicons name="arrow-undo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selectionForward}>
          <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selectionCopy}>
          <Ionicons name="copy-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selectionDelete}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selectionInfo}>
          <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = useCallback(({ item }: { item: VaultMessage }) => {
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        onPress={() => { if (selectedId) setSelectedId(null); }}
        activeOpacity={0.85}
        style={[
          vStyles.bubble,
          { backgroundColor: isSelected ? colors.accentAmber : colors.bubbleSent },
        ]}
      >
        <Text style={[vStyles.text, { color: '#FFFFFF' }]}>{item.text}</Text>
        <Text style={[vStyles.time, { color: 'rgba(255,255,255,0.7)' }]}>{item.timestamp}</Text>
      </TouchableOpacity>
    );
  }, [colors, selectedId, handleLongPress]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      {selectedId ? (
        <SelectionBar />
      ) : (
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={[styles.avatarIcon, { backgroundColor: '#0B9E8E' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerMid}>
            <Text style={styles.headerName}>Vault</Text>
            <Text style={styles.headerSub}>Your private notes</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <ChatBackground>
        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
          onScrollBeginDrag={() => { if (selectedId) setSelectedId(null); }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.border} />
              <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
                Your private notes live here.{'\n'}Only you can see them.
              </Text>
            </View>
          }
        />

        {/* Reply preview */}
        {replyTo && (
          <View style={[styles.replyPreview, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={[styles.replyStripe, { backgroundColor: '#0B9E8E' }]} />
            <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
              {replyTo.text}
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyClose}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 4,
        }]}>
          <View style={[styles.inputPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.inputField, { color: colors.textPrimary }]}
              placeholder="Add a note…"
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? '#0B9E8E' : colors.border }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ChatBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 8 },
  backBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1, paddingHorizontal: 8 },
  headerName: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  headerBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 12, paddingTop: 8 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  replyPreview: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  replyStripe: { width: 3, borderRadius: 2, minHeight: 28 },
  replyText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  replyClose: { padding: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  inputPill: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8, maxHeight: 110,
  },
  inputField: {
    fontFamily: 'Inter_400Regular', fontSize: 15,
    maxHeight: 92, paddingTop: 0, paddingBottom: 0,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

const vStyles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-end', maxWidth: '80%',
    borderRadius: 18, borderBottomRightRadius: 4,
    padding: 10, marginBottom: 6,
  },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'right' },
});

const selStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 12 },
  actions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});

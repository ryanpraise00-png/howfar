import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

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
  }, [inputText, messages]);

  const handleDelete = useCallback((id: string) => {
    const next = messages.filter((m) => m.id !== id);
    setMessages(next);
    persist(next);
  }, [messages]);

  const renderItem = useCallback(({ item }: { item: VaultMessage }) => (
    <TouchableOpacity
      onLongPress={() => handleDelete(item.id)}
      activeOpacity={0.85}
      style={[vStyles.bubble, { backgroundColor: colors.bubbleSent }]}
    >
      <Text style={[vStyles.text, { color: '#FFFFFF' }]}>{item.text}</Text>
      <Text style={[vStyles.time, { color: 'rgba(255,255,255,0.7)' }]}>{item.timestamp}</Text>
    </TouchableOpacity>
  ), [colors, handleDelete]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
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

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.border} />
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
              Your private notes live here.{'\n'}Only you can see them.
            </Text>
          </View>
        }
      />

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 8 },
  backBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid: { flex: 1, paddingHorizontal: 8 },
  headerName: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  headerBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 12, paddingTop: 8 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  inputPill: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
    maxHeight: 110,
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

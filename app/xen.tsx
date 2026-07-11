import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '@/src/theme';
import { api } from '@/src/services/api';
import { showSuccess, showError } from '@/src/lib/toast';
import ChatBackground from '@/src/components/ChatBackground';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const xenAvatar = require('@/assets/images/xen-avatar.png');

const XEN_PURPLE = '#6B3FA0';
const XEN_HEADER = '#4A1F7C';
const STARRED_KEY = '@xen_starred';

type Role = 'user' | 'assistant';

interface XenMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
}

const PROMPT_CHIPS = [
  'What can you help me with?',
  'Tell me something interesting',
  'Help me write a message',
];

function makeId() {
  return `xen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function TypingDots({ color }: { color: string }) {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(a, { toValue: 1, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 300, easing: Easing.ease, useNativeDriver: true }),
          Animated.delay(450 - i * 150),
        ]),
      ),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={dotStyles.row}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={[dotStyles.dot, { backgroundColor: color, opacity: a }]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

export default function XenScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<XenMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<XenMessage | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const isFirstOpen = messages.length === 0;
  const selectedMsg = messages.find((m) => m.id === selectedId) ?? null;

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: XenMessage = {
      id: makeId(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const history = [...messages, userMsg];
    setMessages(history);
    setInputText('');
    setReplyTo(null);
    setIsThinking(true);

    // Scroll to bottom after adding user message
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const payload = history.map((m) => ({ role: m.role, content: m.text }));
      const { reply } = await api.post<{ reply: string }>('/xen/chat', { messages: payload });

      const botMsg: XenMessage = {
        id: makeId(),
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      const errMsg: XenMessage = {
        id: makeId(),
        role: 'assistant',
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, isThinking]);

  const handleSend = useCallback(() => sendMessage(inputText), [inputText, sendMessage]);

  // ── Selection actions ─────────────────────────────────────────────────────

  function selReply() {
    if (!selectedMsg) return;
    setReplyTo(selectedMsg);
    setSelectedId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function selForward() {
    const id = selectedId;
    setSelectedId(null);
    router.push({ pathname: '/forward', params: { messageId: id ?? '' } });
  }

  async function selCopy() {
    if (!selectedMsg) return;
    await Clipboard.setStringAsync(selectedMsg.text);
    showSuccess('Copied to clipboard');
    setSelectedId(null);
  }

  async function selStar() {
    if (!selectedMsg) return;
    try {
      const raw = await AsyncStorage.getItem(STARRED_KEY);
      const starred: XenMessage[] = raw ? JSON.parse(raw) : [];
      const already = starred.some((m) => m.id === selectedMsg.id);
      if (already) {
        showSuccess('Already starred');
      } else {
        await AsyncStorage.setItem(STARRED_KEY, JSON.stringify([selectedMsg, ...starred]));
        showSuccess('Message starred');
      }
    } catch {
      showError('Could not star message');
    }
    setSelectedId(null);
  }

  function selDelete() {
    const id = selectedId;
    setSelectedId(null);
    Alert.alert('Delete message', 'Remove this message from the conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => setMessages((prev) => prev.filter((m) => m.id !== id)),
      },
    ]);
  }

  function selInfo() {
    const msg = selectedMsg;
    setSelectedId(null);
    if (msg) {
      Alert.alert(
        msg.role === 'user' ? 'Your message' : 'Xen',
        `Sent at ${msg.timestamp}`,
        [{ text: 'OK' }],
      );
    }
  }

  // ── SelectionBar ──────────────────────────────────────────────────────────

  const SelectionBar = () => (
    <View style={[selStyles.bar, { backgroundColor: XEN_HEADER, paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => setSelectedId(null)}>
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={selStyles.actions}>
        <TouchableOpacity style={selStyles.btn} onPress={selReply}>
          <Ionicons name="arrow-undo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selForward}>
          <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selCopy}>
          <Ionicons name="copy-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selStar}>
          <Ionicons name="star-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selDelete}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={selInfo}>
          <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render item ───────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: XenMessage }) => {
    const isUser = item.role === 'user';
    const isSelected = selectedId === item.id;

    return (
      <TouchableOpacity
        onLongPress={() => setSelectedId(item.id)}
        onPress={() => { if (selectedId) setSelectedId(null); }}
        activeOpacity={0.92}
        delayLongPress={220}
        style={[bubbleStyles.wrapper, isUser ? bubbleStyles.out : bubbleStyles.in]}
      >
        {!isUser && (
          <Image source={xenAvatar} style={bubbleStyles.botAvatar} contentFit="cover" />
        )}
        <View style={[
          bubbleStyles.bubble,
          isUser
            ? { backgroundColor: isSelected ? colors.accentAmber : colors.bubbleSent, borderBottomRightRadius: 4 }
            : { backgroundColor: isSelected ? colors.accentAmber + '55' : colors.bubbleIncoming, borderBottomLeftRadius: 4 },
        ]}>
          <Text style={[bubbleStyles.text, { color: isUser ? '#FFFFFF' : colors.textPrimary }]}>
            {item.text}
          </Text>
          <Text style={[bubbleStyles.time, { color: isUser ? 'rgba(255,255,255,0.65)' : colors.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors, selectedId]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header — swaps to SelectionBar on selection */}
      {selectedId ? (
        <SelectionBar />
      ) : (
        <View style={[styles.header, { backgroundColor: XEN_HEADER, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Image source={xenAvatar} style={styles.avatarIcon} contentFit="cover" />
          <View style={styles.headerMid}>
            <Text style={styles.headerName}>Xen</Text>
            <Text style={styles.headerSub}>
              {isThinking ? 'thinking…' : 'AI Assistant · Xensiq'}
            </Text>
          </View>
        </View>
      )}

      <ChatBackground>
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, isFirstOpen && styles.listCentered]}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => { if (selectedId) setSelectedId(null); }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image source={xenAvatar} style={styles.emptyIcon} contentFit="cover" />
              <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginTop: spacing.md }]}>
                Hi, I'm Xen
              </Text>
              <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                Your AI assistant, powered by Xensiq
              </Text>
            </View>
          }
          ListFooterComponent={
            isThinking ? (
              <View style={[bubbleStyles.wrapper, bubbleStyles.in]}>
                <Image source={xenAvatar} style={bubbleStyles.botAvatar} contentFit="cover" />
                <View style={[bubbleStyles.bubble, { backgroundColor: colors.bubbleIncoming, borderBottomLeftRadius: 4 }]}>
                  <TypingDots color={colors.textSecondary} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Prompt chips (first open only) */}
        {isFirstOpen && !isThinking && (
          <View style={[styles.chipRow, { borderTopColor: colors.border }]}>
            {PROMPT_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={[styles.promptChip, { borderColor: XEN_PURPLE, backgroundColor: XEN_PURPLE + '15' }]}
                onPress={() => sendMessage(chip)}
              >
                <Text style={[styles.promptChipText, { color: XEN_PURPLE }]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reply preview */}
        {replyTo && (
          <View style={[styles.replyPreview, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={[styles.replyStripe, { backgroundColor: XEN_PURPLE }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.replyName, { color: XEN_PURPLE }]}>
                {replyTo.role === 'user' ? 'You' : 'Xen'}
              </Text>
              <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
                {replyTo.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyClose}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar — disabled while isThinking */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 4,
          opacity: isThinking ? 0.55 : 1,
        }]}>
          <View style={[styles.inputPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.inputField, { color: colors.textPrimary }]}
              placeholder="Ask Xen anything…"
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              returnKeyType="default"
              editable={!isThinking}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: (inputText.trim() && !isThinking) ? XEN_PURPLE : colors.border }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isThinking}
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
  listContent: { paddingHorizontal: 8, paddingVertical: 8 },
  listCentered: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingBottom: 24 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  promptChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  promptChipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  replyPreview: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  replyStripe: { width: 3, borderRadius: 2, minHeight: 32 },
  replyName: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  replyText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
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

const bubbleStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', marginVertical: 3, marginHorizontal: 4, gap: 6 },
  out: { justifyContent: 'flex-end' },
  in: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'right' },
});

const selStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 12 },
  actions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});

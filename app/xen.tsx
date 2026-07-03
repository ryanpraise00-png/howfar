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
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { api } from '@/src/services/api';

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
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

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
        <Animated.View
          key={i}
          style={[dotStyles.dot, { backgroundColor: color, opacity: a }]}
        />
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
  const inputRef = useRef<TextInput>(null);
  const isFirstOpen = messages.length === 0;

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
    setIsThinking(true);

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

  const handleSend = useCallback(() => {
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const renderItem = useCallback(({ item }: { item: XenMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[bubbleStyles.wrapper, isUser ? bubbleStyles.out : bubbleStyles.in]}>
        {!isUser && (
          <View style={[bubbleStyles.botAvatar, { backgroundColor: '#6B3FA0' }]}>
            <Ionicons name="hardware-chip-outline" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={[
          bubbleStyles.bubble,
          isUser
            ? { backgroundColor: colors.bubbleSent, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.bubbleIncoming, borderBottomLeftRadius: 4 },
        ]}>
          <Text style={[bubbleStyles.text, { color: isUser ? '#FFFFFF' : colors.textPrimary }]}>
            {item.text}
          </Text>
          <Text style={[bubbleStyles.time, { color: isUser ? 'rgba(255,255,255,0.65)' : colors.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  }, [colors]);

  const flatData = messages;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#4A1F7C', paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={[styles.avatarIcon, { backgroundColor: '#6B3FA0' }]}>
          <Ionicons name="hardware-chip-outline" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.headerMid}>
          <Text style={styles.headerName}>Xen</Text>
          <Text style={styles.headerSub}>AI Assistant · Xensiq</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={flatData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, isFirstOpen && styles.listCentered]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: '#6B3FA0' + '22' }]}>
              <Ionicons name="hardware-chip-outline" size={40} color="#6B3FA0" />
            </View>
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
              <View style={[bubbleStyles.botAvatar, { backgroundColor: '#6B3FA0' }]}>
                <Ionicons name="hardware-chip-outline" size={14} color="#FFFFFF" />
              </View>
              <View style={[bubbleStyles.bubble, { backgroundColor: colors.bubbleIncoming, borderBottomLeftRadius: 4 }]}>
                <TypingDots color={colors.textSecondary} />
              </View>
            </View>
          ) : null
        }
      />

      {/* Prompt chips (only on first open) */}
      {isFirstOpen && !isThinking && (
        <View style={[styles.chipRow, { borderTopColor: colors.border }]}>
          {PROMPT_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[styles.promptChip, { borderColor: '#6B3FA0', backgroundColor: '#6B3FA0' + '15' }]}
              onPress={() => sendMessage(chip)}
            >
              <Text style={[styles.promptChipText, { color: '#6B3FA0' }]}>{chip}</Text>
            </TouchableOpacity>
          ))}
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
          style={[styles.sendBtn, { backgroundColor: (inputText.trim() && !isThinking) ? '#6B3FA0' : colors.border }]}
          onPress={handleSend}
          disabled={!inputText.trim() || isThinking}
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

const bubbleStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', marginVertical: 3, marginHorizontal: 4, gap: 6 },
  out: { justifyContent: 'flex-end' },
  in: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'right' },
});

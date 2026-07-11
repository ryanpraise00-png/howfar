import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { showComingSoon, showError, showSuccess } from '@/src/lib/toast';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useChatStore } from '@/src/store/chatStore';
import { useAuthStore } from '@/src/store/authStore';
import {
  emitSendMessage,
  emitReadMessages,
  emitTypingStart,
  emitTypingStop,
} from '@/src/services/socket';
import { fetchMessages, apiMessageToStore } from '@/src/services/chats';
import { uploadMedia } from '@/src/services/media';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { starMessage, deleteMessage, updateChatSettings } from '@/src/services/chats';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import ChatBackground from '@/src/components/ChatBackground';
import { mockChats } from '@/src/data/mockChats';
import { mockContacts } from '@/src/data/mockContacts';
import { getGroupChat } from '@/src/data/mockGroups';
import {
  mockMessages,
  type ListItem,
  type MessageEntry,
} from '@/src/data/mockMessages';
import { mockGroupMessages } from '@/src/data/mockGroupMessages';

// ─── sender color palette ────────────────────────────────────────────────────

const SENDER_COLORS = ['#14213D', '#3D5AFE', '#5856D6', '#FF6B35', '#FF2D55', '#FF9500', '#34C759'];
function senderColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SENDER_COLORS[h % SENDER_COLORS.length];
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getChatName(id: string): string {
  const chat = mockChats.find((c) => c.id === id);
  if (chat) return chat.name;
  const contact = mockContacts.find((c) => c.id === id);
  if (contact) return contact.name;
  return id;
}

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function VoiceWaveform({ color }: { color: string }) {
  const bars = [3, 6, 9, 5, 12, 8, 4, 10, 7, 5, 9, 6, 11, 4, 8];
  return (
    <View style={waveStyles.row}>
      {bars.map((h, i) => (
        <View key={i} style={[waveStyles.bar, { height: h * 2, backgroundColor: color }]} />
      ))}
    </View>
  );
}
const waveStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
  bar: { width: 3, borderRadius: 2 },
});

function LinkCard({ preview, textColor, borderColor }: {
  preview: NonNullable<MessageEntry['linkPreview']>;
  textColor: string;
  borderColor: string;
}) {
  return (
    <View style={[linkStyles.card, { borderLeftColor: borderColor }]}>
      <Text style={[linkStyles.domain, { color: borderColor }]}>{preview.domain}</Text>
      <Text style={[linkStyles.title, { color: textColor }]}>{preview.title}</Text>
      {preview.description && (
        <Text style={[linkStyles.desc, { color: textColor, opacity: 0.7 }]}>{preview.description}</Text>
      )}
    </View>
  );
}
const linkStyles = StyleSheet.create({
  card: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 6, gap: 2 },
  domain: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontFamily: 'Sora_600SemiBold', fontSize: 13, lineHeight: 18 },
  desc: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});

// ─── main screen ────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const chatId = id ?? '';
  const group = getGroupChat(chatId);
  const isGroup = !!group;

  const chatName = getChatName(chatId);

  // Group header subtitle: list first 2-3 member first names + "and N others"
  const groupSubtitle = (() => {
    if (!group) return '';
    const others = group.members.filter((m) => m.contactId !== 'me');
    const names = others.slice(0, 3).map((m) => m.name.split(' ')[0]);
    if (others.length > 3) return `${names.join(', ')} and ${others.length - 3} others`;
    return names.join(', ');
  })();

  const selfId = useAuthStore((s) => s.userId) ?? '';
  const storeMessages = useChatStore((s) => s.messagesByChatId[chatId]);
  const presenceMap = useChatStore((s) => s.presenceMap);
  const typingMap = useChatStore((s) => s.typingMap);

  // Use store messages when available; fall back to mock for offline/dev
  const initialMessages: ListItem[] = isGroup ? mockGroupMessages : mockMessages;
  const [localMessages, setLocalMessages] = useState<ListItem[]>(initialMessages);

  // Map server MessageType → bubble kind
  function storeTypeToKind(type: string): MessageEntry['kind'] {
    if (type === 'IMAGE' || type === 'VIDEO') return 'image';
    if (type === 'VOICE') return 'voice';
    if (type === 'DOCUMENT') return 'document';
    return 'text';
  }

  // Merge store messages (real-time) on top of local mock messages
  const storeAsList: ListItem[] = (storeMessages ?? []).map((m) => ({
    _type: 'message' as const,
    id: m.id,
    kind: storeTypeToKind(m.type),
    isOutgoing: m.senderId === selfId,
    senderId: m.senderId,
    senderName: m.sender?.name,
    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: m.readBy.length > 0 ? ('read' as const) : ('sent' as const),
    text: m.content ?? undefined,
    imageUri: (m.type === 'IMAGE' || m.type === 'VIDEO') ? (m.mediaUrl ?? undefined) : undefined,
    documentName: m.type === 'DOCUMENT' ? ((m as any).mediaName ?? 'Document') : undefined,
    documentSize: undefined,
    reactions: m.reactions.map((r) => r.emoji),
    replyTo: undefined,
  }));
  const messages: ListItem[] = storeAsList.length > 0 ? storeAsList : localMessages;
  const setMessages = (updater: ListItem[] | ((prev: ListItem[]) => ListItem[])) => {
    if (typeof updater === 'function') setLocalMessages(updater);
    else setLocalMessages(updater);
  };

  const [inputText, setInputText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageEntry | null>(null);
  const [showAttachment, setShowAttachment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Search
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const searchRef = useRef<TextInput>(null);

  // Mute
  const [showMuteSheet, setShowMuteSheet] = useState(false);

  // Wallpaper
  const [showWallpaperSheet, setShowWallpaperSheet] = useState(false);
  const [wallpaperColor, setWallpaperColor] = useState<string | null>(null);

  // Load wallpaper from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(`@wallpaper_${chatId}`).then((c) => { if (c) setWallpaperColor(c); });
  }, [chatId]);

  // Typing indicator — from store for others, local for self
  const [selfTyping, setSelfTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSet = typingMap[chatId] ?? new Set<string>();
  const othersTyping = [...typingSet].filter((uid) => uid !== selfId);
  const isTyping = othersTyping.length > 0;

  // Presence: check the partner's userId (for DMs, chatId is the contactId)
  const partnerPresence = !isGroup ? presenceMap[chatId] : undefined;
  const presenceLabel = partnerPresence?.status === 'online' ? 'online' : 'offline';

  // Mark messages read on mount / when new messages arrive
  useEffect(() => {
    if (!storeMessages?.length) return;
    const unread = storeMessages
      .filter((m) => m.senderId !== selfId && !m.readBy.includes(selfId))
      .map((m) => m.id);
    if (unread.length) emitReadMessages(chatId, unread);
  }, [storeMessages?.length]);

  // ── upload / voice recording state ────────────────────────────────────────
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const swipeRefs = useRef<Record<string, Swipeable | null>>({});
  const oldestMsgId = useRef<string | undefined>(undefined);
  const loadingMore = useRef(false);

  // Load initial messages from API on mount
  useEffect(() => {
    loadMessages();
  }, [chatId]);

  async function loadMessages(cursor?: string) {
    if (loadingMore.current) return;
    loadingMore.current = true;
    try {
      const msgs = await fetchMessages(chatId, cursor);
      if (msgs.length === 0) return;
      const storeMsgs = msgs.map((m) => apiMessageToStore(m, chatId));
      useChatStore.getState().prependMessages(chatId, storeMsgs);
      // track oldest for pagination
      const oldest = storeMsgs[storeMsgs.length - 1];
      if (oldest) oldestMsgId.current = oldest.id;
    } catch {
      // server unreachable — mock data already shown
    } finally {
      loadingMore.current = false;
    }
  }

  function handleLoadMore() {
    if (oldestMsgId.current) loadMessages(oldestMsgId.current);
  }

  const hasText = inputText.trim().length > 0;

  const handleSend = useCallback(async () => {
    if (!hasText) return;
    const localId = makeId();
    const text = inputText.trim();
    const replyToId = replyTo?.id;

    // Optimistic local update (shown immediately)
    const optimistic: MessageEntry = {
      _type: 'message',
      id: localId,
      kind: 'text',
      isOutgoing: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      text,
      replyTo: replyTo
        ? { id: replyTo.id, name: 'You', text: replyTo.text ?? replyTo.documentName ?? '' }
        : undefined,
    };
    setLocalMessages((prev) => [optimistic, ...prev]);
    setInputText('');
    setReplyTo(null);
    emitTypingStop(chatId);
    setSelfTyping(false);

    // Fire-and-forget to server; on success server broadcasts message:new which updates chatStore
    emitSendMessage({ localId, chatId, type: 'TEXT', content: text, replyToId });
  }, [hasText, inputText, replyTo, chatId]);

  function handleInputChange(text: string) {
    setInputText(text);
    if (text.length > 0 && !selfTyping) {
      setSelfTyping(true);
      emitTypingStart(chatId);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setSelfTyping(false);
      emitTypingStop(chatId);
    }, 2000);
  }

  // ── media upload helpers ────────────────────────────────────────────────────

  async function sendMediaMessage(
    uri: string,
    name: string,
    mimeType: string,
    msgType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'VOICE',
  ) {
    const localId = makeId();

    // Optimistic bubble
    const kind: MessageEntry['kind'] =
      msgType === 'IMAGE' || msgType === 'VIDEO' ? 'image'
      : msgType === 'VOICE' || msgType === 'AUDIO' ? 'voice'
      : 'document';

    const optimistic: MessageEntry = {
      _type: 'message',
      id: localId,
      kind,
      isOutgoing: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      text: undefined,
      imageUri: kind === 'image' ? uri : undefined,
      documentName: kind === 'document' ? name : undefined,
    };
    setLocalMessages((prev) => [optimistic, ...prev]);
    setUploadingIds((s) => new Set(s).add(localId));

    try {
      const result = await uploadMedia(uri, name, mimeType);

      // Socket send → server stores + broadcasts message:new
      emitSendMessage({
        localId,
        chatId,
        type: msgType,
        content: result.name,
      });

      // Patch the optimistic bubble with real URL
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === localId && m._type === 'message'
            ? { ...m, imageUri: kind === 'image' ? result.url : m.imageUri }
            : m
        )
      );
    } catch (err: any) {
      showError('Upload failed', err?.message);
      setLocalMessages((prev) => prev.filter((m) => m.id !== localId));
    } finally {
      setUploadingIds((s) => { const n = new Set(s); n.delete(localId); return n; });
    }
  }

  async function handlePickGallery() {
    setShowAttachment(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Permission denied', 'Gallery access is required'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as const,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    const name = asset.fileName ?? `media_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
    const mime = isVideo ? 'video/mp4' : 'image/jpeg';
    await sendMediaMessage(asset.uri, name, mime, isVideo ? 'VIDEO' : 'IMAGE');
  }

  async function handlePickDocument() {
    setShowAttachment(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await sendMediaMessage(
      asset.uri,
      asset.name,
      asset.mimeType ?? 'application/octet-stream',
      'DOCUMENT',
    );
  }

  async function handlePickAudio() {
    setShowAttachment(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/aac', 'audio/mp4', 'audio/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await sendMediaMessage(
      asset.uri,
      asset.name,
      asset.mimeType ?? 'audio/mpeg',
      'AUDIO',
    );
  }

  // ── Voice note recording ────────────────────────────────────────────────────

  async function startRecording() {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) { showError('Permission denied', 'Microphone access is required'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err: any) {
      showError('Recording failed', err?.message);
    }
  }

  async function stopRecording() {
    if (!isRecording) return;
    setIsRecording(false);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      if (uri) {
        await sendMediaMessage(uri, `voice_${Date.now()}.m4a`, 'audio/mp4', 'VOICE');
      }
    } catch (err: any) {
      showError('Could not send voice note', err?.message);
    }
  }

  const handleLongPress = useCallback((msg: MessageEntry) => {
    setSelectedId(msg.id);
  }, []);

  const handleSwipeReply = useCallback((msg: MessageEntry) => {
    setReplyTo(msg);
    swipeRefs.current[msg.id]?.close();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── render list item ────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item._type === 'date') {
      return (
        <View style={chipStyles.wrap}>
          <View style={[chipStyles.chip, { backgroundColor: colors.bubbleIncoming }]}>
            <Text style={[chipStyles.text, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        </View>
      );
    }

    if (item._type === 'system') {
      return (
        <View style={chipStyles.wrap}>
          <View style={[chipStyles.sysChip, { backgroundColor: colors.bubbleIncoming }]}>
            <Text style={[chipStyles.sysText, { color: colors.textSecondary }]}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const msg = item;
    const isOut = msg.isOutgoing;
    const isSelected = selectedId === msg.id;
    const isSearchMatch = searchVisible && searchQuery && searchMatches[searchMatchIndex] === msg.id;
    const bg = isSearchMatch ? colors.accentAmber : (isOut ? colors.bubbleSent : colors.bubbleIncoming);
    const txtColor = isOut ? '#FFFFFF' : colors.textPrimary;
    const metaColor = isOut ? 'rgba(255,255,255,0.7)' : colors.textSecondary;
    const tickColor = msg.status === 'read' ? '#3D5AFE' : metaColor;
    const nameColor = msg.senderId ? senderColor(msg.senderId) : colors.accentTeal;

    const bubble = (
      <Pressable
        onLongPress={() => handleLongPress(msg)}
        onPress={() => selectedId && setSelectedId(null)}
        style={[
          bubbleStyles.wrapper,
          isOut ? bubbleStyles.out : bubbleStyles.in,
          isSelected && { backgroundColor: colors.accentAmber + '33' },
        ]}
      >
        {msg.forwardedFrom && (
          <View style={[bubbleStyles.forwarded, { borderColor: colors.accentTeal + '60' }]}>
            <Ionicons name="arrow-redo" size={12} color={metaColor} />
            <Text style={[bubbleStyles.forwardText, { color: metaColor }]}>
              Forwarded from {msg.forwardedFrom}
            </Text>
          </View>
        )}

        <View style={[
          bubbleStyles.bubble,
          { backgroundColor: bg },
          isOut ? bubbleStyles.tailOut : bubbleStyles.tailIn,
        ]}>
          {/* Group sender name label */}
          {isGroup && !isOut && msg.senderName && (
            <Text style={[bubbleStyles.senderName, { color: nameColor }]}>{msg.senderName}</Text>
          )}

          {msg.replyTo && (
            <View style={[bubbleStyles.replyBar, { borderLeftColor: colors.accentTeal, backgroundColor: isOut ? 'rgba(0,0,0,0.15)' : colors.border + '80' }]}>
              <Text style={[bubbleStyles.replyName, { color: colors.accentTeal }]}>{msg.replyTo.name}</Text>
              <Text style={[bubbleStyles.replyText, { color: metaColor }]} numberOfLines={1}>{msg.replyTo.text}</Text>
            </View>
          )}

          {msg.kind === 'image' && msg.imageUri && (
            <Image source={{ uri: msg.imageUri }} style={bubbleStyles.image} contentFit="cover" />
          )}

          {msg.kind === 'voice' && (
            <View style={bubbleStyles.voiceRow}>
              <TouchableOpacity style={[bubbleStyles.playBtn, { backgroundColor: isOut ? 'rgba(255,255,255,0.25)' : '#3D5AFE' }]}>
                <Ionicons name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <VoiceWaveform color={isOut ? 'rgba(255,255,255,0.7)' : '#14213D'} />
              <Text style={[bubbleStyles.voiceDur, { color: metaColor }]}>{msg.voiceDuration}</Text>
            </View>
          )}

          {msg.kind === 'document' && (
            <TouchableOpacity style={bubbleStyles.docRow}>
              <View style={[bubbleStyles.docIcon, { backgroundColor: isOut ? 'rgba(255,255,255,0.2)' : colors.primary + '22' }]}>
                <Ionicons name="document-text" size={22} color={isOut ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[bubbleStyles.docName, { color: txtColor }]} numberOfLines={1}>{msg.documentName}</Text>
                <Text style={[bubbleStyles.docSize, { color: metaColor }]}>{msg.documentSize}</Text>
              </View>
            </TouchableOpacity>
          )}

          {msg.kind === 'link' && msg.linkPreview && (
            <LinkCard
              preview={msg.linkPreview}
              textColor={txtColor}
              borderColor={isOut ? 'rgba(255,255,255,0.6)' : colors.accentTeal}
            />
          )}

          {(msg.text || msg.imageCaption) && (
            <Text style={[bubbleStyles.text, { color: txtColor }]}>
              {msg.text ?? msg.imageCaption}
            </Text>
          )}

          {uploadingIds.has(msg.id) ? (
            <View style={bubbleStyles.uploadingOverlay}>
              <ActivityIndicator color="#FFFFFF" size="small" />
            </View>
          ) : null}

          <View style={[bubbleStyles.meta, isOut ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
            <Text style={[bubbleStyles.time, { color: isOut ? metaColor : '#8892B0' }]}>{msg.timestamp}</Text>
            {isOut && !uploadingIds.has(msg.id) && (
              <Ionicons
                name={msg.status === 'sent' ? 'checkmark' : 'checkmark-done'}
                size={13}
                color={tickColor}
              />
            )}
          </View>
        </View>

        {msg.reactions && msg.reactions.length > 0 && (
          <View style={[bubbleStyles.reactions, isOut ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
            <View style={[bubbleStyles.reactionPill, { backgroundColor: colors.surface }]}>
              {msg.reactions.map((r, i) => (
                <Text key={i} style={bubbleStyles.reactionEmoji}>{r}</Text>
              ))}
            </View>
          </View>
        )}
      </Pressable>
    );

    return (
      <Swipeable
        ref={(r) => { swipeRefs.current[msg.id] = r; }}
        renderLeftActions={() => (
          <View style={bubbleStyles.replyAction}>
            <Ionicons name="arrow-undo" size={20} color={colors.primary} />
          </View>
        )}
        onSwipeableOpen={(dir) => { if (dir === 'left') handleSwipeReply(msg); }}
        overshootLeft={false}
        leftThreshold={60}
      >
        {bubble}
      </Swipeable>
    );
  }, [colors, selectedId, isGroup, handleLongPress, handleSwipeReply, uploadingIds]);

  // ── search / mute / wallpaper helpers ────────────────────────────────────

  const searchMatches = useMemo<string[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m): m is MessageEntry => m._type === 'message' && !!m.text?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  function openSearch() {
    setShowMenu(false);
    setSearchVisible(true);
    setSearchQuery('');
    setSearchMatchIndex(0);
    setTimeout(() => searchRef.current?.focus(), 150);
  }

  function closeSearch() {
    setSearchVisible(false);
    setSearchQuery('');
    setSearchMatchIndex(0);
  }

  async function handleMute(durationMs: number | null) {
    setShowMuteSheet(false);
    const mutedUntil = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;
    try {
      await updateChatSettings(chatId, { isMuted: true });
      showSuccess(durationMs ? 'Notifications muted' : 'Notifications muted always');
    } catch {
      showError('Could not mute notifications');
    }
  }

  const WALLPAPER_COLORS = ['#F6F7FB', '#E8F5E9', '#FFF3E0', '#E3F2FD', '#FCE4EC', '#F3E5F5'];

  async function handleWallpaper(color: string) {
    setWallpaperColor(color);
    setShowWallpaperSheet(false);
    await AsyncStorage.setItem(`@wallpaper_${chatId}`, color);
    showSuccess('Wallpaper updated');
  }

  // ── menu items differ for groups vs 1:1 ──────────────────────────────────

  const MENU_ITEMS_GROUP = [
    { label: 'Group info',          action: () => { setShowMenu(false); router.push(`/chat/${chatId}/info`); } },
    { label: 'Search',              action: openSearch },
    { label: 'Mute notifications',  action: () => { setShowMenu(false); setShowMuteSheet(true); } },
    { label: 'Wallpaper',           action: () => { setShowMenu(false); setShowWallpaperSheet(true); } },
    { label: 'More',                action: () => { setShowMenu(false); showComingSoon(); } },
  ];

  const MENU_ITEMS_DM = [
    { label: 'View contact',        action: () => { setShowMenu(false); router.push(`/contact/${chatId}/info`); } },
    { label: 'Search',              action: openSearch },
    { label: 'Mute notifications',  action: () => { setShowMenu(false); setShowMuteSheet(true); } },
    { label: 'Wallpaper',           action: () => { setShowMenu(false); setShowWallpaperSheet(true); } },
    { label: 'More',                action: () => { setShowMenu(false); showComingSoon(); } },
  ];

  const menuItems = isGroup ? MENU_ITEMS_GROUP : MENU_ITEMS_DM;

  const ATTACHMENT_ITEMS = [
    { icon: 'document-text' as const, label: 'Document', color: '#5856D6', onPress: handlePickDocument },
    { icon: 'camera' as const,        label: 'Camera',   color: '#FF6B35', onPress: () => { setShowAttachment(false); showComingSoon('Camera'); } },
    { icon: 'image' as const,         label: 'Gallery',  color: '#FF2D55', onPress: handlePickGallery },
    { icon: 'musical-notes' as const, label: 'Audio',    color: '#FF9500', onPress: handlePickAudio },
    { icon: 'location' as const,      label: 'Location', color: '#34C759', onPress: () => { setShowAttachment(false); showComingSoon('Location'); } },
    { icon: 'person' as const,        label: 'Contact',  color: '#007AFF', onPress: () => { setShowAttachment(false); showComingSoon('Contact'); } },
  ];

  // ── selection bar ─────────────────────────────────────────────────────────

  async function forwardToVault() {
    const msg = messages.find((m) => m._type === 'message' && m.id === selectedId) as MessageEntry | undefined;
    const text = msg?.text ?? msg?.documentName ?? '';
    if (!text) { setSelectedId(null); return; }
    const raw = await AsyncStorage.getItem('@vault_messages');
    const existing = raw ? JSON.parse(raw) : [];
    const entry = {
      id: `vault-${Date.now()}-fwd`,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    await AsyncStorage.setItem('@vault_messages', JSON.stringify([entry, ...existing]));
    setSelectedId(null);
    showComingSoon('Saved to Vault ✓');
  }

  async function handleSelectionReply() {
    const msg = messages.find((m) => m._type === 'message' && m.id === selectedId) as MessageEntry | undefined;
    if (!msg) return;
    setReplyTo(msg);
    setSelectedId(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSelectionCopy() {
    const msg = messages.find((m) => m._type === 'message' && m.id === selectedId) as MessageEntry | undefined;
    const text = msg?.text ?? msg?.documentName ?? '';
    if (text) {
      await Clipboard.setStringAsync(text);
      showSuccess('Copied to clipboard');
    }
    setSelectedId(null);
  }

  async function handleSelectionStar() {
    const msgId = selectedId;
    if (!msgId) return;
    setSelectedId(null);
    try {
      await starMessage(msgId);
      showSuccess('Message starred');
    } catch {
      showError('Could not star message');
    }
  }

  function handleSelectionDelete() {
    const msgId = selectedId;
    if (!msgId) return;
    const msg = messages.find((m) => m._type === 'message' && m.id === msgId) as MessageEntry | undefined;
    const isOwn = msg?.isOutgoing ?? false;
    setSelectedId(null);

    Alert.alert('Delete message', 'This will delete the message.', [
      { text: 'Cancel', style: 'cancel' },
      ...(isOwn ? [{ text: 'Delete for everyone', style: 'destructive' as const, onPress: async () => {
        setLocalMessages((prev) => prev.filter((m) => m.id !== msgId));
        try { await deleteMessage(msgId, true); } catch {}
      }}] : []),
      { text: 'Delete for me', style: 'destructive', onPress: async () => {
        setLocalMessages((prev) => prev.filter((m) => m.id !== msgId));
        try { await deleteMessage(msgId, false); } catch {}
      }},
    ]);
  }

  const SelectionBar = () => (
    <View style={[selStyles.bar, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
      <TouchableOpacity onPress={() => setSelectedId(null)}>
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={selStyles.actions}>
        <TouchableOpacity style={selStyles.btn} onPress={forwardToVault}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={handleSelectionReply}>
          <Ionicons name="arrow-undo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={() => { setSelectedId(null); router.push({ pathname: '/forward', params: { messageId: selectedId ?? '' } }); }}>
          <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={handleSelectionCopy}>
          <Ionicons name="copy-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={handleSelectionStar}>
          <Ionicons name="star-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={handleSelectionDelete}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={selStyles.btn} onPress={() => { router.push({ pathname: '/message/[id]/info', params: { id: selectedId ?? '' } }); setSelectedId(null); }}>
          <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      {selectedId ? (
        <SelectionBar />
      ) : (
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Avatar: group photo or initials */}
          {isGroup && group.groupPhotoUri ? (
            <TouchableOpacity onPress={() => router.push(`/chat/${chatId}/info`)}>
              <Image source={{ uri: group.groupPhotoUri }} style={styles.groupAvatar} contentFit="cover" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={isGroup ? () => router.push(`/chat/${chatId}/info`) : undefined}>
              <Avatar name={chatName} size="sm" isGroup={isGroup} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerMid}
            onPress={isGroup ? () => router.push(`/chat/${chatId}/info`) : undefined}
            activeOpacity={isGroup ? 0.7 : 1}
          >
            <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
            <Text style={[styles.headerSub, !isGroup && !isTyping && presenceLabel === 'online' && { color: '#4ADE80' }]} numberOfLines={1}>
              {isGroup ? groupSubtitle : (isTyping ? 'typing…' : presenceLabel)}
            </Text>
          </TouchableOpacity>

          {!isGroup && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push(`/call/video/${chatId}`)}
              accessibilityLabel="Video call"
            >
              <Ionicons name="videocam-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push(`/call/voice/${chatId}`)}
            accessibilityLabel="Voice call"
          >
            <Ionicons name="call-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMenu(true)} accessibilityLabel="More options">
            <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Search bar ── */}
      {searchVisible && (
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={closeSearch}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            ref={searchRef}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search messages…"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(t) => { setSearchQuery(t); setSearchMatchIndex(0); }}
            returnKeyType="search"
          />
          {searchMatches.length > 0 && (
            <Text style={[textStyles.caption, { color: colors.textSecondary, minWidth: 40, textAlign: 'right' }]}>
              {searchMatchIndex + 1}/{searchMatches.length}
            </Text>
          )}
          <TouchableOpacity
            disabled={searchMatches.length === 0}
            onPress={() => setSearchMatchIndex((i) => (i > 0 ? i - 1 : searchMatches.length - 1))}
          >
            <Ionicons name="chevron-up" size={22} color={searchMatches.length > 0 ? colors.primary : colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={searchMatches.length === 0}
            onPress={() => setSearchMatchIndex((i) => (i < searchMatches.length - 1 ? i + 1 : 0))}
          >
            <Ionicons name="chevron-down" size={22} color={searchMatches.length > 0 ? colors.primary : colors.border} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Body: background + messages + input ── */}
      <ChatBackground bgColor={wallpaperColor}>
      {/* ── Message list ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={[styles.listContent, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => selectedId && setSelectedId(null)}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />

      {/* ── Reply preview bar ── */}
      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.replyStripe, { backgroundColor: colors.accentTeal }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyPreviewName, { color: colors.accentTeal }]}>
              {replyTo.isOutgoing ? 'You' : (replyTo.senderName ?? chatName)}
            </Text>
            <Text style={[styles.replyPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
              {replyTo.text ?? replyTo.documentName ?? 'Attachment'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Input bar ── */}
      <View style={[styles.inputBar, {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom + 4,
      }]}>
        <TouchableOpacity style={styles.inputIcon}>
          <Ionicons name="happy-outline" size={24} color="#3D5AFE" />
        </TouchableOpacity>

        <View style={[styles.inputPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.inputField, { color: colors.textPrimary }]}
            placeholder={isGroup ? `Message ${chatName}` : 'Message'}
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={4000}
            returnKeyType="default"
          />
          {!hasText && (
            <TouchableOpacity onPress={() => showComingSoon('Camera')} accessibilityLabel="Open camera">
              <Ionicons name="camera-outline" size={22} color="#3D5AFE" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.inputIcon} onPress={() => setShowAttachment(true)}>
          <Ionicons name="attach" size={24} color="#3D5AFE" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: isRecording ? '#FF2D55' : colors.accentAmber }]}
          onPress={hasText ? handleSend : undefined}
          onLongPress={!hasText ? startRecording : undefined}
          onPressOut={isRecording ? stopRecording : undefined}
          delayLongPress={200}
          activeOpacity={0.8}
        >
          {isRecording
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <Ionicons name={hasText ? 'send' : 'mic'} size={20} color="#FFFFFF" />
          }
        </TouchableOpacity>
      </View>
      </ChatBackground>

      {/* ── Attachment sheet ── */}
      <Modal visible={showAttachment} transparent animationType="slide" onRequestClose={() => setShowAttachment(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowAttachment(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: spacing.lg }]}>Share</Text>
          <View style={styles.attachGrid}>
            {ATTACHMENT_ITEMS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.attachItem}
                onPress={a.onPress}
              >
                <View style={[styles.attachIcon, { backgroundColor: a.color }]}>
                  <Ionicons name={a.icon} size={26} color="#FFFFFF" />
                </View>
                <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 6 }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Overflow menu ── */}
      <Modal visible={showMenu} transparent animationType="slide" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>{chatName}</Text>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { borderTopColor: colors.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth }]}
              onPress={item.action}
            >
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── Mute sheet ── */}
      <Modal visible={showMuteSheet} transparent animationType="slide" onRequestClose={() => setShowMuteSheet(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMuteSheet(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>Mute notifications</Text>
          {[
            { label: 'Mute for 8 hours', ms: 8 * 60 * 60 * 1000 },
            { label: 'Mute for 1 week', ms: 7 * 24 * 60 * 60 * 1000 },
            { label: 'Always mute', ms: null },
          ].map((opt, i) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.menuItem, { borderTopColor: colors.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth }]}
              onPress={() => handleMute(opt.ms)}
            >
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── Wallpaper sheet ── */}
      <Modal visible={showWallpaperSheet} transparent animationType="slide" onRequestClose={() => setShowWallpaperSheet(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowWallpaperSheet(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: spacing.lg }]}>Chat wallpaper</Text>
          <View style={styles.wallpaperGrid}>
            {WALLPAPER_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.wallpaperSwatch,
                  { backgroundColor: c, borderColor: wallpaperColor === c ? colors.primary : colors.border },
                  wallpaperColor === c && styles.wallpaperSwatchActive,
                ]}
                onPress={() => handleWallpaper(c)}
              />
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 6 },
  backBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },
  groupAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerMid: { flex: 1, paddingHorizontal: 8, justifyContent: 'center' },
  headerName: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#B9C2DA' },
  headerBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingHorizontal: 4, paddingTop: 4 },

  replyPreview: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  replyStripe: { width: 3, borderRadius: 2, minHeight: 32 },
  replyPreviewName: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  replyPreviewText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  replyClose: { padding: 4 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  inputIcon: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputPill: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
    maxHeight: 110, gap: 8,
  },
  inputField: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15,
    maxHeight: 92, paddingTop: 0, paddingBottom: 0,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-around' },
  attachItem: { alignItems: 'center', width: 72 },
  attachIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  menuItem: { paddingVertical: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, paddingVertical: 4 },

  wallpaperGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' },
  wallpaperSwatch: { width: 64, height: 64, borderRadius: 12, borderWidth: 2 },
  wallpaperSwatchActive: { borderWidth: 3 },
});

const bubbleStyles = StyleSheet.create({
  wrapper: { marginHorizontal: 4, marginVertical: 2 },
  out: { alignItems: 'flex-end' },
  in: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10, minWidth: 80 },
  tailOut: { borderBottomRightRadius: 4 },
  tailIn: { borderBottomLeftRadius: 4 },

  senderName: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 3 },
  text: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  replyBar: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 6, borderRadius: 2, padding: 4, gap: 2 },
  replyName: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  replyText: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  forwarded: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2, paddingBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  forwardText: { fontFamily: 'Inter_400Regular', fontSize: 11, fontStyle: 'italic' },

  image: { width: 220, height: 150, borderRadius: 10, marginBottom: 4 },

  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 160, paddingVertical: 2 },
  playBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  voiceDur: { fontFamily: 'Inter_500Medium', fontSize: 12, minWidth: 28 },

  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 },
  docIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docName: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  docSize: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },

  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactions: { marginTop: -6, marginBottom: 2 },
  reactionPill: {
    flexDirection: 'row', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3, gap: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  reactionEmoji: { fontSize: 14 },
  replyAction: { width: 60, alignItems: 'center', justifyContent: 'center' },
});

const chipStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  text: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  sysChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, maxWidth: '80%' },
  sysText: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

const selStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 12 },
  actions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});

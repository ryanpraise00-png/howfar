import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import ChatBackground from '@/src/components/ChatBackground';

// Mock data — wired to real API in later sprint
const MOCK_MEMBERS = [
  { id: 'm1', name: 'Adaeze Okonkwo', role: 'Host',   isOnline: true },
  { id: 'm2', name: 'Emeka Nwosu',    role: 'Member', isOnline: true },
  { id: 'm3', name: 'Fatima Aliyu',   role: 'Member', isOnline: false },
  { id: 'm4', name: 'Tunde Bakare',   role: 'Member', isOnline: false },
  { id: 'm5', name: 'Ngozi Eze',      role: 'Member', isOnline: true },
];

const MOCK_MESSAGES = [
  { id: 'msg1', text: 'Welcome everyone! 👋', sender: 'Adaeze Okonkwo', time: '10:00 AM', isMe: false },
  { id: 'msg2', text: 'Excited to be here!', sender: 'You', time: '10:01 AM', isMe: true },
  { id: 'msg3', text: 'Great circle idea 🙌', sender: 'Emeka Nwosu', time: '10:02 AM', isMe: false },
];

type Tab = 'chat' | 'members' | 'media';

const CIRCLE_COLORS: Record<string, string> = {
  c1: '#3D5AFE', c2: '#E91E8C', c3: '#14213D',
  d1: '#FF9500', d2: '#34C759', d3: '#5856D6', d4: '#FF2D55',
};

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const circleColor = CIRCLE_COLORS[id ?? ''] ?? '#3D5AFE';
  const circleName = id?.startsWith('c') ? ['Lagos Tech Hub', 'Naija Foodies', 'Remote Workers NG'][parseInt(id[1]) - 1] ?? 'Circle' : 'Circle';

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    setMessages((prev) => [...prev, {
      id: `msg-${Date.now()}`,
      text,
      sender: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    }]);
    setInputText('');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: circleColor }]}>
          <Text style={styles.headerAvatarText}>{circleName[0]}</Text>
        </View>
        <View style={styles.headerMid}>
          <Text style={styles.headerName} numberOfLines={1}>{circleName}</Text>
          <Text style={styles.headerSub}>{MOCK_MEMBERS.length} members</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="search-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['chat', 'members', 'media'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chat tab ── */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ChatBackground>
            <FlatList
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.msgList}
              renderItem={({ item }) => (
                <View style={[styles.bubbleWrap, item.isMe ? styles.bubbleOut : styles.bubbleIn]}>
                  {!item.isMe && (
                    <Text style={[styles.senderName, { color: circleColor }]}>{item.sender}</Text>
                  )}
                  <View style={[styles.bubble, { backgroundColor: item.isMe ? colors.bubbleSent : colors.bubbleIncoming }]}>
                    <Text style={[styles.bubbleText, { color: item.isMe ? '#FFFFFF' : colors.textPrimary }]}>{item.text}</Text>
                    <Text style={[styles.bubbleTime, { color: item.isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{item.time}</Text>
                  </View>
                </View>
              )}
            />
            <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 4 }]}>
              <View style={[styles.inputPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.inputField, { color: colors.textPrimary }]}
                  placeholder="Message the circle…"
                  placeholderTextColor={colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={4000}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.accentAmber : colors.border }]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ChatBackground>
        </KeyboardAvoidingView>
      )}

      {/* ── Members tab ── */}
      {activeTab === 'members' && (
        <FlatList
          data={MOCK_MEMBERS}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ListHeaderComponent={
            <TouchableOpacity
              style={[styles.inviteBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Share.share({ message: `Join "${circleName}" on HowFar! Download at https://howfar.app` })}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
              <Text style={[textStyles.body, { color: colors.primary }]}>Invite people</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
              <Avatar name={item.name} size="md" onlineIndicator={item.isOnline} />
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Inter_500Medium' }]}>{item.name}</Text>
              </View>
              {item.role === 'Host' && (
                <View style={[styles.roleBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.roleText, { color: colors.primary }]}>Host</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* ── Media tab ── */}
      {activeTab === 'media' && (
        <TouchableOpacity
          style={styles.mediaLink}
          onPress={() => router.push(`/chat/${id}/media` as any)}
        >
          <Ionicons name="images-outline" size={28} color={colors.primary} />
          <Text style={[textStyles.body, { color: colors.primary, marginTop: 8 }]}>View Media, Links & Docs</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 8, gap: 2 },
  backBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
  headerMid: { flex: 1, paddingHorizontal: 8 },
  headerName: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  headerBtn: { width: 40, height: 50, alignItems: 'center', justifyContent: 'center' },

  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  msgList: { paddingHorizontal: 8, paddingVertical: 12 },
  bubbleWrap: { marginVertical: 3 },
  bubbleOut: { alignItems: 'flex-end' },
  bubbleIn: { alignItems: 'flex-start' },
  senderName: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 2, marginLeft: 4 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4, textAlign: 'right' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  inputPill: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 110 },
  inputField: { fontFamily: 'Inter_400Regular', fontSize: 15, maxHeight: 92 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  roleText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  mediaLink: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

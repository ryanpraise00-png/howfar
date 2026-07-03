import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Dimensions, Animated, PanResponder,
} from 'react-native';
import { showSuccess, showError } from '@/src/lib/toast';
import { useState, useRef, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { relativeTime, type StatusItem, type ContactStatus } from '@/src/data/mockStatuses';
import { useAuthStore } from '@/src/store/authStore';
import { useStatusStore } from '@/src/store/statusStore';
import {
  recordStatusView,
  reactToStatus,
  fetchStatusViews,
  type ApiStatusPost,
  type ApiViewEntry,
  apiPostToStatusItem,
} from '@/src/services/status';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000;

const QUICK_REACTIONS = ['😍', '😂', '😮', '😢', '🙏', '🔥', '❤️', '👏'];

// ─── progress bar ─────────────────────────────────────────────────────────────

function ProgressBars({
  total,
  current,
  progress,
}: {
  total: number;
  current: number;
  progress: Animated.Value;
}) {
  return (
    <View style={barStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[barStyles.track, { backgroundColor: 'rgba(255,255,255,0.35)' }]}>
          {i < current && <View style={[barStyles.fill, { backgroundColor: '#FFFFFF' }]} />}
          {i === current && (
            <Animated.View
              style={[
                barStyles.fill,
                {
                  backgroundColor: '#FFFFFF',
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, paddingHorizontal: 10 },
  track: { flex: 1, height: 2.5, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

// ─── status content ───────────────────────────────────────────────────────────

function StatusContent({ item }: { item: StatusItem }) {
  if (item.kind === 'image' && item.imageUri) {
    return <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />;
  }
  return (
    <View style={[contentStyles.textBg, { backgroundColor: item.bgColor ?? '#14213D' }]}>
      <Text style={[contentStyles.statusText, { color: item.textColor ?? '#FFFFFF' }]}>
        {item.text}
      </Text>
    </View>
  );
}

const contentStyles = StyleSheet.create({
  textBg: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 32 },
  statusText: { fontFamily: 'Sora_700Bold', fontSize: 28, textAlign: 'center', lineHeight: 36 },
});

// ─── main viewer ─────────────────────────────────────────────────────────────

export default function StatusViewerScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { displayName, avatarUri } = useAuthStore();
  const { myStatus, feed } = useStatusStore();

  const isMe = contactId === 'me';

  // Build contact + items from store
  const contact: (ContactStatus & { posts?: ApiStatusPost[] }) | undefined = isMe
    ? { contactId: 'me', name: displayName || 'My status', items: myStatus.map(apiPostToStatusItem), viewed: false }
    : (() => {
        const entry = feed.find((c) => c.user.id === contactId);
        if (!entry) return undefined;
        return {
          contactId: entry.user.id,
          name: entry.user.name,
          avatarUri: entry.user.avatarUrl ?? undefined,
          items: entry.posts.map(apiPostToStatusItem),
          viewed: entry.posts.every((p) => p.hasViewed),
          posts: entry.posts,
        };
      })();

  // The raw API posts for recording views/reactions
  const apiPosts: ApiStatusPost[] = isMe
    ? myStatus
    : (feed.find((c) => c.user.id === contactId)?.posts ?? []);

  const items = contact?.items ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<ApiViewEntry[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const animRef  = useRef<Animated.CompositeAnimation | null>(null);
  const viewedIds = useRef<Set<string>>(new Set());

  const current = items[index];
  const currentPost = apiPosts[index];

  // Record view when item shown
  useEffect(() => {
    if (!currentPost || viewedIds.current.has(currentPost.id)) return;
    viewedIds.current.add(currentPost.id);
    recordStatusView(currentPost.id).catch(() => {});
  }, [currentPost?.id]);

  // Auto-advance timer
  useEffect(() => {
    if (items.length === 0) { router.back(); return; }
    progress.setValue(0);
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) {
        setIndex((i) => {
          if (i < items.length - 1) return i + 1;
          router.back();
          return i;
        });
      }
    });
    return () => animRef.current?.stop();
  }, [index, items.length]);

  useEffect(() => {
    if (paused) {
      animRef.current?.stop();
    } else {
      const val = (progress as any)._value ?? 0;
      animRef.current?.stop();
      animRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: STORY_DURATION * (1 - val),
        useNativeDriver: false,
      });
      animRef.current.start(({ finished }) => {
        if (finished) {
          setIndex((i) => {
            if (i < items.length - 1) return i + 1;
            router.back();
            return i;
          });
        }
      });
    }
  }, [paused]);

  const advance = () => {
    animRef.current?.stop();
    setIndex((i) => {
      if (i < items.length - 1) return i + 1;
      router.back();
      return i;
    });
  };

  const goBack = () => {
    animRef.current?.stop();
    setIndex((i) => {
      if (i > 0) return i - 1;
      router.back();
      return i;
    });
  };

  // Load viewers list (my status only)
  const handleToggleViewers = async () => {
    if (showViewers) { setShowViewers(false); return; }
    setShowViewers(true);
    if (!currentPost) return;
    setViewersLoading(true);
    try {
      const data = await fetchStatusViews(currentPost.id);
      setViewers(data);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  };

  // React to status
  const handleReact = useCallback(async (emoji: string) => {
    if (!currentPost) return;
    try {
      await reactToStatus(currentPost.id, emoji);
      showSuccess(`Reacted ${emoji}`);
    } catch (err: any) {
      showError('Reaction failed', err?.message);
    }
  }, [currentPost?.id]);

  // Swipe-down to dismiss
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && g.dy > 0,
      onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          router.back();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const opacity = pan.y.interpolate({ inputRange: [0, 200], outputRange: [1, 0.3], extrapolate: 'clamp' });

  if (!current) return null;

  return (
    <Animated.View
      style={[styles.root, { transform: [{ translateY: pan.y }], opacity }]}
      {...panResponder.panHandlers}
    >
      {/* Background content */}
      <View style={StyleSheet.absoluteFill}>
        <StatusContent item={current} />
        {current.caption && (
          <View style={[styles.captionWrap, { paddingBottom: insets.bottom + 120 }]}>
            <View style={styles.captionBg}>
              <Text style={styles.captionText}>{current.caption}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Gradient overlays */}
      <View style={styles.topGrad} pointerEvents="none" />

      {/* Progress bars */}
      <View style={[styles.progressWrap, { paddingTop: insets.top + 6 }]}>
        <ProgressBars total={items.length} current={index} progress={progress} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {(contact as any)?.avatarUri ? (
              <Image
                source={{ uri: (contact as any).avatarUri }}
                style={styles.headerAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.headerAvatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerAvatarText}>{contact?.name[0] ?? '?'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.headerName}>{contact?.name}</Text>
              <Text style={styles.headerTime}>{relativeTime(current.postedAt)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tap zones */}
      <View style={styles.tapLayer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.tapLeft}
          onPress={goBack}
          onPressIn={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.tapRight}
          onPress={advance}
          onPressIn={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          activeOpacity={1}
        />
      </View>

      {/* Bottom gradient overlay */}
      <View style={styles.bottomGrad} pointerEvents="none" />

      {/* "Viewed by" row (only for own status) */}
      {isMe && (
        <TouchableOpacity
          style={[styles.viewedRow, { bottom: insets.bottom + 80 }]}
          onPress={handleToggleViewers}
        >
          <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
          <Text style={styles.viewedText}>
            {viewersLoading ? '…' : `${viewers.length} view${viewers.length !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Expanded viewers list */}
      {isMe && showViewers && viewers.length > 0 && (
        <View style={[styles.viewersList, { bottom: insets.bottom + 110 }]}>
          {viewers.slice(0, 5).map((v) => (
            <View key={v.user.id} style={styles.viewerRow}>
              <View style={[styles.viewerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.viewerAvatarText}>{v.user.name[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.viewerName} numberOfLines={1}>{v.user.name}</Text>
              {v.reaction && <Text style={styles.viewerReaction}>{v.reaction}</Text>}
            </View>
          ))}
          {viewers.length > 5 && (
            <Text style={styles.moreViewers}>+{viewers.length - 5} more</Text>
          )}
        </View>
      )}

      {/* Bottom: reply + reactions */}
      {!isMe && (
        <View style={[styles.replySection, { paddingBottom: insets.bottom + 12 }]}>
          {/* Quick reactions */}
          <View style={styles.reactionsRow}>
            {QUICK_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionBtn}
                onPress={() => handleReact(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reply input */}
          <View style={styles.replyRow}>
            <TextInput
              style={[styles.replyInput, { color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)' }]}
              placeholder={`Reply to ${contact?.name ?? ''}…`}
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={reply}
              onChangeText={setReply}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (reply.trim()) {
                  showSuccess('Reply sent');
                  setReply('');
                }
              }}
            />
            {reply.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.replySend, { backgroundColor: colors.accentAmber }]}
                onPress={() => { showSuccess('Reply sent'); setReply(''); }}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  topGrad: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 160,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bottomGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 240,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  progressWrap: { position: 'absolute', top: 0, left: 0, right: 0, gap: 10 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 10,
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontFamily: 'Sora_700Bold', fontSize: 15, color: '#FFFFFF' },
  headerName: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  headerTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  tapLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1.5 },

  captionWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  captionBg: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  captionText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#FFFFFF', textAlign: 'center' },

  viewedRow: {
    position: 'absolute', left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  viewedText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#FFFFFF' },

  viewersList: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12, padding: 10, gap: 6,
  },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  viewerAvatarText: { fontFamily: 'Sora_700Bold', fontSize: 12, color: '#FFFFFF' },
  viewerName: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: '#FFFFFF' },
  viewerReaction: { fontSize: 18 },
  moreViewers: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 2,
  },

  replySection: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, gap: 8 },
  reactionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 },
  reactionBtn: { padding: 6 },
  reactionEmoji: { fontSize: 24 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyInput: {
    flex: 1, borderWidth: 1.5, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: 'Inter_400Regular', fontSize: 14,
  },
  replySend: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});

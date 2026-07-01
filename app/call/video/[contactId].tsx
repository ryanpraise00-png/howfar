import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, PanResponder, Dimensions,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockContacts } from '@/src/data/mockContacts';

const { width: W, height: H } = Dimensions.get('window');
const PIP_W = 100;
const PIP_H = 140;

type CallPhase = 'calling' | 'ringing' | 'connected' | 'ended';

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function getContactName(id: string): string {
  return mockContacts.find((c) => c.id === id)?.name ?? id;
}

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

const AVATAR_COLORS = ['#0B5E5C', '#1E9C8C', '#5856D6', '#FF6B35', '#FF2D55'];
function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── draggable PIP self-view ──────────────────────────────────────────────────

function PipView({ name }: { name: string }) {
  const pan = useRef(new Animated.ValueXY({ x: W - PIP_W - 16, y: 80 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // Snap to nearest corner
        const xVal = (pan.x as any)._value;
        const yVal = (pan.y as any)._value;
        const snapX = xVal < W / 2 ? 16 : W - PIP_W - 16;
        const snapY = yVal < H / 2 ? 80 : H - PIP_H - 100;
        Animated.spring(pan, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
          bounciness: 6,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        pipStyles.root,
        { transform: pan.getTranslateTransform() },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Simulated self-view — green-tinted dark */}
      <View style={[pipStyles.video, { backgroundColor: '#0a2a0a' }]}>
        <Text style={pipStyles.label}>{getInitial(name)}</Text>
      </View>
      {/* Flip camera overlay hint */}
      <View style={pipStyles.flipHint}>
        <Ionicons name="camera-reverse-outline" size={14} color="rgba(255,255,255,0.7)" />
      </View>
    </Animated.View>
  );
}

const pipStyles = StyleSheet.create({
  root: {
    position: 'absolute',
    width: PIP_W, height: PIP_H,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, elevation: 12,
    zIndex: 20,
  },
  video: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Sora_700Bold', fontSize: 28, color: 'rgba(255,255,255,0.5)' },
  flipHint: {
    position: 'absolute', top: 6, right: 6,
  },
});

// ─── control button ───────────────────────────────────────────────────────────

function CtrlBtn({
  icon, label, onPress, active = false, danger = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={ctrlStyles.wrap} onPress={onPress}>
      <View style={[
        ctrlStyles.circle,
        active && ctrlStyles.circleActive,
        danger && ctrlStyles.circleDanger,
      ]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={ctrlStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const ctrlStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, width: 66 },
  circle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  circleActive: { backgroundColor: 'rgba(255,255,255,0.42)' },
  circleDanger: { backgroundColor: '#EF4444', shadowColor: '#EF4444', shadowOpacity: 0.5, shadowRadius: 10, elevation: 4 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
});

// ─── main screen ─────────────────────────────────────────────────────────────

export default function VideoCallScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const insets = useSafeAreaInsets();

  const name = getContactName(contactId ?? '');
  const bg = avatarBg(name);

  const [phase, setPhase]     = useState<CallPhase>('calling');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted]     = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [minimized, setMinimized] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('ringing'), 1500);
    const t2 = setTimeout(() => {
      setPhase('connected');
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const statusLabel =
    phase === 'calling'   ? 'Calling…'
    : phase === 'ringing' ? 'Ringing…'
    : phase === 'ended'   ? 'Call ended'
    : formatSeconds(elapsed);

  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('ended');
    setTimeout(() => router.back(), 1200);
  };

  // Minimized pill
  if (minimized) {
    return (
      <View style={[miniStyles.root, { top: insets.top + 8, backgroundColor: bg }]}>
        <Ionicons name="videocam" size={16} color="rgba(255,255,255,0.8)" />
        <Text style={miniStyles.name} numberOfLines={1}>{name}</Text>
        <Text style={miniStyles.timer}>{statusLabel}</Text>
        <TouchableOpacity onPress={() => setMinimized(false)} style={miniStyles.iconBtn} accessibilityLabel="Expand call">
          <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEnd} style={[miniStyles.iconBtn, miniStyles.endBtn]} accessibilityLabel="End call">
          <Ionicons name="call" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Remote video area — placeholder */}
      <View style={[styles.remoteVideo, { backgroundColor: phase === 'connected' ? '#1a1a2e' : bg }]}>
        {phase !== 'connected' ? (
          <View style={styles.connectingAvatar}>
            <View style={[styles.avatarCircle, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
              <Text style={styles.avatarInitial}>{getInitial(name)}</Text>
            </View>
            <Text style={styles.connectingName}>{name}</Text>
            <Text style={styles.connectingStatus}>{statusLabel}</Text>
          </View>
        ) : (
          // Simulated remote video
          <View style={styles.remoteVideoInner}>
            <Ionicons name="person" size={80} color="rgba(255,255,255,0.1)" />
          </View>
        )}
      </View>

      {/* Draggable self-view PIP */}
      {phase === 'connected' && !videoOff && <PipView name="You" />}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => setMinimized(true)} accessibilityLabel="Minimize call">
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topName} numberOfLines={1}>{name}</Text>
          <Text style={styles.topStatus}>{statusLabel}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.controlRow}>
          <CtrlBtn
            icon={muted ? 'mic-off' : 'mic-outline'}
            label={muted ? 'Unmute' : 'Mute'}
            onPress={() => setMuted((m) => !m)}
            active={muted}
          />
          <CtrlBtn
            icon="camera-reverse-outline"
            label="Flip"
            onPress={() => {}}
          />
          <CtrlBtn
            icon={videoOff ? 'videocam-off-outline' : 'videocam-outline'}
            label={videoOff ? 'Video off' : 'Video'}
            onPress={() => setVideoOff((v) => !v)}
            active={videoOff}
          />
          <CtrlBtn
            icon={speaker ? 'volume-high' : 'volume-medium-outline'}
            label="Speaker"
            onPress={() => setSpeaker((s) => !s)}
            active={speaker}
          />
          <CtrlBtn
            icon="call"
            label="End"
            onPress={handleEnd}
            danger
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  remoteVideo: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  remoteVideoInner: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },

  connectingAvatar: { alignItems: 'center', gap: 16 },
  avatarCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: 'Sora_700Bold', fontSize: 48, color: '#FFFFFF' },
  connectingName: { fontFamily: 'Sora_700Bold', fontSize: 26, color: '#FFFFFF' },
  connectingStatus: { fontFamily: 'Inter_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.7)' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingBottom: 12,
  },
  topBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center', paddingTop: 6 },
  topName: { fontFamily: 'Sora_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  topStatus: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingTop: 16, paddingHorizontal: 8,
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around' },
});

const miniStyles = StyleSheet.create({
  root: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, paddingHorizontal: 14, paddingVertical: 10,
    gap: 8, zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  name: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: '#FFFFFF', flex: 1 },
  timer: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  endBtn: {
    borderRadius: 16, backgroundColor: '#EF4444',
  },
});

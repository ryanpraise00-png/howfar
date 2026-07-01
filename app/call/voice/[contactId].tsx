import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockContacts } from '@/src/data/mockContacts';

type CallPhase = 'calling' | 'ringing' | 'connected' | 'ended';

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function getContactName(id: string): string {
  const c = mockContacts.find((m) => m.id === id);
  return c?.name ?? id;
}

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

// Deterministic background color from name
const AVATAR_COLORS = ['#0B5E5C', '#1E9C8C', '#5856D6', '#FF6B35', '#FF2D55'];
function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function VoiceCallScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const insets = useSafeAreaInsets();

  const name = getContactName(contactId ?? '');
  const bg = avatarBg(name);

  const [phase, setPhase]   = useState<CallPhase>('calling');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted]   = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation for avatar ring
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // State machine
    const t1 = setTimeout(() => setPhase('ringing'),   1500);
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

  // Minimized pill UI
  if (minimized) {
    return (
      <View style={[miniStyles.root, { top: insets.top + 8, backgroundColor: bg }]}>
        <View style={miniStyles.dot} />
        <Text style={miniStyles.name} numberOfLines={1}>{name}</Text>
        <Text style={miniStyles.timer}>{statusLabel}</Text>
        <TouchableOpacity onPress={() => setMinimized(false)} style={miniStyles.expandBtn} accessibilityLabel="Expand call">
          <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEnd} style={miniStyles.endBtn} accessibilityLabel="End call">
          <Ionicons name="call" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Minimize + back */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.topBtn} onPress={() => setMinimized(true)} accessibilityLabel="Minimize call">
          <Ionicons name="chevron-down" size={26} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <Text style={styles.topLabel}>Voice call</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Animated.View
          style={[
            styles.avatarRing,
            { borderColor: 'rgba(255,255,255,0.25)', transform: [{ scale: pulse }] },
          ]}
        />
        <View style={[styles.avatar, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
          <Text style={styles.avatarInitial}>{getInitial(name)}</Text>
        </View>
      </View>

      <Text style={styles.contactName}>{name}</Text>
      <Text style={styles.statusText}>{statusLabel}</Text>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 40 }]}>
        {/* Row 1: secondary controls */}
        <View style={styles.controlRow}>
          <ControlButton
            icon={muted ? 'mic-off' : 'mic-outline'}
            label={muted ? 'Unmute' : 'Mute'}
            onPress={() => setMuted((m) => !m)}
            active={muted}
          />
          <ControlButton
            icon={speaker ? 'volume-high' : 'volume-medium-outline'}
            label="Speaker"
            onPress={() => setSpeaker((s) => !s)}
            active={speaker}
          />
          <ControlButton
            icon="person-add-outline"
            label="Add call"
            onPress={() => {}}
          />
          <ControlButton
            icon="keypad-outline"
            label="Keypad"
            onPress={() => {}}
          />
        </View>

        {/* End call */}
        <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.85} accessibilityLabel="End call">
          <Ionicons name="call" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ControlButton({
  icon, label, onPress, active = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity style={ctrlStyles.wrap} onPress={onPress}>
      <View style={[ctrlStyles.circle, active && ctrlStyles.circleActive]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={ctrlStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const ctrlStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, width: 72 },
  circle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  circleActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  label: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 16,
  },
  topBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topLabel: { flex: 1, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  avatarSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarRing: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2,
  },
  avatar: {
    width: 128, height: 128, borderRadius: 64,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: 'Sora_700Bold', fontSize: 52, color: '#FFFFFF' },

  contactName: {
    fontFamily: 'Sora_700Bold', fontSize: 28, color: '#FFFFFF',
    textAlign: 'center', marginBottom: 8, paddingHorizontal: 24,
  },
  statusText: {
    fontFamily: 'Inter_400Regular', fontSize: 16,
    color: 'rgba(255,255,255,0.75)', textAlign: 'center',
    marginBottom: 40,
  },

  controls: { paddingHorizontal: 24, gap: 32 },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around' },
  endBtn: {
    alignSelf: 'center',
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444', shadowOpacity: 0.5,
    shadowRadius: 12, elevation: 6,
  },
});

const miniStyles = StyleSheet.create({
  root: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, paddingHorizontal: 14, paddingVertical: 10,
    gap: 8, zIndex: 999,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  name: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: '#FFFFFF', flex: 1 },
  timer: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  expandBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  endBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
  },
});

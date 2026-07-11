import { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { IconButton } from '@/src/components';
import SectionDivider from '@/src/components/SectionDivider';
import { getAvatarColor } from '@/src/utils/avatarColor';

interface Circle {
  id: string;
  name: string;
  memberCount: number;
  lastActivity: string;
  unread: number;
  color: string;
}

interface DiscoverCircle {
  id: string;
  name: string;
  memberCount: number;
  color: string;
  joined?: boolean;
}

const MY_CIRCLES: Circle[] = [
  { id: 'c1', name: 'Lagos Tech Hub',    memberCount: 128, lastActivity: '2m ago',  unread: 5,  color: '#3D5AFE' },
  { id: 'c2', name: 'Naija Foodies',     memberCount:  64, lastActivity: '15m ago', unread: 0,  color: '#E91E8C' },
  { id: 'c3', name: 'Remote Workers NG', memberCount: 312, lastActivity: '1h ago',  unread: 12, color: '#14213D' },
];

const DISCOVER_INITIAL: DiscoverCircle[] = [
  { id: 'd1', name: 'Creative Arts',  memberCount:  89, color: '#FF9500' },
  { id: 'd2', name: 'Faith & Prayer', memberCount: 201, color: '#34C759' },
  { id: 'd3', name: 'Side Hustles',   memberCount: 455, color: '#5856D6' },
  { id: 'd4', name: 'Campus Connect', memberCount: 170, color: '#FF2D55' },
];

function CircleRow({ circle, colors }: { circle: Circle; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.circleRow, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/circle/${circle.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.circleAvatar, { backgroundColor: circle.color }]}>
        <Text style={styles.circleAvatarText}>{circle.name[0]}</Text>
      </View>
      <View style={styles.circleInfo}>
        <Text style={[styles.circleName, { color: colors.textPrimary }]} numberOfLines={1}>
          {circle.name}
        </Text>
        <Text style={[styles.circleMeta, { color: colors.textSecondary }]}>
          {circle.memberCount} members · {circle.lastActivity}
        </Text>
      </View>
      {circle.unread > 0 && (
        <View style={[styles.badge, { backgroundColor: '#3D5AFE' }]}>
          <Text style={styles.badgeText}>{circle.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function DiscoverCard({ circle, onJoin, colors }: { circle: DiscoverCircle; onJoin: (id: string) => void; colors: any }) {
  const stripColor = getAvatarColor(circle.name);
  return (
    <View style={[styles.discoverCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.discoverCover, { backgroundColor: stripColor }]}>
        <Text style={styles.discoverCoverText}>{circle.name[0]}</Text>
      </View>
      <Text style={[styles.discoverName, { color: colors.textPrimary }]} numberOfLines={1}>{circle.name}</Text>
      <Text style={[styles.discoverMeta, { color: colors.textSecondary }]}>{circle.memberCount} members</Text>
      <TouchableOpacity
        style={[styles.joinBtn, circle.joined ? { backgroundColor: colors.border } : styles.joinBtnActive]}
        onPress={() => onJoin(circle.id)}
        disabled={!!circle.joined}
      >
        <Text style={[styles.joinBtnText, { color: circle.joined ? colors.textSecondary : '#FFFFFF' }]}>
          {circle.joined ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyCircles({ colors, onDiscover }: { colors: any; onDiscover: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      {/* Three overlapping circles illustration */}
      <View style={styles.illustrationWrap}>
        <View style={[styles.illustrationCircle, { backgroundColor: '#14213D', left: 0, top: 16 }]} />
        <View style={[styles.illustrationCircle, { backgroundColor: '#F2A93B', left: 36, top: 16 }]} />
        <View style={[styles.illustrationCircle, { backgroundColor: '#3D5AFE', left: 18, top: 0 }]} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No circles yet</Text>
      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
        Join or create a circle to connect with communities around shared interests.
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: '#3D5AFE' }]}
        onPress={() => router.push('/circle/new' as any)}
      >
        <Text style={styles.emptyBtnText}>Create a Circle</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.emptyBtnOutline, { borderColor: '#3D5AFE' }]}
        onPress={onDiscover}
      >
        <Text style={[styles.emptyBtnOutlineText, { color: '#3D5AFE' }]}>Find Circles</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CommunitiesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [myCircles] = useState<Circle[]>(MY_CIRCLES);
  const [discover, setDiscover] = useState<DiscoverCircle[]>(DISCOVER_INITIAL);

  const handleJoin = (id: string) => setDiscover((prev) => prev.map((c) => (c.id === id ? { ...c, joined: true } : c)));
  const scrollToDiscover = () => scrollRef.current?.scrollToEnd({ animated: true });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header with navy gradient ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#14213D' }]} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.06)', bottom: '50%' }]} />
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Circles</Text>
          <View style={styles.headerRight}>
            <IconButton name="search-outline" color="#FFFFFF" onPress={() => {}} />
            <IconButton name="ellipsis-vertical-outline" color="#FFFFFF" onPress={() => {}} />
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {myCircles.length === 0 ? (
          <EmptyCircles colors={colors} onDiscover={scrollToDiscover} />
        ) : (
          <>
            <SectionDivider label="YOUR CIRCLES" color="#3D5AFE" />
            <View style={{ backgroundColor: colors.surface }}>
              {myCircles.map((c) => <CircleRow key={c.id} circle={c} colors={colors} />)}
            </View>
            <TouchableOpacity style={[styles.createBtn, { borderColor: '#3D5AFE' }]} onPress={() => router.push('/circle/new' as any)}>
              <Ionicons name="add-circle-outline" size={18} color="#3D5AFE" />
              <Text style={[styles.createBtnText, { color: '#3D5AFE' }]}>Create a Circle</Text>
            </TouchableOpacity>
          </>
        )}

        <SectionDivider label="DISCOVER" color="#3D5AFE" />
        <FlatList
          data={discover}
          horizontal
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item }) => <DiscoverCard circle={item} onJoin={handleJoin} colors={colors} />}
          scrollEnabled
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { overflow: 'hidden' },
  headerInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, height: 56 },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 20, color: '#FFFFFF', flex: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },
  circleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  circleAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  circleAvatarText: { fontFamily: 'Sora_700Bold', fontSize: 20, color: '#FFFFFF' },
  circleInfo: { flex: 1 },
  circleName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 2 },
  circleMeta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFFFFF' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16, padding: 12, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center' },
  createBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  discoverCard: { width: 150, borderRadius: 12, overflow: 'hidden', paddingBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  discoverCover: { height: 80, alignItems: 'center', justifyContent: 'center' },
  discoverCoverText: { fontFamily: 'Sora_700Bold', fontSize: 32, color: '#FFFFFF' },
  discoverName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginHorizontal: 10, marginTop: 8 },
  discoverMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginHorizontal: 10, marginBottom: 8 },
  joinBtn: { marginHorizontal: 10, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  joinBtnActive: { backgroundColor: '#3D5AFE' },
  joinBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  // Empty state
  emptyContainer: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  illustrationWrap: { width: 90, height: 72, marginBottom: 24, position: 'relative' },
  illustrationCircle: { position: 'absolute', width: 52, height: 52, borderRadius: 26, opacity: 0.15 },
  emptyTitle: { fontFamily: 'Sora_700Bold', fontSize: 20, marginBottom: 8 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  emptyBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  emptyBtnOutline: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  emptyBtnOutlineText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});

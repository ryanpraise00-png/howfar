import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import type { AppColors } from '@/src/theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  colors: AppColors;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style, colors }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: colors.border },
        { opacity },
        style,
      ]}
    />
  );
}

/** Shimmer placeholder matching a ChatRow layout */
export function ChatRowSkeleton({ colors }: { colors: AppColors }) {
  return (
    <View style={[skeletonStyles.chatRow, { borderBottomColor: colors.border }]}>
      <Skeleton width={44} height={44} borderRadius={22} colors={colors} />
      <View style={skeletonStyles.chatBody}>
        <Skeleton width="55%" height={14} borderRadius={6} colors={colors} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={12} borderRadius={5} colors={colors} />
      </View>
      <View style={skeletonStyles.chatRight}>
        <Skeleton width={36} height={11} borderRadius={5} colors={colors} style={{ marginBottom: 8 }} />
        <Skeleton width={20} height={20} borderRadius={10} colors={colors} />
      </View>
    </View>
  );
}

/** Shimmer placeholder for an incoming message bubble */
export function BubbleSkeleton({ colors }: { colors: AppColors }) {
  return (
    <View style={skeletonStyles.bubbleRow}>
      <Skeleton width={28} height={28} borderRadius={14} colors={colors} />
      <View style={skeletonStyles.bubbleBody}>
        <Skeleton width="70%" height={14} borderRadius={6} colors={colors} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={14} borderRadius={6} colors={colors} style={{ marginBottom: 6 }} />
        <Skeleton width="30%" height={11} borderRadius={5} colors={colors} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  chatBody: { flex: 1 },
  chatRight: { alignItems: 'flex-end' },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  bubbleBody: { flex: 1 },
});

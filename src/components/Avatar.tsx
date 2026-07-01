import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { lightColors } from '@/src/theme';

const SIZES = { sm: 32, md: 44, lg: 56 } as const;
const FONT_SIZES = { sm: 12, md: 16, lg: 20 } as const;
const DOT_SIZES = { sm: 8, md: 10, lg: 12 } as const;

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onlineIndicator?: boolean;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashColor(name: string) {
  const palette = ['#0B5E5C', '#1E9C8C', '#5856D6', '#AF52DE', '#FF6B35', '#2C7BB2'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ uri, name, size = 'md', onlineIndicator = false }: AvatarProps) {
  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const dotSize = DOT_SIZES[size];
  const bg = hashColor(name);

  return (
    <View style={{ width: dim, height: dim }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.base, styles.fallback, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }]}>
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {onlineIndicator && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontFamily: 'Sora_700Bold' },
  dot: {
    position: 'absolute',
    backgroundColor: lightColors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

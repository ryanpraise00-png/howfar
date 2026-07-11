import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { lightColors } from '@/src/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const xenAvatar = require('@/assets/images/xen-avatar.png');

const SIZES = { sm: 32, md: 44, lg: 56, xl: 72 } as const;
const ICON_SIZES = { sm: 16, md: 22, lg: 28, xl: 36 } as const;
const DOT_SIZES = { sm: 8, md: 10, lg: 12, xl: 14 } as const;

type AvatarType = 'user' | 'group' | 'xen' | 'vault';

const TYPE_CONFIG: Record<Exclude<AvatarType, 'xen'>, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string }> = {
  user:  { bg: '#14213D', icon: 'person',          iconColor: '#FFFFFF' },
  group: { bg: '#3D5AFE', icon: 'people',           iconColor: '#FFFFFF' },
  vault: { bg: '#14213D', icon: 'shield-checkmark', iconColor: '#FFFFFF' },
};

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onlineIndicator?: boolean;
  type?: AvatarType;
  isGroup?: boolean;
}

export function Avatar({
  uri,
  name,
  size = 'md',
  onlineIndicator = false,
  type,
  isGroup = false,
}: AvatarProps) {
  const dim = SIZES[size];
  const iconSize = ICON_SIZES[size];
  const dotSize = DOT_SIZES[size];

  const resolvedType: AvatarType = type ?? (isGroup ? 'group' : 'user');

  function renderFallback() {
    if (resolvedType === 'xen') {
      return (
        <Image
          source={xenAvatar}
          style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }]}
          contentFit="cover"
          transition={0}
        />
      );
    }
    const { bg, icon, iconColor } = TYPE_CONFIG[resolvedType];
    return (
      <View style={[styles.base, styles.fallback, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }]}>
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={{ width: dim, height: dim }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : renderFallback()}
      {onlineIndicator && (
        <View
          style={[
            styles.dot,
            { width: dotSize, height: dotSize, borderRadius: dotSize / 2, bottom: 0, right: 0 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    backgroundColor: lightColors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

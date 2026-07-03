import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps {
  name: IoniconName;
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function IconButton({
  name,
  size = 22,
  color = '#14213D',
  backgroundColor = 'transparent',
  onPress,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPress={onPress}
      activeOpacity={1}
      style={[styles.base, { backgroundColor }, style, animStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons name={name} size={size} color={color} />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

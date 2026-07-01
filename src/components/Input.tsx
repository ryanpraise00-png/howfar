import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ReactNode } from 'react';
import { lightColors } from '@/src/theme';
import type { AppColors } from '@/src/theme/colors';

interface PillProps extends TextInputProps {
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  colors?: AppColors;
  containerStyle?: ViewStyle;
}

function Pill({ leftSlot, rightSlot, colors = lightColors, containerStyle, style, ...rest }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }, containerStyle]}>
      {leftSlot && <View style={styles.slot}>{leftSlot}</View>}
      <TextInput
        style={[styles.input, { color: colors.textPrimary }, style]}
        placeholderTextColor={colors.textSecondary}
        {...rest}
      />
      {rightSlot && <View style={styles.slot}>{rightSlot}</View>}
    </View>
  );
}

export const Input = { Pill };

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    paddingVertical: 0,
  },
  slot: { justifyContent: 'center', alignItems: 'center' },
});

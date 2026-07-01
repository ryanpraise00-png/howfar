import { View } from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader, EmptyState } from '@/src/components';

export default function HelpScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Help" variant="teal" colors={colors} />
      <EmptyState icon="help-circle-outline" title="Help & Support" subtitle="Coming soon" colors={colors} />
    </View>
  );
}

import { View } from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader, EmptyState } from '@/src/components';

export default function StorageScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Storage" variant="teal" colors={colors} />
      <EmptyState icon="server-outline" title="Storage" subtitle="Coming soon" colors={colors} />
    </View>
  );
}

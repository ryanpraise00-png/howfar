import { View } from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader, EmptyState } from '@/src/components';

export default function StorageScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Storage and Data" variant="teal" colors={colors} />
      <EmptyState icon="server-outline" title="Storage and Data" subtitle="Coming soon" colors={colors} />
    </View>
  );
}

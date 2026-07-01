import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader, EmptyState, IconButton } from '@/src/components';

export default function CommunitiesScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Communities"
        variant="teal"
        showBack={false}
        colors={colors}
        rightSlot={
          <IconButton name="search-outline" color="#FFFFFF" onPress={() => {}} />
        }
      />
      <EmptyState
        icon="people-outline"
        title="Communities coming soon"
        subtitle="Group spaces for neighbourhoods, schools, and organisations — launching soon."
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

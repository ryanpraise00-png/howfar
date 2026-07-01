import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';
import { ScreenHeader } from '@/src/components';

// Stub — camera feature coming later
export default function CameraScreen() {
  const { colors, textStyles } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: '#000000' }]}>
      <ScreenHeader title="Camera" variant="white" colors={colors} />
      <View style={styles.body}>
        <Text style={[textStyles.body, { color: '#FFFFFF' }]}>Camera coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

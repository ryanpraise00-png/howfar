import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme';

export default function HomeScreen() {
  const { colors, textStyles } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[textStyles.display, { color: colors.primary }]}>HowFar</Text>

      {/* DEV ONLY — remove before shipping */}
      <TouchableOpacity
        style={[styles.devBtn, { borderColor: colors.primary }]}
        onPress={() => router.push('/theme-preview')}
      >
        <Text style={[textStyles.label, { color: colors.primary }]}>Theme Preview</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.devBtn, { borderColor: colors.accentTeal }]}
        onPress={() => router.push('/components-preview')}
      >
        <Text style={[textStyles.label, { color: colors.accentTeal }]}>Components Preview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  devBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});

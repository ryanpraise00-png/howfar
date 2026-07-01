import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, lightColors, darkColors, spacing as sp } from '@/src/theme';
import type { AppColors } from '@/src/theme/colors';

const COLOR_ENTRIES: { key: keyof AppColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'primaryDark', label: 'Primary Dark' },
  { key: 'accentTeal', label: 'Accent Teal' },
  { key: 'accentAmber', label: 'Accent Amber' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'bubbleIncoming', label: 'Bubble Incoming' },
  { key: 'bubbleSent', label: 'Bubble Sent' },
  { key: 'textPrimary', label: 'Text Primary' },
  { key: 'textSecondary', label: 'Text Secondary' },
  { key: 'border', label: 'Border' },
  { key: 'success', label: 'Success' },
  { key: 'error', label: 'Error' },
];

function SwatchRow({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: color, borderWidth: 1, borderColor: '#ccc' }]} />
      <View style={styles.swatchInfo}>
        <Text style={styles.swatchLabel}>{label}</Text>
        <Text style={styles.swatchHex}>{color}</Text>
      </View>
    </View>
  );
}

function PaletteSection({ title, colors }: { title: string; colors: AppColors }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {COLOR_ENTRIES.map(({ key, label }) => (
        <SwatchRow key={key} label={label} color={colors[key]} />
      ))}
    </View>
  );
}

export default function ThemePreview() {
  const { colors, textStyles, isDark } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[textStyles.display, { color: colors.textPrimary, marginBottom: sp.lg }]}>
        Theme Preview
      </Text>

      {/* ── Typography ── */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionTitle}>Typography</Text>
        <Text style={[textStyles.display, { color: colors.textPrimary }]}>Display — Sora Bold 28</Text>
        <Text style={[textStyles.title, { color: colors.textPrimary }]}>Title — Sora Bold 20</Text>
        <Text style={[textStyles.subtitle, { color: colors.textPrimary }]}>Subtitle — Sora SemiBold 16</Text>
        <Text style={[textStyles.body, { color: colors.textPrimary }]}>Body — Inter Regular 14</Text>
        <Text style={[textStyles.caption, { color: colors.textSecondary }]}>Caption — Inter Regular 12</Text>
        <Text style={[textStyles.label, { color: colors.textSecondary }]}>Label — Inter Medium 13</Text>
      </View>

      {/* ── Current palette ── */}
      <PaletteSection
        title={`Current Colors (${isDark ? 'Dark' : 'Light'})`}
        colors={colors}
      />

      {/* ── Both palettes side by side reference ── */}
      <PaletteSection title="Light Palette" colors={lightColors} />
      <PaletteSection title="Dark Palette" colors={darkColors} />

      {/* ── Buttons ── */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionTitle}>Buttons</Text>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={[textStyles.label, { color: colors.textOnPrimary }]}>Primary Button</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accentAmber }]}>
          <Text style={[textStyles.label, { color: '#1C1C1E' }]}>Accent Amber Button</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accentTeal }]}>
          <Text style={[textStyles.label, { color: colors.textOnPrimary }]}>Accent Teal Button</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary }]}
        >
          <Text style={[textStyles.label, { color: colors.primary }]}>Outline Button</Text>
        </TouchableOpacity>
      </View>

      {/* ── Chat bubbles preview ── */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionTitle}>Chat Bubbles</Text>
        <View style={styles.bubblesContainer}>
          <View style={[styles.bubble, styles.bubbleLeft, { backgroundColor: colors.bubbleIncoming }]}>
            <Text style={[textStyles.body, { color: colors.textPrimary }]}>Hey, how far are you?</Text>
            <Text style={[textStyles.caption, { color: colors.textSecondary }]}>9:41 AM</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleRight, { backgroundColor: colors.bubbleSent }]}>
            <Text style={[textStyles.body, { color: '#FFFFFF' }]}>About 5 minutes away!</Text>
            <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.7)' }]}>9:42 AM</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: sp.lg, paddingBottom: 60, gap: sp.lg },
  section: {
    borderRadius: 12,
    padding: sp.lg,
    gap: sp.sm,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: sp.xs,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  swatchInfo: { flex: 1 },
  swatchLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1C1C1E' },
  swatchHex: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B7280' },
  btn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubblesContainer: { gap: sp.sm },
  bubble: {
    maxWidth: '75%',
    padding: sp.md,
    borderRadius: 18,
    gap: 2,
  },
  bubbleLeft: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleRight: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
});

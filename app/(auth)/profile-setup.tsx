import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { ScreenHeader } from '@/src/components';
import { useAuthStore } from '@/src/store/authStore';
import { uploadAvatar } from '@/src/services/media';

export default function ProfileSetupScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const { displayName: savedName, about: savedAbout, setProfile, completeOnboarding } = useAuthStore();

  const [name, setName] = useState(savedName);
  const [about, setAbout] = useState(savedAbout || "Hey! I'm on HowFar");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      // Upload in background; use the returned URL if successful
      try {
        const { avatarUrl } = await uploadAvatar(uri);
        setUploadedAvatarUrl(avatarUrl);
      } catch {
        // silently ignore — use local URI as display
      }
    }
  }

  const isValid = name.trim().length >= 2;

  async function handleNext() {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      // Use uploaded URL if available, else local URI
      setProfile(name.trim(), about.trim(), uploadedAvatarUrl ?? avatarUri);
      // POST /api/auth/complete-profile + marks isOnboardingComplete = true
      await completeOnboarding(name.trim(), about.trim());
      router.replace('/(tabs)');
    } catch {
      // If backend is unreachable, still proceed locally
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }

  const initials = name.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Your profile" variant="white" colors={colors} showBack={false} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Avatar picker */}
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={[styles.avatar, { backgroundColor: colors.surface }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraBtn, { backgroundColor: colors.accentAmber }]}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
            Tap to add a profile photo
          </Text>

          {/* Name input */}
          <View style={styles.fieldGroup}>
            <Text style={[textStyles.label, { color: colors.textSecondary }]}>Display Name *</Text>
            <View style={[styles.inputBox, { borderColor: name ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={30}
                autoFocus
              />
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
                {name.length}/30
              </Text>
            </View>
          </View>

          {/* About input */}
          <View style={styles.fieldGroup}>
            <Text style={[textStyles.label, { color: colors.textSecondary }]}>About</Text>
            <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Hey! I'm on HowFar"
                placeholderTextColor={colors.textSecondary}
                value={about}
                onChangeText={setAbout}
                maxLength={80}
              />
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
                {about.length}/80
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: isValid ? colors.primary : colors.border, marginTop: spacing.lg },
            ]}
            onPress={handleNext}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.btnText, { color: isValid ? '#FFFFFF' : colors.textSecondary }]}>
                Next
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { alignItems: 'center', padding: 24, gap: 16 },
  avatarWrap: { marginTop: 16, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: 'Sora_700Bold', fontSize: 34, color: '#FFFFFF' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  fieldGroup: { width: '100%', gap: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  btn: { width: '100%', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: 'Sora_700Bold', fontSize: 15 },
});

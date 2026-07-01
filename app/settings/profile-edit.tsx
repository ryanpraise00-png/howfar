import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { showComingSoon, showError } from '@/src/lib/toast';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { useAuthStore } from '@/src/store/authStore';
import { uploadAvatar } from '@/src/services/media';

const ABOUT_PRESETS = ['Available', 'Busy', 'At work', 'Battery about to die 🪫', 'In a meeting', 'Sleeping 😴'];

export default function ProfileEditScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { displayName, about, avatarUri, phone, countryCode, setProfile } = useAuthStore();

  const [name, setName] = useState(displayName);
  const [aboutText, setAboutText] = useState(about);
  const [localAvatar, setLocalAvatar] = useState<string | null>(avatarUri);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isDirty = name !== displayName || aboutText !== about || localAvatar !== avatarUri;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Permission denied', 'Gallery access is required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setLocalAvatar(uri);
    setUploadingAvatar(true);
    try {
      const { avatarUrl } = await uploadAvatar(uri);
      setProfile(name.trim(), aboutText.trim(), avatarUrl);
    } catch (err: any) {
      showError('Avatar upload failed', err?.message);
      // Keep the local URI as fallback display
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    setProfile(name.trim(), aboutText.trim(), localAvatar);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        {isDirty && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            {localAvatar ? (
              <Image source={{ uri: localAvatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>
                  {name.trim() ? name.trim()[0].toUpperCase() : '?'}
                </Text>
              </View>
            )}
            {uploadingAvatar && (
              <View style={[StyleSheet.absoluteFillObject, styles.avatarOverlay]}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={17} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Name field */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>YOUR NAME</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
            returnKeyType="next"
          />
          <Text style={[styles.charHint, { color: colors.textSecondary }]}>{50 - name.length}</Text>
        </View>

        {/* About field */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>ABOUT</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.textPrimary, borderBottomColor: colors.primary }]}
            value={aboutText}
            onChangeText={setAboutText}
            placeholder="What's your status?"
            placeholderTextColor={colors.textSecondary}
            maxLength={139}
            returnKeyType="done"
          />
          <Text style={[styles.charHint, { color: colors.textSecondary }]}>{139 - aboutText.length}</Text>

          {/* Preset chips */}
          <View style={styles.presets}>
            {ABOUT_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetChip,
                  {
                    borderColor: aboutText === p ? colors.primary : colors.border,
                    backgroundColor: aboutText === p ? colors.primary + '12' : 'transparent',
                  },
                ]}
                onPress={() => setAboutText(p)}
              >
                <Text style={[styles.presetText, { color: aboutText === p ? colors.primary : colors.textSecondary }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Phone (read-only) */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.fieldLabel, { color: colors.primary }]}>PHONE</Text>
          <View style={styles.phoneRow}>
            <Text style={[styles.phoneText, { color: colors.textPrimary }]}>
              {countryCode} {phone}
            </Text>
            <TouchableOpacity onPress={() => showComingSoon('Change number')}>
              <Text style={[styles.changeLink, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 10, gap: 4,
  },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#FFFFFF' },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontFamily: 'Sora_700Bold', fontSize: 40, color: '#FFFFFF' },
  avatarOverlay: { borderRadius: 55, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },

  section: {
    marginHorizontal: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, letterSpacing: 0.6, marginBottom: 10 },
  fieldInput: {
    fontFamily: 'Inter_400Regular', fontSize: 16,
    borderBottomWidth: 1.5, paddingBottom: 8,
  },
  charHint: { fontFamily: 'Inter_400Regular', fontSize: 12, textAlign: 'right', marginTop: 4 },

  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  presetChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
  },
  presetText: { fontFamily: 'Inter_400Regular', fontSize: 13 },

  phoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  phoneText: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  changeLink: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});

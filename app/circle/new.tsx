import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { uploadAvatar } from '@/src/services/media';
import { api } from '@/src/services/api';
import { showError } from '@/src/lib/toast';

const INTERESTS = ['Tech', 'Sports', 'Music', 'Business', 'Education', 'Faith', 'Gaming', 'Food', 'Travel', 'Other'];

type Privacy = 'public' | 'private';

export default function NewCircleScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Step 2
  const [privacy, setPrivacy] = useState<Privacy>('public');

  // Step 3
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  function handlePickPhoto() {
    Alert.alert('Circle photo', 'Choose a source', [
      {
        text: 'Choose from gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { showError('Permission denied'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images' as const,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (result.canceled || !result.assets[0]) return;
          const uri = result.assets[0].uri;
          setPhotoUri(uri);
          setUploadingPhoto(true);
          try {
            const res = await uploadAvatar(uri);
            setAvatarUrl(res.avatarUrl);
          } catch {
            showError('Could not upload photo');
          } finally {
            setUploadingPhoto(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function toggleInterest(tag: string) {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const res = await api.post<{ id: string }>('/api/circles', {
        name: name.trim(),
        description: description.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
        privacy,
        interests: selectedInterests,
      });
      router.replace(`/circle/${res.id}` as any);
    } catch (err: any) {
      showError('Could not create circle', err?.message);
    } finally {
      setCreating(false);
    }
  }

  const canNext1 = name.trim().length >= 1;
  const canCreate = canNext1 && selectedInterests.length >= 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Circle</Text>
      </View>

      {/* Step indicator */}
      <View style={[styles.stepRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: s <= step ? colors.primary : colors.border }]}>
              <Text style={[styles.stepNum, { color: s <= step ? '#FFFFFF' : colors.textSecondary }]}>{s}</Text>
            </View>
            <Text style={[styles.stepLabel, { color: s === step ? colors.primary : colors.textSecondary }]}>
              {s === 1 ? 'Details' : s === 2 ? 'Privacy' : 'Interests'}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <>
            <View style={styles.photoWrap}>
              <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
                {photoUri ? (
                  <View>
                    <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
                    {uploadingPhoto && (
                      <View style={[StyleSheet.absoluteFillObject, styles.photoOverlay]}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="people-circle-outline" size={52} color={colors.textSecondary} />
                  </View>
                )}
                <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.nameInput, { color: colors.textPrimary }]}
                placeholder="Circle name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                maxLength={80}
                autoFocus
              />
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>{80 - name.length} characters remaining</Text>

            <View style={[styles.field, styles.descField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.descInput, { color: colors.textPrimary }]}
                placeholder="Describe this circle (optional)"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                maxLength={300}
                multiline
              />
            </View>
          </>
        )}

        {/* ── Step 2: Privacy ── */}
        {step === 2 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: 8, marginTop: 8 }]}>
              Who can join this circle?
            </Text>
            {([
              { value: 'public', icon: 'globe-outline', label: 'Public', desc: 'Anyone can find and join this circle' },
              { value: 'private', icon: 'lock-closed-outline', label: 'Private', desc: 'Only people you invite can join' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.privacyCard, { backgroundColor: colors.surface, borderColor: privacy === opt.value ? colors.primary : colors.border }]}
                onPress={() => setPrivacy(opt.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.privacyIcon, { backgroundColor: privacy === opt.value ? colors.primary + '18' : colors.border + '44' }]}>
                  <Ionicons name={opt.icon} size={24} color={privacy === opt.value ? colors.primary : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Inter_500Medium' }]}>{opt.label}</Text>
                  <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{opt.desc}</Text>
                </View>
                {privacy === opt.value && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 3: Interests ── */}
        {step === 3 && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: 4, marginTop: 8 }]}>
              Pick your circle's interests
            </Text>
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginBottom: 16 }]}>
              Select at least one
            </Text>
            <View style={styles.chips}>
              {INTERESTS.map((tag) => {
                const active = selectedInterests.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                    onPress={() => toggleInterest(tag)}
                  >
                    <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.textPrimary }]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Bottom button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: step < 3 ? (canNext1 ? colors.primary : colors.border) : (canCreate ? colors.accentAmber : colors.border) }]}
          onPress={step < 3 ? () => setStep(step + 1) : handleCreate}
          disabled={step === 1 ? !canNext1 : step === 3 ? !canCreate : false}
        >
          {creating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>{step < 3 ? 'Next' : 'Create Circle'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 8, gap: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },

  stepRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  stepLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  body: { paddingBottom: 48 },

  photoWrap: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  photo: { width: 110, height: 110, borderRadius: 55 },
  photoPlaceholder: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  photoOverlay: { borderRadius: 55, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },

  field: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  nameInput: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginHorizontal: 24, marginTop: 4 },
  descField: { marginTop: 12, minHeight: 80 },
  descInput: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlignVertical: 'top', minHeight: 56 },

  privacyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 12 },
  privacyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  actionBtn: { marginHorizontal: 20, marginTop: 32, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  actionBtnText: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
});

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { mockContacts } from '@/src/data/mockContacts';
import { createGroupChat } from '@/src/services/chats';
import { uploadAvatar } from '@/src/services/media';
import { showError } from '@/src/lib/toast';

export default function GroupDetailsScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { members: membersParam } = useLocalSearchParams<{ members: string }>();

  const memberIds = membersParam ? membersParam.split(',') : [];
  // memberIds may be API user IDs or mock contact IDs — look up display names from mock for now
  const memberContacts = mockContacts.filter((c) => memberIds.includes(c.id));

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [creating, setCreating] = useState(false);

  const canCreate = groupName.trim().length >= 1;

  const handlePickPhoto = () => {
    Alert.alert('Group photo', 'Choose a photo source', [
      {
        text: 'Take photo',
        onPress: () => router.push('/camera'),
      },
      {
        text: 'Choose from gallery',
        onPress: async () => {
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
  };

  const handleCreate = async () => {
    if (!canCreate || creating) return;
    setCreating(true);
    try {
      const chat = await createGroupChat(groupName.trim(), description.trim() || undefined, memberIds, avatarUrl ?? undefined);
      router.replace(`/chat/${chat.id}`);
    } catch (err: any) {
      showError('Failed to create group', err?.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* ── Photo picker ── */}
        <View style={styles.photoWrap}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
                {uploadingPhoto && (
                  <View style={[StyleSheet.absoluteFillObject, styles.photoSpinner]}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="people" size={48} color={colors.textSecondary} />
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Group name ── */}
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.nameInput, { color: colors.textPrimary }]}
            placeholder="Group name"
            placeholderTextColor={colors.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={100}
            autoFocus
            returnKeyType="next"
          />
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {100 - groupName.length} characters remaining
        </Text>

        {/* ── Description ── */}
        <View style={[styles.field, styles.descField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.descInput, { color: colors.textPrimary }]}
            placeholder="Group description (optional)"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            returnKeyType="done"
          />
        </View>

        {/* ── Member preview ── */}
        <Text style={[textStyles.label, { color: colors.textSecondary, marginHorizontal: 20, marginTop: 24, marginBottom: 8 }]}>
          PARTICIPANTS — {memberContacts.length + 1}
        </Text>
        <View style={[styles.membersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* You */}
          <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
            <Avatar name="You" size="md" />
            <Text style={[textStyles.body, { color: colors.textPrimary, fontFamily: 'Sora_600SemiBold' }]}>
              You
            </Text>
            <View style={[styles.adminBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
              <Text style={[styles.adminText, { color: colors.primary }]}>Admin</Text>
            </View>
          </View>
          {memberContacts.map((c, i) => (
            <View
              key={c.id}
              style={[styles.memberRow, i < memberContacts.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            >
              <Avatar name={c.name} size="md" onlineIndicator={c.isOnline} />
              <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1, fontFamily: 'Sora_600SemiBold' }]}>
                {c.name}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Create button ── */}
        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: canCreate ? colors.accentAmber : colors.border },
          ]}
          onPress={handleCreate}
          disabled={!canCreate}
          activeOpacity={0.85}
        >
          {creating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={22} color="#FFFFFF" />
              <Text style={styles.createText}>Create Group</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
    gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },

  body: { paddingBottom: 48 },

  photoWrap: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  photo: { width: 120, height: 120, borderRadius: 60 },
  photoSpinner: { borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },

  field: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nameInput: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginHorizontal: 24, marginTop: 4 },

  descField: { marginTop: 12, minHeight: 80 },
  descInput: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlignVertical: 'top', minHeight: 56 },

  membersCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  adminText: { fontFamily: 'Inter_500Medium', fontSize: 11 },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  createText: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
});

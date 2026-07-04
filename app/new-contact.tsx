import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { showError, showSuccess } from '@/src/lib/toast';
import { searchUsers, createDirectChat } from '@/src/services/chats';

export default function NewContactScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimName = name.trim();
    const trimPhone = phone.trim();

    if (!trimName) { showError('Enter a name'); return; }
    if (!trimPhone) { showError('Enter a phone number'); return; }

    setSaving(true);
    try {
      // Search for the user by name to get their userId
      const results = await searchUsers(trimName);
      const match = results[0];

      if (!match) {
        Alert.alert(
          'User not found',
          `No HowFar user found for "${trimName}". They may not have an account yet.`,
          [{ text: 'OK' }],
        );
        return;
      }

      // Open or create a direct chat with them
      const { chat } = await createDirectChat(match.id);
      showSuccess(`${trimName} added`);
      router.replace(`/chat/${chat.id}`);
    } catch (err: any) {
      showError('Could not add contact', err?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>New Contact</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { opacity: saving ? 0.5 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 32 }]}>
        {/* Avatar placeholder */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
            <Ionicons name="person-outline" size={40} color={colors.textSecondary} />
          </View>
          <TouchableOpacity>
            <Text style={[textStyles.label, { color: colors.accent }]}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={[styles.fieldGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.field, { borderBottomColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.fieldIcon} />
            <TextInput
              style={[styles.fieldInput, { color: colors.textPrimary }]}
              placeholder="First and last name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.fieldIcon} />
            <TextInput
              style={[styles.fieldInput, { color: colors.textPrimary }]}
              placeholder="Phone number"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>

        <Text style={[textStyles.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
          We'll search HowFar for this contact and open a chat with them.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, paddingHorizontal: 8, gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, flex: 1 },
  saveBtn: { paddingHorizontal: 16 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' },
  form: { paddingHorizontal: 24, paddingTop: 24, gap: 16 },
  avatarRow: { alignItems: 'center', gap: 12, marginBottom: 8 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldGroup: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  field: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldIcon: { width: 24 },
  fieldInput: {
    flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, paddingVertical: 0,
  },
});

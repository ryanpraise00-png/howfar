import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme';
import { ScreenHeader } from '@/src/components';
import { useAuthStore } from '@/src/store/authStore';
import { sendOtp } from '@/src/services/auth';
import { ApiError } from '@/src/services/api';

const COUNTRIES = [
  { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Senegal' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
];

export default function PhoneEntryScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const { countryCode, setPhone } = useAuthStore();

  const [country, setCountry] = useState(
    COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]
  );
  const [phone, setPhoneInput] = useState('');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryFailed, setDeliveryFailed] = useState(false);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const isValid = phone.replace(/\D/g, '').length >= 7;

  async function handleContinue() {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    setDeliveryFailed(false);
    try {
      const full = `${country.code}${phone.replace(/\D/g, '')}`;
      await sendOtp(full);
      setPhone(phone, country.code);
      router.push({ pathname: '/(auth)/otp-verify', params: { phone: full } });
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'SMS_DELIVERY_FAILED') {
        setDeliveryFailed(true);
        setError(err.message);
      } else {
        setError(err?.message ?? 'Failed to send code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Enter your phone number" variant="white" colors={colors} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>
            HowFar will send a verification code to this number.
          </Text>

          {/* Country + phone row */}
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.countryBtn, { borderRightColor: colors.border }]}
              onPress={() => setSheetOpen(true)}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={[textStyles.body, { color: colors.textPrimary }]}>{country.code}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={[styles.phoneInput, { color: colors.textPrimary, fontFamily: 'Inter_400Regular' }]}
              placeholder="Phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhoneInput}
              autoFocus
              onSubmitEditing={handleContinue}
            />
          </View>

          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
            Carrier charges may apply.
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[textStyles.caption, { color: colors.error, flex: 1 }]}>{error}</Text>
            </View>
          ) : null}

          {deliveryFailed ? (
            <Text style={[textStyles.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              Having trouble? Email us at{' '}
              <Text style={{ color: colors.primary }}>support@howfar.app</Text>
            </Text>
          ) : null}
        </View>

        {/* Continue button pinned above keyboard */}
        <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 0 : spacing.xl }]}>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: isValid ? colors.primary : colors.border },
            ]}
            onPress={handleContinue}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.btnText, { color: isValid ? '#FFFFFF' : colors.textSecondary }]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Country picker sheet */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[textStyles.subtitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
            Select Country
          </Text>
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search country or code"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(i) => i.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryItem, { borderBottomColor: colors.border }]}
                onPress={() => { setCountry(item); setSearch(''); setSheetOpen(false); }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1 }]}>{item.name}</Text>
                <Text style={[textStyles.body, { color: colors.textSecondary }]}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, padding: 24, gap: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    height: '100%',
  },
  flag: { fontSize: 20 },
  phoneInput: { flex: 1, fontSize: 16, paddingHorizontal: 12, height: '100%' },
  footer: { padding: 24 },
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: 'Sora_700Bold', fontSize: 15 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 10,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

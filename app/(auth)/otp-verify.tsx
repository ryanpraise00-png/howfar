import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/theme';
import { ScreenHeader } from '@/src/components';
import { verifyOtp, sendOtp } from '@/src/services/auth';
import { ApiError } from '@/src/services/api';
import { useAuthStore } from '@/src/store/authStore';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpVerifyScreen() {
  const { colors, textStyles, spacing } = useTheme();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const onVerified = useAuthStore((s) => s.onVerified);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (digits.every((d) => d !== '')) {
      handleVerify(digits.join(''));
    }
  }, [digits]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code: string) {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp(phone ?? '', code);
      onVerified(result.user.id, result.user.name, result.user.about, result.isNewUser);

      if (result.isNewUser) {
        router.replace('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Incorrect code. Please try again.';
      setError(msg);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await sendOtp(phone ?? '');
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'SMS_DELIVERY_FAILED') {
        setError('SMS delivery failed. Please contact support@howfar.app');
      } else {
        setError(err?.message ?? 'Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  }

  const displayPhone = phone ? phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4') : '';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Verify your number" variant="white" colors={colors} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          {/* Subtitle */}
          <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            Code sent to{' '}
            <Text style={[textStyles.body, { color: colors.textPrimary }]}>{displayPhone}</Text>
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[textStyles.label, { color: colors.accentTeal, textAlign: 'center' }]}>
              Wrong number? Edit
            </Text>
          </TouchableOpacity>

          {/* OTP boxes */}
          <View style={styles.boxRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[
                  styles.box,
                  {
                    borderColor: digit ? colors.primary : colors.border,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                  },
                  error ? { borderColor: colors.error } : null,
                ]}
                value={digit}
                onChangeText={(v) => handleDigitChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                autoFocus={i === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <Text style={[textStyles.caption, { color: colors.error, textAlign: 'center' }]}>
              {error}
            </Text>
          ) : null}

          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />}

          {/* Resend */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={[textStyles.caption, { color: colors.textSecondary }]}>
                Resend code in <Text style={{ color: colors.primary }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={[textStyles.label, { color: resending ? colors.textSecondary : colors.accentTeal }]}>
                  {resending ? 'Sending…' : 'Resend code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, padding: 24, gap: 20, alignItems: 'center', justifyContent: 'center' },
  boxRow: { flexDirection: 'row', gap: 10 },
  box: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontFamily: 'Sora_700Bold',
  },
  resendRow: { marginTop: 8 },
});

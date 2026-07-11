import { View, Alert } from 'react-native';
import { showComingSoon } from '@/src/lib/toast';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { ScreenHeader, SettingsRow } from '@/src/components';
import { useAuthStore } from '@/src/store/authStore';

export default function AccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { phone, countryCode, clearAuth } = useAuthStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Account" variant="navy" colors={colors} />
      <SettingsRow label="Phone number" value={`${countryCode} ${phone}`} showChevron={false} colors={colors} onPress={() => showComingSoon('Change number')} />
      <SettingsRow label="Change number" icon="phone-portrait-outline" iconBg="#5856D6" colors={colors} onPress={() => showComingSoon('Change number')} />
      <SettingsRow label="QR Code" icon="qr-code-outline" iconBg="#14213D" colors={colors} onPress={() => router.push('/qr')} />
      <SettingsRow label="Connected devices" icon="phone-portrait-outline" iconBg="#3D5AFE" colors={colors} onPress={() => router.push('/devices')} />
      <SettingsRow label="Delete account" icon="trash-outline" danger colors={colors} showChevron={false}
        onPress={() => Alert.alert('Delete account?', 'This will permanently delete your account and data.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => { clearAuth().then(() => router.replace('/(auth)/welcome')); } },
        ])}
      />
    </View>
  );
}

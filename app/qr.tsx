import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components';
import { useAuthStore } from '@/src/store/authStore';
import QRCode from 'react-native-qrcode-svg';

type Tab = 'mycode' | 'scan';

export default function QrScreen() {
  const { colors, textStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('mycode');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { displayName, phone, countryCode } = useAuthStore();

  const qrValue = phone ? `${countryCode}${phone}` : (displayName ?? 'howfar-user');

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    Alert.alert('QR Code scanned', `Value: ${data}`, [
      { text: 'OK', onPress: () => setScanned(false) },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#14213D' }]} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.06)', bottom: '50%' as any }]} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code</Text>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['mycode', 'scan'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: '#3D5AFE', borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#3D5AFE' : colors.textSecondary }]}>
              {tab === 'mycode' ? 'My Code' : 'Scan Code'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'mycode' && (
        <View style={styles.myCodeWrap}>
          <Avatar name={displayName ?? 'You'} size="lg" />
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{displayName ?? 'You'}</Text>
          {phone && (
            <Text style={[textStyles.caption, { color: colors.textSecondary, marginBottom: 24 }]}>
              {countryCode} {phone}
            </Text>
          )}
          <View style={[styles.qrBox, { backgroundColor: '#FFFFFF', borderColor: '#14213D', borderWidth: 2 }]}>
            <QRCode value={qrValue} size={200} color="#14213D" backgroundColor="#FFFFFF" />
          </View>
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 }]}>
            Let others scan this to find you on HowFar
          </Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: '#3D5AFE' }]}
            onPress={() => Share.share({ message: `Add me on HowFar! Scan my QR or search for ${qrValue}` })}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share my code</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'scan' && (
        <View style={{ flex: 1 }}>
          {!permission?.granted ? (
            <View style={styles.center}>
              <Ionicons name="camera-outline" size={48} color={colors.border} />
              <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }]}>
                Camera access is needed to scan QR codes
              </Text>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                onPress={requestPermission}
              >
                <Text style={styles.shareBtnText}>Grant Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanHint}>Point camera at a HowFar QR code</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, gap: 4 },
  backBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: '#FFFFFF', flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  myCodeWrap: { flex: 1, alignItems: 'center', paddingTop: 36 },
  userName: { fontFamily: 'Sora_700Bold', fontSize: 20, marginTop: 12, marginBottom: 4 },
  qrBox: { padding: 20, borderRadius: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24, marginTop: 20 },
  shareBtnText: { fontFamily: 'Sora_700Bold', fontSize: 15, color: '#FFFFFF' },

  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 220, height: 220, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 16, backgroundColor: 'transparent' },
  scanHint: { color: '#FFFFFF', fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 20, textAlign: 'center', paddingHorizontal: 40 },
});

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [preview, setPreview] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.permWrap]}>
        <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permText}>Camera access is needed to take photos.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeAbs} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Preview mode ─────────────────────────────────────────────────────────
  if (preview) {
    const handleUse = () => {
      if (returnTo) {
        router.back();
        // Pass the captured URI back via global state or params isn't directly
        // possible with expo-router without a store. We use AsyncStorage as a
        // one-shot handoff.
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        AsyncStorage.setItem('@camera_result', preview).catch(() => {});
      } else {
        router.back();
      }
    };

    return (
      <View style={styles.root}>
        <Image source={{ uri: preview }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={[styles.previewBar, { paddingBottom: insets.bottom + 12, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.previewBtn} onPress={() => setPreview(null)}>
            <Text style={styles.previewBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.previewBtn, styles.previewBtnPrimary]} onPress={handleUse}>
            <Text style={[styles.previewBtnText, { color: '#14213D' }]}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Camera viewfinder ─────────────────────────────────────────────────────
  const flashIcon: Record<FlashMode, string> = {
    off: 'flash-off-outline',
    auto: 'flash-outline',
    on: 'flash',
  };
  const nextFlash: Record<FlashMode, FlashMode> = { off: 'auto', auto: 'on', on: 'off' };

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (photo?.uri) setPreview(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} flash={flash} />

      {/* Top toolbar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setFlash(nextFlash[flash])}>
          <Ionicons name={flashIcon[flash] as any} size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom toolbar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.bottomSide} />

        <TouchableOpacity style={styles.captureOuter} onPress={handleCapture} disabled={capturing}>
          <View style={styles.captureInner}>
            {capturing && <ActivityIndicator color="#14213D" />}
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSide}>
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },

  permWrap: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  permText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 40 },
  permBtn: { marginTop: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  permBtnText: { fontFamily: 'Sora_700Bold', fontSize: 15, color: '#14213D' },
  closeAbs: { position: 'absolute', top: 48, left: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingTop: 16,
  },
  bottomSide: { width: 60, alignItems: 'center' },
  captureOuter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  flipBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  previewBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewBtnPrimary: { backgroundColor: '#FFFFFF' },
  previewBtnText: { fontFamily: 'Sora_700Bold', fontSize: 16, color: '#FFFFFF' },
});

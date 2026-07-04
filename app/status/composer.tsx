import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/theme';
import { TEXT_BG_COLORS } from '@/src/data/mockStatuses';
import { uploadMedia } from '@/src/services/media';
import { postStatus } from '@/src/services/status';
import { useStatusStore } from '@/src/store/statusStore';
import { showError } from '@/src/lib/toast';

const FONT_STYLES: Array<{ family: string; label: string }> = [
  { family: 'Sora_700Bold',    label: 'Aa' },
  { family: 'Inter_400Regular', label: 'Aa' },
  { family: 'Sora_600SemiBold', label: 'Aa' },
];

export default function StatusComposerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'camera' | 'text'>('camera');
  const [text, setText] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [sending, setSending] = useState(false);

  const bgColor = TEXT_BG_COLORS[bgIndex % TEXT_BG_COLORS.length];
  const fontFamily = FONT_STYLES[fontIndex % FONT_STYLES.length].family;

  const { setFeed, myStatus, feed } = useStatusStore();

  // ── Gallery pick ──────────────────────────────────────────────────────────

  const handlePickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission denied', 'Gallery access is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as const,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    setSending(true);
    try {
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      const name = asset.uri.split('/').pop() ?? (isVideo ? 'status.mp4' : 'status.jpg');
      const uploaded = await uploadMedia(asset.uri, name, mimeType);
      const post = await postStatus({
        type: isVideo ? 'VIDEO' : 'IMAGE',
        mediaUrl: uploaded.url,
      });
      // Update store optimistically
      setFeed([...myStatus, post], feed);
      router.replace('/(tabs)/updates');
    } catch (err: any) {
      showError('Upload failed', err?.message);
    } finally {
      setSending(false);
    }
  };

  // ── Text status send ──────────────────────────────────────────────────────

  const handleSendText = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const post = await postStatus({
        type: 'TEXT',
        content: text.trim(),
        bgColor,
      });
      setFeed([...myStatus, post], feed);
      router.replace('/(tabs)/updates');
    } catch (err: any) {
      showError('Failed to post', err?.message);
    } finally {
      setSending(false);
    }
  };

  // ── Camera mode ────────────────────────────────────────────────────────────
  if (mode === 'camera') {
    return (
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        {/* Simulated camera viewfinder */}
        <View style={styles.viewfinder}>
          <View style={styles.vfCornerTL} />
          <View style={styles.vfCornerTR} />
          <View style={styles.vfCornerBL} />
          <View style={styles.vfCornerBR} />
          <Text style={styles.vfLabel}>Camera preview</Text>
          <Text style={styles.vfSub}>Pick from gallery below</Text>
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Right toolbar */}
        <View style={[styles.rightToolbar, { top: insets.top + 56 }]}>
          {[
            { icon: 'flash-off-outline' as const, label: 'Flash' },
            { icon: 'camera-reverse-outline' as const, label: 'Flip' },
            { icon: 'timer-outline' as const, label: 'Timer' },
          ].map((t) => (
            <TouchableOpacity key={t.label} style={styles.toolBtn}>
              <Ionicons name={t.icon} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom bar */}
        <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 16 }]}>
          {/* Gallery */}
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickGallery} disabled={sending}>
            <View style={[styles.galleryThumb, { backgroundColor: '#333' }]}>
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="images-outline" size={22} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* Capture — opens gallery on press */}
          <TouchableOpacity style={styles.capture} onPress={handlePickGallery} disabled={sending}>
            {sending ? (
              <ActivityIndicator color="#555" size="large" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          {/* Text mode toggle */}
          <TouchableOpacity style={styles.textToggleBtn} onPress={() => setMode('text')}>
            <View style={[styles.textToggleIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.textToggleLabel}>T</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Text mode ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Close */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Font cycle */}
      <TouchableOpacity
        style={[styles.fontBtn, { top: insets.top + 10 }]}
        onPress={() => setFontIndex((i) => i + 1)}
      >
        <Text style={[styles.fontBtnLabel, { fontFamily }]}>Aa</Text>
      </TouchableOpacity>

      {/* Centered text input */}
      <View style={styles.textCenter}>
        <TextInput
          style={[styles.statusTextInput, { fontFamily, color: '#FFFFFF' }]}
          value={text}
          onChangeText={setText}
          placeholder="Type a status…"
          placeholderTextColor="rgba(255,255,255,0.5)"
          multiline
          maxLength={139}
          textAlign="center"
          autoFocus
        />
      </View>

      {/* Char count */}
      <Text style={[styles.charCount, { top: insets.top + 10 }]}>
        {139 - text.length}
      </Text>

      {/* Bottom bar */}
      <View style={[styles.textBottom, { paddingBottom: insets.bottom + 16 }]}>
        {/* Color palette strip */}
        <View style={styles.colorStrip}>
          {TEXT_BG_COLORS.map((c, i) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                i === bgIndex % TEXT_BG_COLORS.length && styles.colorDotSelected,
              ]}
              onPress={() => setBgIndex(i)}
            />
          ))}
        </View>

        {/* Camera mode toggle */}
        <TouchableOpacity style={styles.cameraToggleBtn} onPress={() => setMode('camera')}>
          <View style={[styles.textToggleIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Send */}
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: '#F2A93B', opacity: text.trim() && !sending ? 1 : 0.5 }]}
          onPress={handleSendText}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  vfLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Sora_600SemiBold', fontSize: 18 },
  vfSub:   { color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6 },

  vfCornerTL: { position: 'absolute', top: 60, left: 60, width: 28, height: 28, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  vfCornerTR: { position: 'absolute', top: 60, right: 60, width: 28, height: 28, borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  vfCornerBL: { position: 'absolute', bottom: 60, left: 60, width: 28, height: 28, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  vfCornerBR: { position: 'absolute', bottom: 60, right: 60, width: 28, height: 28, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },

  closeBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  fontBtn: {
    position: 'absolute', right: 16,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  fontBtnLabel: { fontSize: 22, color: '#FFFFFF' },
  charCount: {
    position: 'absolute', right: 64,
    color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular', fontSize: 13,
  },

  rightToolbar: { position: 'absolute', right: 12, gap: 20 },
  toolBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  cameraBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', paddingHorizontal: 24, paddingTop: 20,
  },
  galleryBtn: {},
  galleryThumb: {
    width: 52, height: 52, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  capture: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF' },
  textToggleBtn: {},
  textToggleIcon: {
    width: 52, height: 52, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  textToggleLabel: { fontFamily: 'Sora_700Bold', fontSize: 24, color: '#FFFFFF' },
  cameraToggleBtn: {},

  textCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  statusTextInput: {
    fontSize: 28, lineHeight: 36,
    textAlignVertical: 'center',
    minHeight: 80,
  },
  textBottom: {
    paddingHorizontal: 20, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  colorStrip: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  colorDotSelected: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.15 }] },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
});

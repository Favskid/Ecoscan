import { Feather } from '@expo/vector-icons';
import { CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScan } from '@/context/ScanContext';
import { classifyImage } from '@/services/classifierService';
import { useColors } from '@/hooks/useColors';

export default function CameraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setCurrentScan } = useScan();

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // ── Run classification on a captured URI ────────────────────────────────
  const classify = useCallback(
    async (uri: string) => {
      setLoading(true);
      try {
        const result = await classifyImage(uri);
        setCurrentScan({ ...result, imageUri: uri });
        router.push('/result');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        Alert.alert('Classification Failed', msg, [{ text: 'OK' }]);
      } finally {
        setLoading(false);
      }
    },
    [setCurrentScan]
  );

  // ── Capture photo ────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Web: fall back to image picker
    if (Platform.OS === 'web') {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]) {
        await classify(res.assets[0].uri);
      }
      return;
    }

    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) {
      await classify(photo.uri);
    }
  }, [loading, classify]);

  // ── Pick from library ────────────────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      await classify(res.assets[0].uri);
    }
  }, [loading, classify]);

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((f) => (f === 'off' ? 'on' : 'off'));
  };

  // ── Permission states ────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Feather name="camera-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.permTitle, { color: colors.foreground }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permDesc, { color: colors.mutedForeground }]}>
          EcoScan needs camera access to identify recyclable materials.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 8, padding: 8 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 15, fontFamily: 'Inter_400Regular' }}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Main camera UI ───────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {Platform.OS !== 'web' ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flash}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
          <Feather name="camera" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.webPlaceholderText}>
            Tap the button to select an image
          </Text>
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.circleBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>

        <Text style={styles.topTitle}>Point at an object</Text>

        {Platform.OS !== 'web' ? (
          <Pressable
            onPress={toggleFlash}
            style={[
              styles.circleBtn,
              flash === 'on' && { backgroundColor: 'rgba(255,220,0,0.4)' },
            ]}
          >
            <Feather name={flash === 'on' ? 'zap' : 'zap-off'} size={20} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.circleBtn} />
        )}
      </View>

      {/* Viewfinder corners */}
      <View style={styles.viewfinder} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.overlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Analyzing material…</Text>
          </View>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handlePickImage} style={styles.circleBtn} disabled={loading}>
          <Feather name="image" size={22} color="#fff" />
        </Pressable>

        <Pressable
          onPress={handleCapture}
          disabled={loading}
          style={[styles.captureBtn, loading && { opacity: 0.5 }]}
        >
          <View style={styles.captureInner} />
        </Pressable>

        {/* Spacer to balance layout */}
        <View style={styles.circleBtn} />
      </View>
    </View>
  );
}

const C = 28; // corner size
const T = 3;  // corner thickness

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },

  webPlaceholder: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  webPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topTitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewfinder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 240,
    height: 240,
    marginLeft: -120,
    marginTop: -120,
  },
  corner: { position: 'absolute', width: C, height: C, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: T, borderLeftWidth: T, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: T, borderRightWidth: T, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: T, borderLeftWidth: T, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: T, borderRightWidth: T, borderBottomRightRadius: 4 },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 180,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#212121',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  permTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  permDesc: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

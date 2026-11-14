import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScan } from '@/context/ScanContext';
import { useColors } from '@/hooks/useColors';
import { MaterialCategory } from '@/services/classifierService';

const MATERIAL_ICONS: Record<MaterialCategory, keyof typeof Feather.glyphMap> = {
  Plastic:   'package',
  Paper:     'file-text',
  Cardboard: 'archive',
  Glass:     'aperture',
  Metal:     'settings',
  Trash:     'trash-2',
};

const MATERIAL_COLORS: Record<MaterialCategory, string> = {
  Plastic:   '#1565C0',
  Paper:     '#6D4C41',
  Cardboard: '#EF6C00',
  Glass:     '#00838F',
  Metal:     '#37474F',
  Trash:     '#757575',
};

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentScan, setCurrentScan } = useScan();

  useEffect(() => {
    if (!currentScan) return;
    if (currentScan.recyclable) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [currentScan]);

  // Guard: no scan data
  if (!currentScan) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No scan result found.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.btnText}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const matColor = MATERIAL_COLORS[currentScan.material as MaterialCategory] ?? colors.primary;
  const matIcon  = MATERIAL_ICONS[currentScan.material as MaterialCategory]  ?? 'help-circle';
  const pct      = Math.round(currentScan.confidence * 100);

  const handleScanAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentScan(null);
    router.replace('/camera');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Result</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Captured image */}
        {currentScan.imageUri ? (
          <Image
            source={{ uri: currentScan.imageUri }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={40} color={colors.mutedForeground} />
          </View>
        )}

        {/* Material card */}
        <View
          style={[
            styles.card,
            { backgroundColor: matColor + '14', borderColor: matColor + '30' },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: matColor }]}>
            <Feather name={matIcon} size={28} color="#fff" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.detectedLabel, { color: colors.mutedForeground }]}>
              MATERIAL DETECTED
            </Text>
            <Text style={[styles.materialName, { color: matColor }]}>
              {currentScan.material}
            </Text>
          </View>
          <View style={styles.confBox}>
            <Text style={[styles.confPct, { color: matColor }]}>{pct}%</Text>
            <Text style={[styles.confLabel, { color: colors.mutedForeground }]}>
              confidence
            </Text>
          </View>
        </View>

        {/* Recyclable status */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: currentScan.recyclable ? colors.successLight : colors.warningLight,
              borderColor: currentScan.recyclable
                ? colors.success + '40'
                : colors.warning + '40',
            },
          ]}
        >
          <Feather
            name={currentScan.recyclable ? 'check-circle' : 'x-circle'}
            size={24}
            color={currentScan.recyclable ? colors.success : colors.warning}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={[
                styles.statusLabel,
                { color: currentScan.recyclable ? colors.success : colors.warning },
              ]}
            >
              {currentScan.recyclable ? 'Recyclable' : 'Non-Recyclable'}
            </Text>
            <Text style={[styles.statusSub, { color: colors.mutedForeground }]}>
              {currentScan.recyclable
                ? 'This item can be recycled'
                : 'This item goes to general waste'}
            </Text>
          </View>
        </View>

        {/* Disposal recommendation */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column' }]}>
          <View style={styles.recommendHeader}>
            <Text style={[styles.recommendTitle, { color: colors.foreground }]}>
              Disposal Guide
            </Text>
            <View style={[styles.recommendIconBox, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="info" size={18} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.recommendText, { color: colors.mutedForeground }]}>
            {currentScan.recommendation}
          </Text>
        </View>

        {/* AI source badge */}
        <Text style={[styles.sourceBadge, { color: colors.mutedForeground }]}>
          Classified by Google Gemini
        </Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleScanAgain}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, flex: 1, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="camera" size={18} color="#fff" />
            <Text style={styles.btnText}>Scan Again</Text>
          </Pressable>

          <Pressable
            onPress={() => { setCurrentScan(null); router.replace('/'); }}
            style={({ pressed }) => [
              styles.outlineBtn,
              {
                borderColor: colors.primary,
                backgroundColor: colors.card,
                flex: 1,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="home" size={18} color={colors.primary} />
            <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  scroll: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },

  image: { width: '100%', height: 220, borderRadius: 18, marginBottom: 16 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 3 },
  detectedLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.8 },
  materialName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  confBox: { alignItems: 'flex-end', gap: 2 },
  confPct: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  confLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  statusLabel: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  statusSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recommendIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  recommendText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },

  sourceBadge: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: -4,
  },

  actions: { flexDirection: 'row', gap: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  outlineBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});

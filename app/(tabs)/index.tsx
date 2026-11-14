import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const MATERIALS = [
  { label: 'Plastic',    color: '#1565C0' },
  { label: 'Paper',      color: '#6D4C41' },
  { label: 'Glass',      color: '#00838F' },
  { label: 'Metal',      color: '#37474F' },
  { label: 'Cardboard',  color: '#EF6C00' },
  { label: 'Trash',      color: '#757575' },
];

const TIPS = [
  {
    icon: 'droplet' as const,
    color: '#1565C0',
    title: 'Rinse Before Recycling',
    desc: 'Always rinse containers — food residue contaminates entire recycling batches.',
  },
  {
    icon: 'layers' as const,
    color: '#EF6C00',
    title: 'Flatten Cardboard',
    desc: 'Break down boxes flat to save space and make collection easier.',
  },
  {
    icon: 'x-circle' as const,
    color: '#757575',
    title: 'No Plastic Bags',
    desc: 'Plastic bags jam sorting machines. Return them to supermarket drop-offs instead.',
  },
  {
    icon: 'sun' as const,
    color: '#00838F',
    title: 'Keep Paper Dry',
    desc: 'Wet paper cannot be recycled. Keep it dry until collection day.',
  },
  {
    icon: 'trash-2' as const,
    color: '#C62828',
    title: 'Batteries Separately',
    desc: 'Never bin batteries — take them to dedicated collection points to avoid fire risk.',
  },
  {
    icon: 'package' as const,
    color: '#37474F',
    title: 'Remove Lids',
    desc: 'Remove metal lids from glass jars — they are recycled separately in most areas.',
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/camera');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.appName, { color: colors.primary }]}>EcoScan</Text>
            <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
              Smart Recycling Assistant
            </Text>
          </View>
        </View>

        {/* Hero banner */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Feather
            name="camera"
            size={64}
            color="rgba(255,255,255,0.15)"
            style={styles.heroIcon}
          />
          <Text style={styles.heroTitle}>
            Identify recyclable materials instantly
          </Text>
          <Text style={styles.heroSub}>
            Point your camera at any object and let AI guide you.
          </Text>
        </View>

        {/* Scan button */}
        <Pressable
          onPress={handleScan}
          style={({ pressed }) => [
            styles.scanBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Feather name="camera" size={22} color="#fff" />
          <Text style={styles.scanBtnText}>Scan Now</Text>
        </Pressable>

        {/* Supported materials */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SUPPORTED MATERIALS
        </Text>
        <View style={styles.chips}>
          {MATERIALS.map((m) => (
            <View
              key={m.label}
              style={[
                styles.chip,
                { backgroundColor: m.color + '18', borderColor: m.color + '40' },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: m.color }]} />
              <Text style={[styles.chipLabel, { color: m.color }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Recycling tips */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 32 }]}>
          RECYCLING TIPS
        </Text>
        <View style={styles.tipsGrid}>
          {TIPS.map((tip) => (
            <View
              key={tip.title}
              style={[
                styles.tipCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.tipIconBox, { backgroundColor: tip.color + '18' }]}>
                <Feather name={tip.icon} size={18} color={tip.color} />
              </View>
              <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
              <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>{tip.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logo: { width: 44, height: 44, borderRadius: 10 },
  appName: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  appTagline: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  hero: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroIcon: { position: 'absolute', right: 16, top: 16 },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 8,
    maxWidth: '85%',
  },
  heroSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 32,
  },
  scanBtnText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  tipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
  tipDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
});

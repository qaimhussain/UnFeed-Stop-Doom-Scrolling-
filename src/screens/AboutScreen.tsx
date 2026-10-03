import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { Header } from '../components/common/Header';
import { GlassSurface } from '../components/focus/GlassSurface';
import { UnfeedWordmark } from '../components/common/UnfeedWordmark';

interface AboutScreenProps {
  navigation: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const { colors, typography, isDark } = useTheme();

  const handleOpenUrl = (url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <Header
        title="About Unfeed"
        showDivider={true}
        useGlass={true}
        leftAction={{
          icon: 'arrow-back',
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Showcase */}
        <View style={styles.brandHero}>
          <UnfeedWordmark fontSize={48} />
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8 }]}>
            Version 1.0.0 (Android Edition)
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textPrimary, textAlign: 'center', marginTop: 12, paddingHorizontal: 24 }]}>
            Intentional connection, direct messaging, and stories without the algorithmic rabbit hole.
          </Text>
        </View>

        {/* Philosophy Card */}
        <GlassSurface
          borderRadius={20}
          elevation={3}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="sparkles" size={20} color="#FA7E1E" style={{ marginRight: 8 }} />
              <Text style={[typography.h3, { color: colors.textPrimary }]}>The Unfeed Purpose</Text>
            </View>
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22, marginTop: 8 }]}>
              Unfeed was created to restore agency over your time and digital relationships. By keeping personal conversations, notes, and a focused daily window for stories and saved posts, you stay close to real friends without doomscrolling infinite algorithmic feeds or reels.
            </Text>
          </View>
        </GlassSurface>

        {/* OPEN SOURCE LICENSES SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.captionBold, { color: colors.textSecondary, letterSpacing: 1 }]}>
            OPEN SOURCE LICENSES
          </Text>
        </View>

        {/* Primary Credit: Kyant0/AndroidLiquidGlass */}
        <GlassSurface
          borderRadius={20}
          elevation={3}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="cube-outline" size={22} color={colors.accent} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  AndroidLiquidGlass (Backdrop)
                </Text>
                <Text style={[typography.footnote, { color: colors.textSecondary }]}>
                  io.github.kyant0:backdrop:2.0.1 (Apache-2.0)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleOpenUrl('https://github.com/Kyant0/AndroidLiquidGlass')}
                style={styles.linkButton}
              >
                <Ionicons name="logo-github" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.codeBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)' }]}>
              <Text style={[typography.footnote, { color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, lineHeight: 16 }]}>
                Copyright (c) 2025 Kyant{'\n'}
                Licensed under the Apache License, Version 2.0 (the "License");{'\n'}
                you may not use this file except in compliance with the License.{'\n'}
                You may obtain a copy of the License at:{'\n'}
                http://www.apache.org/licenses/LICENSE-2.0
              </Text>
            </View>
            <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 10, lineHeight: 18 }]}>
              The glass UI foundation, specular highlights, and spring-physics capsule tab geometry in Unfeed are adapted from Kyant0's Android Liquid Glass library.
            </Text>
          </View>
        </GlassSurface>

        {/* Other Open Source Libraries */}
        <GlassSurface
          borderRadius={20}
          elevation={2}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: 8 }]}>
              Supporting Open Source
            </Text>

            <View style={styles.licenseRow}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Expo & React Native</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>MIT License</Text>
            </View>
            <View style={styles.licenseRow}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>React Native Reanimated</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>MIT License</Text>
            </View>
            <View style={styles.licenseRow}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>React Navigation</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>MIT License</Text>
            </View>
            <View style={styles.licenseRow}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Zustand</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>MIT License</Text>
            </View>
            <View style={styles.licenseRow}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Grand Hotel Font (Google Fonts)</Text>
              <Text style={[typography.footnote, { color: colors.textSecondary }]}>SIL Open Font License 1.1</Text>
            </View>
          </View>
        </GlassSurface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  brandHero: {
    alignItems: 'center',
    marginVertical: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardInner: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  codeBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  linkButton: {
    padding: 4,
  },
  licenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
});

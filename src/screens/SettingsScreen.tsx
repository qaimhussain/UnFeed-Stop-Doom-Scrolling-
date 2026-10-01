import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { HairlineDivider } from '../components/common/HairlineDivider';
import { ThemeMode } from '../types';
import { storyTimeService } from '../services/storyTimeService';
import { STORY_DAILY_LIMIT_SECONDS } from '../config/storyTimeConfig';
import { GlassSurface } from '../components/focus/GlassSurface';
import { Header } from '../components/common/Header';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { colors, typography, themeMode, setThemeMode, isDark, spacing } = useTheme();
  const screenTime = useAppStore((state) => state.screenTime);
  const focusSettings = useAppStore((state) => state.focusSettings);
  const storyTimeUsage = useAppStore((state) => state.storyTimeUsage);
  const resetStoryTime = useAppStore((state) => state.resetStoryTime);
  const simulateStoryLimitReached = useAppStore((state) => state.simulateStoryLimitReached);
  const setDailyLimit = useAppStore((state) => state.setDailyLimit);
  const startSessionTimer = useAppStore((state) => state.startSessionTimer);
  const cancelSessionTimer = useAppStore((state) => state.cancelSessionTimer);
  const toggleNotifications = useAppStore((state) => state.toggleNotifications);
  const toggleReduceEffects = useAppStore((state) => state.toggleReduceEffects);

  const handleSelectTheme = (mode: ThemeMode) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setThemeMode(mode);
  };

  const handleSetDailyLimit = (minutes: number | null) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setDailyLimit(minutes);
  };

  const handleStartSession = (minutes: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    startSessionTimer(minutes);
    Alert.alert('Session Started', `Timer set for ${minutes} minutes. We'll remind you gently.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Glass */}
      <Header
        title="Settings & Wellbeing"
        showDivider={true}
        useGlass={true}
        leftAction={{
          icon: 'arrow-back',
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Daily Screen Time Activity Card */}
        <GlassSurface
          borderRadius={16}
          elevation={2}
          style={[
            styles.activityCard,
            {
              marginHorizontal: spacing.base,
              marginTop: spacing.base,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="time-outline" size={20} color={colors.accent} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.textSecondary, marginLeft: 8 },
                ]}
              >
                TIME IN UNFEED
              </Text>
            </View>
            <Text style={[typography.footnote, { color: colors.textTertiary }]}>
              {screenTime.todayDate}
            </Text>
          </View>

          <View style={styles.usageDisplay}>
            <Text style={[styles.usageNumber, { color: colors.textPrimary }]}>
              {screenTime.minutesToday}
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 6 }]}>
              minutes spent today
            </Text>
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            Target: {focusSettings.dailyLimitMinutes ? `${focusSettings.dailyLimitMinutes} min limit` : 'No limit set'} • Tracks in-app active usage only
          </Text>
        </GlassSurface>

        {/* SECTION 1: DIGITAL WELLBEING & LIMITS */}
        <View style={styles.section}>
          <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSecondary }]}>
            DIGITAL WELLBEING & FOCUS
          </Text>

          <GlassSurface borderRadius={16} elevation={2} style={styles.sectionCard}>
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: 8 }]}>
              Daily Limit
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
              Receive a calm notification when you exceed your goal.
            </Text>

            <View style={styles.chipRow}>
              {[null, 15, 30, 45, 60].map((limit) => {
                const isSelected = focusSettings.dailyLimitMinutes === limit;
                return (
                  <TouchableOpacity
                    key={String(limit)}
                    onPress={() => handleSetDailyLimit(limit)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.divider,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.captionBold,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {limit === null ? 'Off' : `${limit}m`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <HairlineDivider style={{ marginVertical: 16 }} />

            {/* Quick Session Timer */}
            <Text style={[typography.bodyBold, { color: colors.textPrimary, marginBottom: 8 }]}>
              Intentional Session Timer
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
              "I'm here for a few minutes" — get a calm alert when your time is up.
            </Text>

            {focusSettings.sessionTimerMinutes ? (
              <View style={[styles.activeSessionBox, { backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.accent }]}>
                    Active Timer: {focusSettings.sessionTimerMinutes} min
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Countdown is running in header
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={cancelSessionTimer}
                  style={[styles.cancelTimerBtn, { borderColor: colors.destructive }]}
                >
                  <Text style={[typography.captionBold, { color: colors.destructive }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.chipRow}>
                {[5, 10, 15, 20].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => handleStartSession(mins)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.divider,
                      },
                    ]}
                  >
                    <Text style={[typography.captionBold, { color: colors.textPrimary }]}>
                      {mins} mins
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassSurface>
        </View>

        {/* SECTION: STORY TIME */}
        <View style={styles.section}>
          <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSecondary }]}>
            STORY TIME
          </Text>

          <GlassSurface borderRadius={16} elevation={2} style={styles.sectionCard}>
            {/* Story Time Used Today */}
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  Time Used Today
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Active viewing time only (pauses when held or in background)
                </Text>
              </View>
              <Text style={[typography.h3, { color: colors.accent }]}>
                {Math.floor(storyTimeUsage.secondsUsed / 60)}m {storyTimeUsage.secondsUsed % 60}s / 20m
              </Text>
            </View>

            <HairlineDivider style={{ marginVertical: 14 }} />

            {/* Daily Limit Status */}
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  Daily Limit Status
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Resets automatically at local midnight
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: storyTimeService.isLimitReached(storyTimeUsage.secondsUsed)
                      ? 'rgba(237, 73, 86, 0.15)'
                      : 'rgba(16, 208, 112, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: storyTimeService.isLimitReached(storyTimeUsage.secondsUsed)
                        ? colors.destructive
                        : '#10D070',
                    },
                  ]}
                >
                  {storyTimeService.isLimitReached(storyTimeUsage.secondsUsed)
                    ? 'Limit Reached (Stories Locked)'
                    : `${Math.max(0, Math.floor((STORY_DAILY_LIMIT_SECONDS - storyTimeUsage.secondsUsed) / 60))}m remaining`}
                </Text>
              </View>
            </View>

            <HairlineDivider style={{ marginVertical: 14 }} />

            {/* System Configuration Display */}
            <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 8 }]}>
              LIMIT SPECIFICATIONS
            </Text>
            <View style={styles.configItem}>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>Daily story viewing limit:</Text>
              <Text style={[typography.captionBold, { color: colors.textSecondary }]}>20 minutes (1200 seconds)</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>Availability:</Text>
              <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Any time of day (no restricted hours)</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>Midnight rollover:</Text>
              <Text style={[typography.captionBold, { color: colors.textSecondary }]}>Automatic reset at local 00:00</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={[typography.caption, { color: colors.textPrimary }]}>Always accessible:</Text>
              <Text style={[typography.captionBold, { color: '#10D070' }]}>Messages, Notes & Saved</Text>
            </View>

            {/* Developer-Only Test Buttons */}
            {__DEV__ && (
              <View style={{ marginTop: 14 }}>
                <HairlineDivider style={{ marginBottom: 14 }} />
                <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 10 }]}>
                  DEVELOPMENT TESTING
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                      }
                      await resetStoryTime();
                    }}
                    style={[styles.chip, { flex: 1, backgroundColor: 'rgba(0, 149, 246, 0.12)', borderColor: colors.accent }]}
                  >
                    <Ionicons name="refresh-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text style={[typography.captionBold, { color: colors.accent, fontSize: 12 }]}>
                      Reset story time
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      if (Platform.OS !== 'web') {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                      }
                      await simulateStoryLimitReached();
                    }}
                    style={[styles.chip, { flex: 1, backgroundColor: 'rgba(237, 73, 86, 0.12)', borderColor: colors.destructive }]}
                  >
                    <Ionicons name="lock-closed-outline" size={14} color={colors.destructive} style={{ marginRight: 4 }} />
                    <Text style={[typography.captionBold, { color: colors.destructive, fontSize: 12 }]}>
                      Lock Stories (Test)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </GlassSurface>
        </View>


        {/* SECTION 2: APPEARANCE & THEME */}
        <View style={styles.section}>
          <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSecondary }]}>
            APPEARANCE
          </Text>

          <GlassSurface borderRadius={16} elevation={2} style={styles.sectionCard}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode, idx) => {
              const isSelected = themeMode === mode;
              const labels: Record<ThemeMode, { title: string; desc: string }> = {
                system: { title: 'System Default', desc: 'Match your device settings automatically' },
                light: { title: 'Light Mode', desc: 'Crisp white canvas (#FFFFFF)' },
                dark: { title: 'Dark Mode', desc: 'Deep black background (#000000)' },
              };
              return (
                <View key={mode}>
                  <TouchableOpacity
                    onPress={() => handleSelectTheme(mode)}
                    style={styles.settingRow}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                        {labels[mode].title}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {labels[mode].desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? colors.accent : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  {idx < 2 && <HairlineDivider style={{ marginVertical: 10 }} />}
                </View>
              );
            })}
          </GlassSurface>
        </View>

        {/* SECTION 3: PREFERENCES & PERFORMANCE */}
        <View style={styles.section}>
          <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSecondary }]}>
            PREFERENCES & PERFORMANCE
          </Text>

          <GlassSurface borderRadius={16} elevation={2} style={styles.sectionCard}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  Direct Message Alerts
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Only notify when close friends send you a message
                </Text>
              </View>
              <Switch
                value={focusSettings.notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.divider, true: colors.accent }}
              />
            </View>

            <HairlineDivider style={{ marginVertical: 14 }} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  Reduce Effects
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Replaces glass with solid surfaces for maximum performance
                </Text>
              </View>
              <Switch
                value={!!focusSettings.reduceEffects}
                onValueChange={toggleReduceEffects}
                trackColor={{ false: colors.divider, true: colors.accent }}
              />
            </View>
          </GlassSurface>
        </View>

        {/* SECTION 4: ABOUT UNFEED */}
        <View style={styles.section}>
          <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT UNFEED
          </Text>

          <GlassSurface borderRadius={16} elevation={2} style={styles.sectionCard}>
            <View style={styles.aboutRow}>
              <Ionicons name="sparkles" size={20} color={colors.accent} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  The Unfeed Manifesto
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
                  Unfeed replaces infinite scroll with intentional human connection. We kept direct messaging, stories from people you actually know, your personal saved visual library, and notes. No algorithm. No explore rabbit hole. No doomscrolling.
                </Text>
              </View>
            </View>

            <HairlineDivider style={{ marginVertical: 14 }} />

            <TouchableOpacity
              onPress={() => navigation.navigate('About')}
              style={styles.aboutLinkRow}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.accent} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  Open Source Licenses & Credits
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Kyant0/AndroidLiquidGlass (Apache-2.0)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <HairlineDivider style={{ marginVertical: 14 }} />

            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Version 1.0.0 (Build 42)
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                Offline-First & Local Storage
              </Text>
            </View>
          </GlassSurface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  activityCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  usageNumber: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeSessionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
  },
  cancelTimerBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aboutLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  batteryHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    marginTop: 14,
  },
  debugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

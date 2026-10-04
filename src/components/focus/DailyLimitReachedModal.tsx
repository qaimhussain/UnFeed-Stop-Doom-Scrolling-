import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { GlassSurface } from './GlassSurface';
import { navigationRef } from '../../../App';

interface DailyLimitReachedModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const DailyLimitReachedModal: React.FC<DailyLimitReachedModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { colors, typography, isDark } = useTheme();
  const screenTime = useAppStore((state) => state.screenTime);
  const dailyLimitMinutes = useAppStore((state) => state.focusSettings.dailyLimitMinutes);
  const snoozeDailyLimit = useAppStore((state) => state.snoozeDailyLimit);
  const lockUntilTomorrow = useAppStore((state) => state.lockUntilTomorrow);

  // 10-second reflection countdown before "5 more minutes" is tappable
  const [countdown, setCountdown] = useState(10);
  const isLockedMessage = screenTime.isLockedUntilTomorrow;

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      setCountdown(10);
    };
  }, [visible]);

  const canSnooze = screenTime.snoozeCountToday < 2;
  const isSnoozeEnabled = countdown === 0 && canSnooze && !isLockedMessage;

  const handleSnooze = async () => {
    if (!isSnoozeEnabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    await snoozeDailyLimit();
    onDismiss();
  };

  const handleLockUntilTomorrow = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await lockUntilTomorrow();
  };

  const handleGoToChats = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onDismiss();
    try {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MainTabs', { screen: 'Messages' });
      }
    } catch {}
  };

  const handleGoToSaved = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onDismiss();
    try {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MainTabs', { screen: 'Saved' });
      }
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <GlassSurface
          borderRadius={24}
          elevation={12}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            {/* Top Close Button so user is never trapped */}
            <TouchableOpacity
              onPress={onDismiss}
              style={[styles.closeIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Dismiss modal"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Glowing Icon */}
            <View style={[styles.iconCircle, { backgroundColor: colors.accentSecondary }]}>
              <Ionicons
                name={isLockedMessage ? 'moon' : 'sparkles'}
                size={32}
                color={colors.accent}
              />
            </View>

            <Text
              style={[
                typography.h2,
                { color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
              ]}
            >
              {isLockedMessage
                ? 'Unfeed Rest Mode Active'
                : 'Daily Focus Goal Reached'}
            </Text>

            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 14,
                  paddingHorizontal: 6,
                },
              ]}
            >
              {isLockedMessage
                ? 'The feed is asleep until tomorrow. Step away, recharge your eyes, and connect with people in real life — or catch up with friends in Chats.'
                : `You hit your ${dailyLimitMinutes}m daily focus goal (${screenTime.minutesToday}m spent). Feed scrolling is paused, but your Chats and Saved remain completely open.`}
            </Text>

            {/* Highlight Banner: Chats & Saved are always open */}
            <View style={[styles.alwaysOpenBadge, { backgroundColor: isDark ? 'rgba(16, 208, 112, 0.12)' : 'rgba(16, 208, 112, 0.08)', borderColor: 'rgba(16, 208, 112, 0.25)' }]}>
              <Ionicons name="lock-open-outline" size={14} color="#10D070" style={{ marginRight: 6 }} />
              <Text style={[typography.captionBold, { color: '#10D070', fontSize: 11 }]}>
                Chats & Saved are always unlocked
              </Text>
            </View>

            {/* Time in Unfeed Stats */}
            <View style={[styles.statsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider }]}>
              <View style={styles.statCol}>
                <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>Time Today</Text>
                <Text style={[typography.h3, { color: colors.accent, marginVertical: 2 }]}>
                  {screenTime.minutesToday}m
                </Text>
                <Text style={[typography.footnote, { color: colors.textTertiary, fontSize: 10 }]}>
                  Active browsing
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.statCol}>
                <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>Daily Target</Text>
                <Text style={[typography.h3, { color: colors.textPrimary, marginVertical: 2 }]}>
                  {dailyLimitMinutes ? `${dailyLimitMinutes}m` : 'Off'}
                </Text>
                <Text style={[typography.footnote, { color: colors.textTertiary, fontSize: 10 }]}>
                  {2 - screenTime.snoozeCountToday} extension left
                </Text>
              </View>
            </View>

            {/* Primary Navigation Actions: Chats & Saved */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                onPress={handleGoToChats}
                style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
                  Go to Chats
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGoToSaved}
                style={[
                  styles.secondaryActionBtn,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.divider,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="bookmark-outline" size={17} color={colors.textPrimary} style={{ marginRight: 8 }} />
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  Open My Saved
                </Text>
              </TouchableOpacity>

              {/* Extra Controls if not locked yet */}
              {!isLockedMessage && (
                <>
                  {/* Snooze option with 10s delay */}
                  <TouchableOpacity
                    onPress={handleSnooze}
                    disabled={!isSnoozeEnabled}
                    style={[
                      styles.snoozeBtn,
                      {
                        borderColor: isSnoozeEnabled ? colors.divider : 'transparent',
                        backgroundColor: isSnoozeEnabled
                          ? 'rgba(128, 128, 128, 0.08)'
                          : 'rgba(128, 128, 128, 0.04)',
                        opacity: isSnoozeEnabled ? 1 : 0.65,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={isSnoozeEnabled ? colors.textPrimary : colors.textTertiary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        typography.captionBold,
                        {
                          color: isSnoozeEnabled ? colors.textPrimary : colors.textTertiary,
                        },
                      ]}
                    >
                      {!canSnooze
                        ? '5 more mins (Limit reached today)'
                        : countdown > 0
                        ? `5 more mins (${countdown}s reflection)`
                        : `5 more mins (${2 - screenTime.snoozeCountToday}/2 extensions left)`}
                    </Text>
                  </TouchableOpacity>

                  {/* Lock feed until tomorrow */}
                  <TouchableOpacity
                    onPress={handleLockUntilTomorrow}
                    style={styles.lockUntilTomorrowTextBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="moon-outline" size={14} color={colors.textTertiary} style={{ marginRight: 5 }} />
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>
                      Lock feed until tomorrow
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </GlassSurface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 350,
  },
  cardInner: {
    padding: 22,
    alignItems: 'center',
    position: 'relative',
  },
  closeIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alwaysOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 14,
    borderWidth: 0.5,
    paddingVertical: 10,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: '75%',
    alignSelf: 'center',
  },
  actionContainer: {
    width: '100%',
    gap: 9,
  },
  primaryActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeBtn: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockUntilTomorrowTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
});

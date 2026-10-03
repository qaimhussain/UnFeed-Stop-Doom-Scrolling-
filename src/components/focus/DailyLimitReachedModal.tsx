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

interface DailyLimitReachedModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const DailyLimitReachedModal: React.FC<DailyLimitReachedModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { colors, typography } = useTheme();
  const screenTime = useAppStore((state) => state.screenTime);
  const dailyLimitMinutes = useAppStore((state) => state.focusSettings.dailyLimitMinutes);
  const snoozeDailyLimit = useAppStore((state) => state.snoozeDailyLimit);
  const lockUntilTomorrow = useAppStore((state) => state.lockUntilTomorrow);

  // 10-second delay countdown before "5 more minutes" is tappable
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

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => {}}>
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <GlassSurface
          borderRadius={24}
          elevation={10}
          style={styles.card}
        >
          <View style={styles.cardInner}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accentSecondary }]}>
              <Ionicons
                name={isLockedMessage ? 'moon-outline' : 'leaf-outline'}
                size={34}
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
                ? 'Unfeed is resting'
                : "You've reached your daily limit"}
            </Text>

            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 16,
                  paddingHorizontal: 8,
                },
              ]}
            >
              {isLockedMessage
                ? 'Locked until tomorrow. Step away, rest your eyes, and connect with people in real life.'
                : `You set a daily limit of ${dailyLimitMinutes}m. Time in Unfeed today has reached ${screenTime.minutesToday}m.`}
            </Text>

            {/* Time in Unfeed Stats */}
            <View style={[styles.statsBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider }]}>
              <View style={styles.statCol}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Time in Unfeed</Text>
                <Text style={[typography.h3, { color: colors.accent }]}>
                  {screenTime.minutesToday}m
                </Text>
                <Text style={[typography.footnote, { color: colors.textTertiary, fontSize: 10 }]}>
                  In-app usage only
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.statCol}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Daily Goal</Text>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  {dailyLimitMinutes}m
                </Text>
                <Text style={[typography.footnote, { color: colors.textTertiary, fontSize: 10 }]}>
                  {2 - screenTime.snoozeCountToday} extension left
                </Text>
              </View>
            </View>

            {!isLockedMessage ? (
              <View style={styles.actionContainer}>
                {/* Option 1: Lock until tomorrow */}
                <TouchableOpacity
                  onPress={handleLockUntilTomorrow}
                  style={[styles.lockBtn, { backgroundColor: colors.accent }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
                    Lock until tomorrow
                  </Text>
                </TouchableOpacity>

                {/* Option 2: 5 more minutes (10s delay + max 2/day) */}
                <TouchableOpacity
                  onPress={handleSnooze}
                  disabled={!isSnoozeEnabled}
                  style={[
                    styles.snoozeBtn,
                    {
                      borderColor: isSnoozeEnabled ? colors.divider : 'transparent',
                      backgroundColor: isSnoozeEnabled
                        ? colors.surfaceSecondary
                        : 'rgba(128, 128, 128, 0.1)',
                      opacity: isSnoozeEnabled ? 1 : 0.65,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={isSnoozeEnabled ? colors.textPrimary : colors.textTertiary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        color: isSnoozeEnabled ? colors.textPrimary : colors.textTertiary,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {!canSnooze
                      ? '5 more minutes (Limit reached today)'
                      : countdown > 0
                      ? `5 more minutes (${countdown}s delay)`
                      : `5 more minutes (${2 - screenTime.snoozeCountToday}/2 left)`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.lockedNoticeBox}>
                <Ionicons name="checkmark-circle" size={20} color="#10D070" style={{ marginRight: 6 }} />
                <Text style={[typography.captionBold, { color: '#10D070' }]}>
                  Protected until tomorrow morning
                </Text>
              </View>
            )}
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
    maxWidth: 340,
  },
  cardInner: {
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statsBox: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 14,
    borderWidth: 0.5,
    paddingVertical: 12,
    marginBottom: 18,
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
    gap: 10,
  },
  lockBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});

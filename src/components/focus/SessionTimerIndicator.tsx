import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { GlassSurface } from './GlassSurface';

export const SessionTimerIndicator: React.FC = () => {
  const { colors, typography } = useTheme();
  const sessionMinutes = useAppStore((state) => state.focusSettings.sessionTimerMinutes);
  const sessionStartedAt = useAppStore((state) => state.focusSettings.sessionStartedAt);
  const cancelSessionTimer = useAppStore((state) => state.cancelSessionTimer);

  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionMinutes || !sessionStartedAt) {
      setRemainingSecs(null);
      return;
    }

    const updateRemaining = () => {
      const elapsedSecs = Math.floor((Date.now() - sessionStartedAt) / 1000);
      const totalSecs = sessionMinutes * 60;
      const left = Math.max(0, totalSecs - elapsedSecs);
      setRemainingSecs(left);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [sessionMinutes, sessionStartedAt]);

  if (remainingSecs === null || remainingSecs <= 0) return null;

  const mins = Math.floor(remainingSecs / 60);
  const secs = remainingSecs % 60;
  const timeFormatted = `${mins}:${String(secs).padStart(2, '0')}`;

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    cancelSessionTimer();
  };

  return (
    <GlassSurface
      borderRadius={14}
      elevation={2}
      style={styles.pill}
    >
      <View style={styles.pillInner}>
        <Ionicons name="timer-outline" size={14} color={colors.accent} style={{ marginRight: 4 }} />
        <Text style={[typography.captionBold, { color: colors.textPrimary, fontSize: 11 }]}>
          {timeFormatted} left
        </Text>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelTouch}>
          <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: 14,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelTouch: {
    marginLeft: 6,
    padding: 1,
  },
});

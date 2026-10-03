import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { GlassSurface } from './GlassSurface';

interface FocusWindowTimerPillProps {
  remainingSeconds: number;
  onPress?: () => void;
}

export const FocusWindowTimerPill: React.FC<FocusWindowTimerPillProps> = ({
  remainingSeconds,
  onPress,
}) => {
  const { colors, typography } = useTheme();
  const [pulseAnim] = useState(() => new Animated.Value(1));

  const isFinalMinute = remainingSeconds > 0 && remainingSeconds <= 60;

  useEffect(() => {
    if (isFinalMinute) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isFinalMinute, pulseAnim]);

  if (remainingSeconds <= 0) {
    return null;
  }

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins}:${String(secs).padStart(2, '0')}`;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
        <GlassSurface
          borderRadius={20}
          intensity={isFinalMinute ? 'high' : 'medium'}
          style={styles.pill}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isFinalMinute ? '#FA7E1E' : '#10D070',
                },
              ]}
            />
            <Text
              style={[
                typography.captionBold,
                styles.timeText,
                {
                  color: isFinalMinute ? '#FA7E1E' : colors.textPrimary,
                },
              ]}
            >
              Window open: {timeFormatted}
            </Text>

            {isFinalMinute && (
              <View style={styles.warningTag}>
                <Text style={styles.warningText}>Closing soon</Text>
              </View>
            )}
          </View>
        </GlassSurface>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
  warningTag: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(250, 126, 30, 0.15)',
  },
  warningText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FA7E1E',
  },
});

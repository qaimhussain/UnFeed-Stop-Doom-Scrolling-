import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface VoiceMessageUIProps {
  duration?: number;
  isSentByMe: boolean;
}

export const VoiceMessageUI: React.FC<VoiceMessageUIProps> = ({
  duration = 15,
  isSentByMe,
}) => {
  const { colors, typography } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlayback = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setIsPlaying(true);
      if (progress >= 1) setProgress(0);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const step = 0.05;
      const intervalMs = (duration * 1000 * step);
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev + step;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  const barHeights = [10, 16, 24, 18, 28, 14, 20, 26, 12, 22, 18, 28, 16, 20, 12, 24, 16, 10];
  const activeColor = isSentByMe ? '#FFFFFF' : colors.textPrimary;
  const inactiveColor = isSentByMe ? 'rgba(255, 255, 255, 0.45)' : colors.divider;

  const currentSeconds = Math.floor(progress * duration);
  const displayTime = `0:${String(currentSeconds).padStart(2, '0')}`;
  const totalDisplay = `0:${String(duration).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={togglePlayback}
        style={[
          styles.playBtn,
          {
            backgroundColor: isSentByMe ? '#FFFFFF' : colors.accent,
          },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color={isSentByMe ? colors.accent : '#FFFFFF'}
          style={!isPlaying ? { marginLeft: 2 } : undefined}
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {barHeights.map((h, i) => {
          const barFraction = i / barHeights.length;
          const isBarPlayed = barFraction <= progress;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: h,
                  backgroundColor: isBarPlayed ? activeColor : inactiveColor,
                },
              ]}
            />
          );
        })}
      </View>

      <Text
        style={[
          typography.caption,
          {
            color: isSentByMe ? '#FFFFFF' : colors.textSecondary,
            marginLeft: 8,
            fontSize: 11,
          },
        ]}
      >
        {isPlaying ? displayTime : totalDisplay}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 190,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 30,
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
});

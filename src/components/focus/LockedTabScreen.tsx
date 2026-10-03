import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { GlassSurface } from './GlassSurface';
import { useAppStore } from '../../store/useAppStore';

interface LockedTabScreenProps {
  tabName?: string;
  reason?: 'story_limit_reached' | 'window_upcoming' | 'window_passed' | 'story_cap_reached';
  onNavigateToMessages: () => void;
}

export const LockedTabScreen: React.FC<LockedTabScreenProps> = ({
  tabName = 'Stories',
  reason = 'story_limit_reached',
  onNavigateToMessages,
}) => {
  const { colors, typography, spacing } = useTheme();
  const resetStoryTime = useAppStore((state) => state.resetStoryTime);

  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoToMessages = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onNavigateToMessages();
  };

  const handleResetStoryTime = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await resetStoryTime();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <GlassSurface borderRadius={24} intensity="medium" style={styles.card}>
          {/* Lock Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.divider,
              },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={32}
              color={colors.textSecondary}
            />
          </View>

          {/* Heading */}
          <Text
            style={[
              typography.h2,
              styles.heading,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            {"You've used today's story time."}
          </Text>

          {/* Come back tomorrow line */}
          <Text
            style={[
              typography.bodyBold,
              styles.comeBackLine,
              {
                color: colors.accent,
              },
            ]}
          >
            Come back tomorrow
          </Text>

          {/* Description */}
          <Text
            style={[
              typography.body,
              styles.subtext,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {"You've enjoyed your 20 minutes of stories today. Your daily limit resets at local midnight."}
          </Text>

          {/* Gentle reminder */}
          <View
            style={[
              styles.alwaysAvailableBox,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.divider,
              },
            ]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
            <Text
              style={[
                typography.caption,
                styles.alwaysAvailableText,
                { color: colors.textPrimary },
              ]}
            >
              Messages, Saved and Notes are always here.
            </Text>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            onPress={handleGoToMessages}
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
          >
            <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
              Go to Messages
            </Text>
          </TouchableOpacity>

          {/* Developer Debug Reset (visible in __DEV__) */}
          {__DEV__ && (
            <TouchableOpacity
              onPress={handleResetStoryTime}
              style={[
                styles.debugButton,
                {
                  borderColor: colors.divider,
                  backgroundColor: 'rgba(0, 149, 246, 0.12)',
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color={colors.accent}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent, fontSize: 11 },
                ]}
              >
                Reset story time (Debug)
              </Text>
            </TouchableOpacity>
          )}
        </GlassSurface>
      </Animated.View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  animatedWrapper: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 20,
  },
  comeBackLine: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  subtext: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  alwaysAvailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 24,
  },
  alwaysAvailableText: {
    marginLeft: 8,
    fontSize: 12,
  },
  primaryButton: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});

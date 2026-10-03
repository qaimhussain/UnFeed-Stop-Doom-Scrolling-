import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface CaughtUpNoticeProps {
  subtitle?: string;
  style?: ViewStyle;
}

export const CaughtUpNotice: React.FC<CaughtUpNoticeProps> = ({
  subtitle = "You've seen all recent updates. Time to disconnect.",
  style,
}) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.xl }, style]}>
      <LinearGradient
        colors={['#10D070', '#0095F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.circle}
      >
        <Ionicons name="checkmark-sharp" size={24} color="#FFFFFF" />
      </LinearGradient>

      <Text
        style={[
          typography.h3,
          {
            color: colors.textPrimary,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {"You're all caught up"}
      </Text>

      <Text
        style={[
          typography.caption,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 240,
          },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors, typography, spacing } = useTheme();

  const handleAction = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onAction?.();
  };

  return (
    <View style={[styles.container, { padding: spacing.xxl }, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            borderColor: colors.divider,
            backgroundColor: colors.surfaceSecondary,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.textSecondary} />
      </View>

      <Text
        style={[
          typography.h2,
          {
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.body,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 280,
            marginBottom: actionLabel ? spacing.xl : 0,
          },
        ]}
      >
        {description}
      </Text>

      {actionLabel && (
        <TouchableOpacity
          onPress={handleAction}
          style={[
            styles.button,
            {
              backgroundColor: colors.accent,
              borderRadius: 8,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

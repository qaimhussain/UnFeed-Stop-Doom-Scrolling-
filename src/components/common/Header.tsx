import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { HairlineDivider } from './HairlineDivider';
import { UnfeedWordmark } from './UnfeedWordmark';
import { GlassSurface } from '../focus/GlassSurface';

interface HeaderProps {
  title?: string;
  showChevron?: boolean;
  onTitlePress?: () => void;
  useWordmark?: boolean;
  useGlass?: boolean;
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
  rightActions?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badgeCount?: number;
  }>;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showChevron = false,
  onTitlePress,
  useWordmark = false,
  useGlass = true,
  leftAction,
  rightActions = [],
  showDivider = true,
  style,
}) => {
  const { colors, typography, spacing } = useTheme();

  const handleActionPress = (cb: () => void) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    cb();
  };

  const headerContent = (
    <View style={[styles.container, { paddingHorizontal: spacing.base }]}>
      {/* Left Side: Wordmark OR Title OR Action */}
      <View style={styles.leftContainer}>
        {leftAction && (
          <TouchableOpacity
            onPress={() => handleActionPress(leftAction.onPress)}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={leftAction.icon} size={24} color={colors.textPrimary} />
            {leftAction.label && (
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, marginLeft: 4 }]}>
                {leftAction.label}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {useWordmark ? (
          <TouchableOpacity
            onPress={onTitlePress ? () => handleActionPress(onTitlePress) : undefined}
            activeOpacity={onTitlePress ? 0.7 : 1}
            style={styles.wordmarkRow}
          >
            <UnfeedWordmark fontSize={32} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : title && !leftAction ? (
          <TouchableOpacity
            onPress={onTitlePress ? () => handleActionPress(onTitlePress) : undefined}
            activeOpacity={onTitlePress ? 0.7 : 1}
            style={styles.titleRow}
          >
            <Text style={[typography.dmTitle, styles.plainBoldTitle, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {showChevron && (
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textPrimary}
                style={styles.chevron}
              />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center Title if left action is present */}
      {title && leftAction && !useWordmark && (
        <View style={styles.centerContainer}>
          <Text
            style={[typography.h3, styles.plainBoldTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}

      {/* Right Actions */}
      <View style={styles.rightContainer}>
        {rightActions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleActionPress(action.onPress)}
            style={[styles.iconButton, { marginLeft: spacing.base }]}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={action.icon} size={24} color={colors.textPrimary} />
            {action.badgeCount && action.badgeCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                <Text style={[typography.captionBold, { color: '#FFF', fontSize: 10 }]}>
                  {action.badgeCount > 9 ? '9+' : action.badgeCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (useGlass) {
    return (
      <View style={style}>
        <GlassSurface
          borderRadius={0}
          elevation={2}
          highlightIntensity={0.08}
          style={{ width: '100%' }}
        >
          {headerContent}
        </GlassSurface>
        {showDivider && <HairlineDivider />}
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor: colors.background }, style]}>
      {headerContent}
      {showDivider && <HairlineDivider />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkRow: {
    justifyContent: 'center',
    paddingVertical: 2,
  },
  centerContainer: {
    position: 'absolute',
    left: 60,
    right: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plainBoldTitle: {
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  chevron: {
    marginLeft: 4,
    marginTop: 2,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});

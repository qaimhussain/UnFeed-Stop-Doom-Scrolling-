/**
 * FloatingGlassTabBar.tsx
 *
 * Floating Glass Bottom Tab Bar for Unfeed.
 * Adapted from Kyant0/AndroidLiquidGlass (Apache-2.0).
 * Copyright (c) 2025 Kyant
 *
 * Features:
 * - Floating rounded capsule inset from screen edges
 * - Real blur using expo-blur on Android (blurMethod="dimezisBlurView")
 * - Dynamic sliding highlight pill under active tab driven by Reanimated spring physics (damping: 18, stiffness: 180)
 * - Press-scale feedback (0.96) on touch
 * - Light haptics (expo-haptics)
 * - Badges for unread messages and locked focus window status
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  AccessibilityInfo,
  Keyboard,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CrystalGlass } from '../common/CrystalGlass';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';
import { storyTimeService } from '../../services/storyTimeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spring physics specified: damping ~18, stiffness ~180
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 1,
};

interface TabItemConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabItemConfig> = {
  Messages: {
    name: 'Messages',
    label: 'Messages',
    activeIcon: 'paper-plane',
    inactiveIcon: 'paper-plane-outline',
  },
  Stories: {
    name: 'Stories',
    label: 'Stories',
    activeIcon: 'aperture',
    inactiveIcon: 'aperture-outline',
  },
  Saved: {
    name: 'Saved',
    label: 'Saved',
    activeIcon: 'bookmark',
    inactiveIcon: 'bookmark-outline',
  },
  Notes: {
    name: 'Notes',
    label: 'Notes',
    activeIcon: 'document-text',
    inactiveIcon: 'document-text-outline',
  },
};

// Tab Bar Layout constants
export const TAB_BAR_HEIGHT = 50;

export const getTabBarFullHeight = (insetsBottom: number = 0): number => {
  const bottomOffset = Math.max(insetsBottom, Platform.OS === 'android' ? 10 : 16);
  return TAB_BAR_HEIGHT + bottomOffset;
};

export const FloatingGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const conversations = useAppStore((state) => state.conversations);
  const stories = useAppStore((state) => state.stories);
  const storyTimeUsage = useAppStore((state) => state.storyTimeUsage);
  const reduceEffects = useAppStore((state) => state.focusSettings?.reduceEffects ?? false);

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unseenStoriesCount = stories.filter((s) => !s.isSeen).length;

  const isStoriesLocked = storyTimeService.isLimitReached(storyTimeUsage.secondsUsed);

  // Tab calculations
  const containerMargin = 16;
  const containerPadding = 4;
  const containerWidth = SCREEN_WIDTH - containerMargin * 2;
  const tabWidth = (containerWidth - containerPadding * 2) / state.routes.length;

  // Reanimated shared values
  const activeIndex = useSharedValue(state.index);
  const keyboardTranslateY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      activeIndex.value = state.index;
    } else {
      activeIndex.value = withSpring(state.index, SPRING_CONFIG);
    }
  }, [state.index, reduceMotion]);

  // Auto-hide floating tab bar when keyboard is active (typing in DMs or Notes)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardTranslateY.value = withSpring(130, SPRING_CONFIG);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardTranslateY.value = withSpring(0, SPRING_CONFIG);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Sliding pill animated style
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: activeIndex.value * tabWidth }],
    };
  });

  const keyboardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: keyboardTranslateY.value }],
    };
  });

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);

  return (
    <Animated.View
      style={[
        styles.floatingWrapper,
        { paddingBottom: bottomPadding },
        keyboardAnimatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <CrystalGlass
        useRealBlur={!reduceEffects}
        blurIntensity={isDark ? 45 : 35}
        borderRadius={26}
        style={[
          styles.container,
          {
            width: containerWidth,
          },
        ]}
      >
        <View style={[styles.innerContent, { paddingHorizontal: containerPadding }]}>
          {/* Sliding Highlight Pill under active tab icon */}
          <Animated.View
            style={[
              styles.slidingPill,
              {
                width: tabWidth,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.18)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
              indicatorStyle,
            ]}
          />

          {/* Tab Buttons */}
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIGS[route.name] || {
              name: route.name,
              label: route.name,
              activeIcon: 'apps',
              inactiveIcon: 'apps-outline',
            };

            // Only Stories tab is restricted. Messages, Notes, and Saved are ALWAYS available.
            const isLocked = route.name === 'Stories' && isStoriesLocked;

            return (
              <TabItemButton
                key={route.key}
                config={config}
                isFocused={isFocused}
                isLocked={isLocked}
                tabWidth={tabWidth}
                unreadBadge={route.name === 'Messages' ? totalUnreadMessages : 0}
                unseenStoriesBadge={route.name === 'Stories' && !isStoriesLocked ? unseenStoriesCount : 0}
                colors={colors}
                reduceMotion={reduceMotion}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
      </CrystalGlass>
    </Animated.View>
  );
};

interface TabItemButtonProps {
  config: TabItemConfig;
  isFocused: boolean;
  isLocked: boolean;
  tabWidth: number;
  unreadBadge: number;
  unseenStoriesBadge: number;
  colors: any;
  reduceMotion: boolean;
  onPress: () => void;
}

const TabItemButton: React.FC<TabItemButtonProps> = ({
  config,
  isFocused,
  isLocked,
  tabWidth,
  unreadBadge,
  unseenStoriesBadge,
  colors,
  reduceMotion,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!reduceMotion) {
      scale.value = withSpring(0.96, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (!reduceMotion) {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, { width: tabWidth }]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View style={[styles.tabIconWrap, animatedStyle]}>
        <Ionicons
          name={isFocused ? config.activeIcon : config.inactiveIcon}
          size={22}
          color={
            isLocked
              ? colors.textSecondary
              : isFocused
              ? colors.textPrimary
              : colors.textSecondary
          }
          style={{ opacity: isLocked ? 0.45 : isFocused ? 1 : 0.7 }}
        />

        {/* Unread message badge */}
        {unreadBadge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.badgeText}>
              {unreadBadge > 9 ? '9+' : unreadBadge}
            </Text>
          </View>
        )}

        {/* Unseen stories ring badge */}
        {unseenStoriesBadge > 0 && (
          <View style={[styles.dotBadge, { backgroundColor: colors.accent }]} />
        )}

        {/* Focus Window Lock Indicator */}
        {isLocked && (
          <View style={[styles.lockBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    height: TAB_BAR_HEIGHT,
    borderRadius: 25,
  },
  innerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 21,
    borderWidth: 0.5,
  },
  tabButton: {
    height: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  dotBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

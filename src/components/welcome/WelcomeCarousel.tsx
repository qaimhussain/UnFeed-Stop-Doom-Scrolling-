/* eslint-disable react-hooks/immutability */
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  cancelAnimation,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CrystalGlass } from '../common/CrystalGlass';
import { useTheme } from '../../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Carousel Geometry ──
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);
const CARD_GAP = 14;
const PAGE_STEP = CARD_WIDTH + CARD_GAP;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// Standard Apple spring physics: damping ~18, stiffness ~180
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 1,
};

export interface WelcomeBenefit {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  title: string;
  desc: string;
  badge: string;
}

export const WELCOME_BENEFITS: WelcomeBenefit[] = [
  {
    id: 'save-hours',
    icon: 'hourglass-outline',
    gradient: ['#FA7E1E', '#D62976'],
    title: 'Save Hours Every Day',
    desc: 'No more unconscious scroll binges. Reclaim your focus for the things that truly matter.',
    badge: 'FOCUS',
  },
  {
    id: 'chats-saved',
    icon: 'chatbubbles-outline',
    gradient: ['#3797F0', '#4F5BD5'],
    title: 'Always Open: Chats & Saved',
    desc: 'Your messages and saved posts, any time. Clean communication without the noise.',
    badge: 'ESSENTIALS',
  },
  {
    id: 'story-time',
    icon: 'timer-outline',
    gradient: ['#D62976', '#962FBF'],
    title: 'Story Time: 20 min a day',
    desc: "See your friends' stories, then get back to life. A healthy boundary built in.",
    badge: 'BALANCE',
  },
];

interface WelcomeCarouselProps {
  onIndexChange?: (index: number) => void;
  paused?: boolean;
}

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({
  onIndexChange,
  paused = false,
}) => {
  const { isDark } = useTheme();
  const isReducedMotion = useReducedMotion();

  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const isUserTouching = useSharedValue(false);
  const currentIndex = useSharedValue(0);
  const [activeDot, setActiveDot] = useState(0);

  const autoAdvanceTimerRef = useRef<any>(null);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const updateDotState = useCallback((idx: number) => {
    setActiveDot(idx);
    if (onIndexChange) onIndexChange(idx);
  }, [onIndexChange]);

  // UI-thread spring snapping
  const snapToPage = useCallback(
    (index: number) => {
      'worklet';
      const clamped = Math.max(0, Math.min(index, WELCOME_BENEFITS.length - 1));
      currentIndex.value = clamped;
      translateX.value = withSpring(-clamped * PAGE_STEP, SPRING_CONFIG, () => {
        runOnJS(updateDotState)(clamped);
      });
    },
    [currentIndex, translateX, updateDotState]
  );

  // Auto-advance loop every 4.5 seconds when user is not touching
  const scheduleAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    if (paused || isReducedMotion) return;

    autoAdvanceTimerRef.current = setInterval(() => {
      if (isUserTouching.value) return;
      const next = (currentIndex.value + 1) % WELCOME_BENEFITS.length;
      snapToPage(next);
      runOnJS(triggerHaptic)();
    }, 4500);
  }, [paused, isReducedMotion, isUserTouching, currentIndex, snapToPage, triggerHaptic]);

  useEffect(() => {
    scheduleAutoAdvance();
    return () => {
      if (autoAdvanceTimerRef.current) clearInterval(autoAdvanceTimerRef.current);
    };
  }, [scheduleAutoAdvance]);

  // ── Pan Gesture Handler for Carousel ──
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          'worklet';
          isUserTouching.value = true;
          startX.value = translateX.value;
          cancelAnimation(translateX);
        })
        .onUpdate((e) => {
          'worklet';
          const rawX = startX.value + e.translationX;
          // Soft rubberband resistance at edges
          if (rawX > 0) {
            translateX.value = rawX * 0.35;
          } else if (rawX < -(WELCOME_BENEFITS.length - 1) * PAGE_STEP) {
            const over = rawX + (WELCOME_BENEFITS.length - 1) * PAGE_STEP;
            translateX.value = -(WELCOME_BENEFITS.length - 1) * PAGE_STEP + over * 0.35;
          } else {
            translateX.value = rawX;
          }
        })
        .onEnd((e) => {
          'worklet';
          isUserTouching.value = false;
          const currentPos = translateX.value;
          let targetIndex = Math.round(-currentPos / PAGE_STEP);

          // Fling velocity threshold
          if (e.velocityX < -450 && targetIndex < WELCOME_BENEFITS.length - 1) {
            targetIndex = Math.min(WELCOME_BENEFITS.length - 1, Math.floor(-currentPos / PAGE_STEP) + 1);
          } else if (e.velocityX > 450 && targetIndex > 0) {
            targetIndex = Math.max(0, Math.ceil(-currentPos / PAGE_STEP) - 1);
          }

          snapToPage(targetIndex);
          runOnJS(triggerHaptic)();
        }),
    [isUserTouching, startX, translateX, snapToPage, triggerHaptic]
  );

  const carouselAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.track, carouselAnimatedStyle]}>
          {WELCOME_BENEFITS.map((benefit, index) => {
            return (
              <CarouselCard
                key={benefit.id}
                benefit={benefit}
                index={index}
                translateX={translateX}
                isDark={isDark}
              />
            );
          })}
        </Animated.View>
      </GestureDetector>

      {/* ── Dynamic Stretching Dot Indicators ── */}
      <View style={styles.paginationRow}>
        {WELCOME_BENEFITS.map((_, i) => (
          <DotIndicator
            key={i}
            index={i}
            translateX={translateX}
            isActive={activeDot === i}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
};

// ── Individual Card Component (Memoized, Pure UI-Thread Animated Transform) ──
interface CarouselCardProps {
  benefit: WelcomeBenefit;
  index: number;
  translateX: SharedValue<number>;
  isDark: boolean;
}

const CarouselCard = React.memo<CarouselCardProps>(({
  benefit,
  index,
  translateX,
  isDark,
}) => {
  const animatedCardStyle = useAnimatedStyle(() => {
    const cardTargetPos = -index * PAGE_STEP;
    const distance = Math.abs(translateX.value - cardTargetPos);
    const progress = distance / PAGE_STEP;

    const scale = interpolate(progress, [0, 1], [1.0, 0.90], Extrapolation.CLAMP);
    const opacity = interpolate(progress, [0, 1], [1.0, 0.55], Extrapolation.CLAMP);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
      <CrystalGlass
        borderRadius={26}
        glowColor={benefit.gradient[0]}
        style={styles.cardGlass}
        contentStyle={styles.cardContent}
      >
        {/* Top Header Row with Badge */}
        <View style={styles.cardTopRow}>
          {/* Big Gradient Icon Squircle */}
          <LinearGradient
            colors={benefit.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconSquircle}
          >
            <Ionicons name={benefit.icon} size={26} color="#FFFFFF" />
          </LinearGradient>

          {/* Micro Category Pill */}
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isDark ? 'rgba(255, 255, 255, 0.70)' : 'rgba(0, 0, 0, 0.60)' },
              ]}
            >
              {benefit.badge}
            </Text>
          </View>
        </View>

        {/* Card Title */}
        <Text
          style={[
            styles.cardTitle,
            { color: isDark ? '#FFFFFF' : '#111111' },
          ]}
          numberOfLines={1}
        >
          {benefit.title}
        </Text>

        {/* Card Body (2 clean lines) */}
        <Text
          style={[
            styles.cardDesc,
            { color: isDark ? 'rgba(255, 255, 255, 0.82)' : 'rgba(0, 0, 0, 0.72)' },
          ]}
          numberOfLines={2}
        >
          {benefit.desc}
        </Text>

        {/* Bottom Accent Glow Line */}
        <LinearGradient
          colors={benefit.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomAccentLine}
        />
      </CrystalGlass>
    </Animated.View>
  );
});

CarouselCard.displayName = 'CarouselCard';

// ── Dot Indicator with UI-Thread Stretching Pill Animation ──
interface DotIndicatorProps {
  index: number;
  translateX: SharedValue<number>;
  isActive: boolean;
  isDark: boolean;
}

const DotIndicator = React.memo<DotIndicatorProps>(({
  index,
  translateX,
  isActive,
  isDark,
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const cardTargetPos = -index * PAGE_STEP;
    const distance = Math.abs(translateX.value - cardTargetPos);
    const progress = Math.min(1, distance / PAGE_STEP);

    const width = interpolate(progress, [0, 1], [24, 7], Extrapolation.CLAMP);
    const opacity = interpolate(progress, [0, 1], [1.0, 0.35], Extrapolation.CLAMP);

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.dotBase,
        {
          backgroundColor: isActive
            ? '#D62976'
            : isDark
            ? 'rgba(255, 255, 255, 0.40)'
            : 'rgba(0, 0, 0, 0.25)',
        },
        animatedDotStyle,
      ]}
    />
  );
});

DotIndicator.displayName = 'DotIndicator';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flexDirection: 'row',
    paddingLeft: SIDE_PADDING,
    paddingRight: SIDE_PADDING,
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
  },
  cardGlass: {
    width: '100%',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 142,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconSquircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  badgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13.5,
    lineHeight: 19.5,
    letterSpacing: 0.1,
  },
  bottomAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    height: 8,
  },
  dotBase: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3.5,
  },
});

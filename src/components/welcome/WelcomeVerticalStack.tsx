/* eslint-disable react-hooks/immutability */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface StackCardData {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  title: string;
  desc: string;
  badge: string;
  accentColor: string;
}

export const STACK_CARDS: StackCardData[] = [
  {
    id: 'save-hours',
    icon: 'hourglass-outline',
    gradient: ['#FA7E1E', '#D62976'],
    title: 'Save Hours Every Day',
    desc: 'No more unconscious scroll binges. Reclaim your focus for what truly matters.',
    badge: 'FOCUS',
    accentColor: '#FA7E1E',
  },
  {
    id: 'chats-saved',
    icon: 'chatbubbles-outline',
    gradient: ['#3797F0', '#4F5BD5'],
    title: 'Always Open: Chats & Saved',
    desc: 'Your messages and saved posts, any time. Pure communication without the noise.',
    badge: 'ESSENTIALS',
    accentColor: '#3797F0',
  },
  {
    id: 'story-time',
    icon: 'sparkles-outline',
    gradient: ['#D62976', '#962FBF'],
    title: 'Story Time: 20 min a day',
    desc: "See your friends' stories with a gentle timer, then get back to real life.",
    badge: 'BALANCE',
    accentColor: '#E1306C',
  },
];

const N = STACK_CARDS.length;
const AUTO_ADVANCE_MS = 4500;
const TRANSITION_MS = 850;
const MANUAL_COOLDOWN_MS = 3000;

interface WelcomeVerticalStackProps {
  paused?: boolean;
}

export const WelcomeVerticalStack: React.FC<WelcomeVerticalStackProps> = ({
  paused = false,
}) => {
  const { width, height } = useWindowDimensions();
  const isReducedMotion = useReducedMotion();

  // Responsive geometry: cards grow with the screen so the middle area is filled
  const cardWidth = Math.min(width - 32, 380);
  const cardHeight = Math.round(Math.min(Math.max(height * 0.235, 176), 220));
  const step1 = Math.round(cardHeight * 0.15); // offset of 2nd card
  const step2 = Math.round(cardHeight * 0.28); // offset of 3rd card
  const deckHeight = Math.round(cardHeight + step2 - cardHeight * 0.06) + 4;

  // Single continuous counter on the UI thread: 0 → 1 → 2 → 3 …
  // No React state changes during animation = no re-render flicker.
  const progress = useSharedValue(0);
  const targetRef = useRef(0);
  const lastManualRef = useRef(0);

  const advance = useCallback(() => {
    targetRef.current += 1;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    if (isReducedMotion) {
      progress.value = targetRef.current;
      return;
    }
    progress.value = withTiming(targetRef.current, {
      duration: TRANSITION_MS,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [isReducedMotion, progress]);

  const handleTap = useCallback(() => {
    lastManualRef.current = Date.now();
    advance();
  }, [advance]);

  // Auto-advance; pauses when screen is covered, and after a manual tap
  useEffect(() => {
    if (paused || isReducedMotion) return;
    const id = setInterval(() => {
      if (Date.now() - lastManualRef.current < MANUAL_COOLDOWN_MS) return;
      advance();
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, isReducedMotion, advance]);

  return (
    <Pressable onPress={handleTap} style={styles.container} accessibilityRole="button" accessibilityLabel="Show next benefit">
      <View style={{ width: cardWidth, height: deckHeight }}>
        {STACK_CARDS.map((card, index) => (
          <StackCard
            key={card.id}
            card={card}
            index={index}
            progress={progress}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            step1={step1}
            step2={step2}
          />
        ))}
      </View>
    </Pressable>
  );
};

interface StackCardProps {
  card: StackCardData;
  index: number;
  progress: SharedValue<number>;
  cardWidth: number;
  cardHeight: number;
  step1: number;
  step2: number;
}

const StackCard: React.FC<StackCardProps> = React.memo(
  ({ card, index, progress, cardWidth, cardHeight, step1, step2 }) => {
    // rel: 0 = front, 1 = middle, 2 = back.
    // (2, 3) is the "exit" lane: the front card lifts up & fades out (3 → 2.55),
    // is invisible while it moves (2.55 → 2.45), then fades in at the back (2.45 → 2).
    // Every keyframe is continuous, so there is never a one-frame jump.
    const cardStyle = useAnimatedStyle(() => {
      let rel = (((index - progress.value) % N) + N) % N;
      if (rel > N - 0.0005) rel = 0;

      const translateY = interpolate(
        rel,
        [0, 1, 2, 2.45, 2.55, 3],
        [0, step1, step2, step2 + 14, -step2 * 0.9, 0],
        Extrapolation.CLAMP
      );
      const scale = interpolate(
        rel,
        [0, 1, 2, 2.45, 2.55, 3],
        [1, 0.94, 0.88, 0.85, 0.97, 1],
        Extrapolation.CLAMP
      );
      const opacity = interpolate(
        rel,
        [0, 2, 2.45, 2.55, 3],
        [1, 1, 0, 0, 1],
        Extrapolation.CLAMP
      );

      // Discrete stacking order. It only changes at rest positions or while
      // the card is fully invisible, so no visible reordering ever happens.
      const zIndex = rel > 2.5 ? 4 : rel < 1 ? 3 : rel < 2 ? 2 : 1;

      return {
        opacity,
        zIndex,
        transform: [{ translateY }, { scale }],
      };
    });

    // Cards further back get darker (an overlay, not transparency),
    // so text never shows through from the card behind.
    const dimStyle = useAnimatedStyle(() => {
      let rel = (((index - progress.value) % N) + N) % N;
      if (rel > N - 0.0005) rel = 0;
      return {
        opacity: interpolate(
          rel,
          [0, 1, 2, 2.5, 2.5001, 3],
          [0, 0.32, 0.55, 0.55, 0, 0],
          Extrapolation.CLAMP
        ),
      };
    });

    return (
      <Animated.View
        style={[
          styles.cardAbsolute,
          { width: cardWidth, height: cardHeight },
          cardStyle,
        ]}
      >
        {/* Static card body, cached as a GPU texture on Android */}
        <View style={styles.cardBody} renderToHardwareTextureAndroid shouldRasterizeIOS>
          {/* 1px crystal gradient border */}
          <LinearGradient
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.cardInner}>
            {/* Opaque dark glass base */}
            <LinearGradient
              colors={['#1C1F2E', '#11131C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Soft accent glow from the top-left */}
            <LinearGradient
              colors={[`${card.accentColor}38`, `${card.accentColor}00`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.75, y: 0.9 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Diagonal specular highlight */}
            <LinearGradient
              colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Bright inner top edge */}
            <View style={styles.topEdge} />

            {/* Content */}
            <View style={styles.topRow}>
              <LinearGradient
                colors={card.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconSquircle}
              >
                <Ionicons name={card.icon} size={26} color="#FFFFFF" />
              </LinearGradient>
              <View style={[styles.badge, { borderColor: `${card.accentColor}70` }]}>
                <Text style={[styles.badgeText, { color: card.accentColor }]}>{card.badge}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {card.title}
              </Text>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {card.desc}
              </Text>
            </View>
          </View>
        </View>

        {/* Depth dimming overlay (only opacity is animated) */}
        <Animated.View pointerEvents="none" style={[styles.dimOverlay, dimStyle]} />
      </Animated.View>
    );
  }
);

StackCard.displayName = 'StackCard';

const RADIUS = 24;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      default: {},
    }),
  },
  cardBody: {
    flex: 1,
    borderRadius: RADIUS,
    padding: 1,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    borderRadius: RADIUS - 1,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconSquircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13.5,
    lineHeight: 19,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS,
    backgroundColor: '#05060A',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassSurface } from '../common/GlassSurface';
import { useTheme } from '../../theme/ThemeContext';

interface BlockedDoomscrollCardProps {
  category?: string;
  customMessage?: string;
  onReturnToAllowed?: () => void;
  returnButtonTitle?: string;
}

export const BlockedDoomscrollCard: React.FC<BlockedDoomscrollCardProps> = ({
  category,
  customMessage,
  onReturnToAllowed,
  returnButtonTitle = 'Return to Direct Messages',
}) => {
  const { colors, typography, isDark } = useTheme();

  // Slide-in animation
  const [slideY] = useState(() => new Animated.Value(40));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        tension: 80,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressReturn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (onReturnToAllowed) {
      onReturnToAllowed();
    }
  };

  // Dark overlay: deeper in dark mode, light scrim in light mode
  const overlayColor = isDark
    ? 'rgba(0, 0, 0, 0.72)'
    : 'rgba(0, 0, 0, 0.40)';

  return (
    <View style={[styles.container, { backgroundColor: overlayColor }]}>
      <Animated.View
        style={[
          styles.cardWrapper,
          { opacity, transform: [{ translateY: slideY }] },
        ]}
      >
        <GlassSurface
          useRealBlur={true}
          blurIntensity={isDark ? 60 : 40}
          borderRadius={28}
          elevation={isDark ? 12 : 8}
          highlightIntensity={isDark ? 0.18 : 0.08}
          style={styles.card}
        >
          <View style={styles.content}>
            {/* Gradient icon ring */}
            <LinearGradient
              colors={['rgba(55,151,240,0.30)', 'rgba(150,47,191,0.25)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrapper}
            >
              <Ionicons name="shield-checkmark" size={34} color="#0095F6" />
            </LinearGradient>

            {/* Badge chip */}
            {category && (
              <View style={[styles.categoryChip, { backgroundColor: isDark ? 'rgba(0,149,246,0.18)' : 'rgba(0,149,246,0.10)' }]}>
                <Text style={[styles.categoryText, { color: colors.accent }]}>
                  {category}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.title,
                { color: colors.textPrimary },
              ]}
            >
              {"That's the part Unfeed hides."}
            </Text>

            <Text
              style={[
                typography.body,
                styles.subtitle,
                { color: colors.textSecondary },
              ]}
            >
              {customMessage ||
                'Unfeed strips away infinite feeds, algorithmic reels, and exploration traps — so you can communicate without distraction.'}
            </Text>

            {onReturnToAllowed && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePressReturn}
                style={styles.returnButtonOuter}
              >
                <LinearGradient
                  colors={['#3797F0', '#6A53AE', '#9B33B5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.returnButton}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={17}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.returnButtonText}>{returnButtonTitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    padding: 28,
  },
  content: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  returnButtonOuter: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3797F0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 4,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  buttonIcon: {
    marginRight: 8,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

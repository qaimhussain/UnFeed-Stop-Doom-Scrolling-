/* eslint-disable react-hooks/immutability */
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';

export interface CrystalGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  useRealBlur?: boolean;
  blurIntensity?: number;
  onPress?: () => void;
  disabled?: boolean;
  glowColor?: string;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CrystalGlass: React.FC<CrystalGlassProps> = ({
  children,
  style,
  contentStyle,
  borderRadius = 22,
  useRealBlur = false,
  blurIntensity = 38,
  onPress,
  disabled = false,
  glowColor,
  testID,
}) => {
  const { isDark } = useTheme();
  const reduceEffects = useAppStore((state) => state.focusSettings?.reduceEffects ?? false);

  // Press feedback spring animation (damping 18, stiffness 180)
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled || !onPress) return;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 180 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [disabled, onPress]);

  const handlePressOut = useCallback(() => {
    if (disabled || !onPress) return;
    scale.value = withSpring(1, { damping: 18, stiffness: 180 });
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // If user enabled "Reduce effects", render solid high-contrast surface
  if (reduceEffects) {
    const solidBg = isDark ? '#161824' : '#FFFFFF';
    const solidBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

    const content = (
      <View
        style={[
          styles.solidContainer,
          {
            borderRadius,
            backgroundColor: solidBg,
            borderColor: solidBorder,
          },
          style,
        ]}
      >
        <View style={contentStyle}>{children}</View>
      </View>
    );

    if (onPress) {
      return (
        <AnimatedPressable
          testID={testID}
          disabled={disabled}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[animatedStyle, style]}
        >
          <View
            style={[
              styles.solidContainer,
              {
                borderRadius,
                backgroundColor: solidBg,
                borderColor: solidBorder,
              },
            ]}
          >
            <View style={contentStyle}>{children}</View>
          </View>
        </AnimatedPressable>
      );
    }

    return content;
  }

  // ── Authentic Apple iPhone Crystal Glass Layers ──
  // 1. Translucent tinted fill
  const glassFillColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.45)';

  // 2. Real blur toggle with automatic fallback if blur fails
  const renderBlur = useRealBlur;

  // 3. Shadow / glow configuration
  const shadowStyle: ViewStyle = {
    shadowColor: glowColor || '#000000',
    shadowOffset: { width: 0, height: glowColor ? 0 : 8 },
    shadowOpacity: glowColor ? 0.42 : isDark ? 0.35 : 0.12,
    shadowRadius: glowColor ? 18 : 16,
    elevation: 6,
  };

  const innerRadius = Math.max(0, borderRadius - 1);

  const glassContent = (
    <View style={[styles.borderWrapper, { borderRadius }, shadowStyle, style]}>
      {/* ── 1px Gradient Border: White 0.50 at top-left to White 0.05 at bottom-right ── */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.50)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        pointerEvents="none"
      />

      {/* ── Inner Glass Container (inset by 1px for pristine border) ── */}
      <View
        style={[
          styles.innerContainer,
          {
            borderRadius: innerRadius,
            backgroundColor: glassFillColor,
          },
        ]}
      >
        {/* Real Blur with expo-blur (Dimezis blur on Android / Native on iOS) */}
        {renderBlur && (
          <BlurView
            intensity={blurIntensity}
            tint={isDark ? 'dark' : 'light'}
            blurMethod="dimezisBlurView"
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
          />
        )}

        {/* Soft Diagonal Specular Highlight (White 0.18 to transparent) */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.18)', 'rgba(255, 255, 255, 0.0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 0.85 }}
          style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
          pointerEvents="none"
        />

        {/* Thin Bright Inner Top Edge Line (White 0.35) */}
        <View
          style={[
            styles.innerTopEdgeLine,
            {
              borderTopLeftRadius: innerRadius,
              borderTopRightRadius: innerRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* Surface Content */}
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {glassContent}
      </AnimatedPressable>
    );
  }

  return glassContent;
};

const styles = StyleSheet.create({
  borderWrapper: {
    padding: 1, // Creates exact 1px gradient border container
    position: 'relative',
    overflow: 'visible',
  },
  innerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  solidContainer: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  innerTopEdgeLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});

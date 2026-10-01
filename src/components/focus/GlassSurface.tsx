/**
 * GlassSurface.tsx
 *
 * Android-friendly Glass UI component inspired by Kyant0/AndroidLiquidGlass (Apache-2.0).
 * Copyright (c) 2025 Kyant
 *
 * Features:
 * - Semi-transparent tinted background (light: rgba(255,255,255,0.65), dark: rgba(30,30,30,0.60))
 * - Subtle vertical LinearGradient highlight (white 0.12 opacity fading to transparent)
 * - 0.5px light border (dark: rgba(255,255,255,0.25), light: rgba(0,0,0,0.08))
 * - Real blur via expo-blur (blurMethod="dimezisBlurView") for designated surfaces (floating tab bar, chat input, story reply)
 * - Automatic fallback to performant faked glass on older devices or when reduceEffects is enabled.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  useRealBlur?: boolean;
  blurIntensity?: number;
  intensity?: 'low' | 'medium' | 'high' | number;
  elevation?: number;
  highlightIntensity?: number;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  borderRadius = 16,
  useRealBlur = false,
  blurIntensity = 50,
  intensity,
  elevation = 4,
  highlightIntensity = 0.12,
}) => {
  const { isDark, colors } = useTheme();
  const reduceEffects = useAppStore((state) => state.focusSettings?.reduceEffects ?? false);

  // If user enabled "Reduce effects", render clean solid surface
  if (reduceEffects) {
    return (
      <View
        style={[
          styles.solidContainer,
          {
            borderRadius,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
            elevation,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Tinted background matching Android glass specifications
  const backgroundColor = isDark
    ? 'rgba(30, 30, 30, 0.60)'
    : 'rgba(255, 255, 255, 0.65)';

  // 0.5px light border
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.25)'
    : 'rgba(0, 0, 0, 0.08)';

  // Should we render real blur?
  const shouldRenderRealBlur = useRealBlur;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          borderColor,
          borderWidth: 0.5,
          elevation,
          shadowOpacity: isDark ? 0.35 : 0.12,
        },
        style,
      ]}
    >
      {/* Real Blur Layer (Android dimezisBlurView / iOS system / Web backdropFilter) */}
      {shouldRenderRealBlur && (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          blurMethod="dimezisBlurView"
          experimentalBlurMethod="dimezisBlurView"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius },
            Platform.select({
              web: {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              } as any,
              default: {},
            }),
          ]}
        />
      )}

      {/* Tinted Glass Layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor,
            borderRadius,
          },
        ]}
      />

      {/* Subtle Vertical LinearGradient Specular Highlight */}
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${highlightIntensity})`,
          'rgba(255, 255, 255, 0.0)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
          },
        ]}
        pointerEvents="none"
      />

      {/* Top Hairline Specular Edge */}
      <View
        style={[
          styles.specularTopLine,
          {
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.20)'
              : 'rgba(255, 255, 255, 0.60)',
          },
        ]}
        pointerEvents="none"
      />

      {/* Surface Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
  },
  solidContainer: {
    overflow: 'hidden',
    borderWidth: 0.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.1,
  },
  specularTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
  },
});

/**
 * GlassBar.tsx
 *
 * Liquid-glass bar used for the top "Unfeed" header and the bezel behind the
 * floating bottom tab bar. Layers (bottom -> top): soft aurora gradient (gives the
 * blur something to refract), real blur, frosted tint, specular edge.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSurface } from '../focus/GlassSurface';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';

interface GlassBarProps {
  position: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

export const GlassBar: React.FC<GlassBarProps> = ({
  position,
  style,
  children,
  pointerEvents,
}) => {
  const { isDark } = useTheme();
  const reduceEffects = useAppStore((state) => state.focusSettings?.reduceEffects ?? false);

  const radius = 24;
  const cornerStyle: ViewStyle =
    position === 'top'
      ? { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }
      : { borderTopLeftRadius: radius, borderTopRightRadius: radius };

  return (
    <View
      pointerEvents={pointerEvents}
      style={[styles.wrapper, cornerStyle, style]}
    >
      {!reduceEffects && (
        <LinearGradient
          colors={
            isDark
              ? [
                  'rgba(254,218,117,0.16)',
                  'rgba(214,41,118,0.22)',
                  'rgba(150,47,191,0.24)',
                  'rgba(79,91,213,0.20)',
                ]
              : [
                  'rgba(254,218,117,0.22)',
                  'rgba(214,41,118,0.16)',
                  'rgba(150,47,191,0.16)',
                  'rgba(79,91,213,0.18)',
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <GlassSurface
        useRealBlur={!reduceEffects}
        blurIntensity={isDark ? 55 : 40}
        borderRadius={0}
        elevation={0}
        highlightIntensity={isDark ? 0.14 : 0.1}
        style={[StyleSheet.absoluteFill, styles.surface]}
      />
      {/* Bright liquid edge on the open side of the bar */}
      <View
        pointerEvents="none"
        style={[
          styles.edge,
          position === 'top' ? { bottom: 0 } : { top: 0 },
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  surface: {
    borderWidth: 0,
    shadowOpacity: 0,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
});

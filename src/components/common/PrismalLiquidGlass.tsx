import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface PrismalLiquidGlassProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  accentColor?: string;
  testID?: string;
}

/**
 * PrismalLiquidGlass
 *
 * Implements the optical liquid glass rendering model inspired by Prismal (OpenGL ES 2.0 / AGSL):
 * 1. Dual-rim border highlights (both the directly-lit rim at top-left and the opposite rim at bottom-right glow)
 * 2. Spherical meniscus curvature (crisp top shelf line at silhouette)
 * 3. Blinn-Phong specular sheen (soft diagonal glare across glass face)
 * 4. High-refraction deep crystal glass base (dark obsidian transmittance)
 * 5. Caustic inner glow (brand accent focused-light inner depth)
 *
 * 100% static, hardware-accelerated, zero animation, zero jitter.
 */
export const PrismalLiquidGlass: React.FC<PrismalLiquidGlassProps> = React.memo(({
  children,
  style,
  contentStyle,
  borderRadius = 20,
  accentColor,
  testID,
}) => {
  const innerRadius = Math.max(0, borderRadius - 1);

  return (
    <View
      testID={testID}
      style={[
        styles.outerContainer,
        { borderRadius },
        style,
      ]}
    >
      {/* ── 1. Prismal Dual-Rim 1px Border ──
          Lit rim at top-left (0.55), fading to 0.10 in center,
          rising to 0.22 at opposite bottom-right rim */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.55)',
          'rgba(255, 255, 255, 0.12)',
          'rgba(255, 255, 255, 0.08)',
          'rgba(255, 255, 255, 0.22)',
        ]}
        locations={[0, 0.35, 0.70, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        pointerEvents="none"
      />

      {/* ── 2. Inner Glass Core (inset 1px for pristine border) ── */}
      <View
        style={[
          styles.innerGlass,
          { borderRadius: innerRadius },
          contentStyle,
        ]}
      >
        {/* Layer A: Deep Obsidian Crystal Base (High IOR refraction simulation) */}
        <LinearGradient
          colors={['#161928', '#0E101B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Layer B: Translucent Glass Surface Tint */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
          ]}
          pointerEvents="none"
        />

        {/* Layer C: Prismal Caustic Accent Glow (subtle refraction from corner) */}
        {accentColor ? (
          <LinearGradient
            colors={[`${accentColor}28`, `${accentColor}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.75, y: 0.85 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        ) : null}

        {/* Layer D: Blinn-Phong Diagonal Specular Reflection (45-degree light sheen) */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.16)',
            'rgba(255, 255, 255, 0.04)',
            'rgba(255, 255, 255, 0.0)',
          ]}
          locations={[0, 0.30, 0.65]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 0.85 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Layer E: Spherical Meniscus Edge (Bright 1px inner top shelf line) */}
        <View
          style={[
            styles.meniscusTopShelf,
            {
              borderTopLeftRadius: innerRadius,
              borderTopRightRadius: innerRadius,
            },
          ]}
          pointerEvents="none"
        />

        {/* Content Children */}
        {children}
      </View>
    </View>
  );
});

PrismalLiquidGlass.displayName = 'PrismalLiquidGlass';

const styles = StyleSheet.create({
  outerContainer: {
    padding: 1, // 1px gradient border container
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  innerGlass: {
    overflow: 'hidden',
    position: 'relative',
  },
  meniscusTopShelf: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
});

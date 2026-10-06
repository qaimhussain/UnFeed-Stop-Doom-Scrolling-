/* eslint-disable react-hooks/immutability */
import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Accelerometer } from 'expo-sensors';

interface ParallaxRadialBackgroundProps {
  enableTiltParallax?: boolean;
}

export const StaticRadialBackground: React.FC<ParallaxRadialBackgroundProps> = React.memo(({
  enableTiltParallax = true,
}) => {
  const isReducedMotion = useReducedMotion();
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (isReducedMotion || !enableTiltParallax || Platform.OS === 'web') return;

    let subscription: any = null;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available) return;

        // 35ms interval (~28fps), gentle, battery-friendly physical tilt sampling
        Accelerometer.setUpdateInterval(35);
        subscription = Accelerometer.addListener(({ x, y }) => {
          // Subtle tilt parallax: shift opposite to phone movement
          // x is typically in [-1, 1], y is in [-1, 1]
          // Offset y by +0.35 for the natural 45-degree angle when holding a phone in hand
          const targetX = Math.max(-18, Math.min(18, -x * 18));
          const targetY = Math.max(-18, Math.min(18, (y + 0.35) * 16));

          tiltX.value = withSpring(targetX, {
            damping: 22,
            stiffness: 85,
            mass: 0.8,
          });
          tiltY.value = withSpring(targetY, {
            damping: 22,
            stiffness: 85,
            mass: 0.8,
          });
        });
      })
      .catch(() => {});

    return () => {
      if (subscription) subscription.remove();
    };
  }, [enableTiltParallax, isReducedMotion, tiltX, tiltY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value },
      { translateY: tiltY.value },
    ],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.svgWrapper, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="deepVioletGlow"
              cx="50%"
              cy="82%"
              rx="75%"
              ry="45%"
              fx="50%"
              fy="82%"
            >
              <Stop offset="0%" stopColor="#2E0854" stopOpacity="0.55" />
              <Stop offset="45%" stopColor="#1B0433" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#05060A" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#deepVioletGlow)" />
        </Svg>
      </Animated.View>
    </View>
  );
});

StaticRadialBackground.displayName = 'StaticRadialBackground';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#05060A',
    overflow: 'hidden',
  },
  svgWrapper: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    left: -24,
    right: -24,
  },
});

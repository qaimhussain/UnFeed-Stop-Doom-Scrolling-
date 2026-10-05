import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AuroraBackgroundProps {
  paused?: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ paused = false }) => {
  const isReducedMotion = useReducedMotion();

  // Slow organic UI-thread float values (20s to 30s cycles)
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob1Scale = useSharedValue(1);

  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob2Scale = useSharedValue(1);

  const blob3X = useSharedValue(0);
  const blob3Y = useSharedValue(0);

  useEffect(() => {
    if (isReducedMotion || paused) {
      cancelAnimation(blob1X);
      cancelAnimation(blob1Y);
      cancelAnimation(blob1Scale);
      cancelAnimation(blob2X);
      cancelAnimation(blob2Y);
      cancelAnimation(blob2Scale);
      cancelAnimation(blob3X);
      cancelAnimation(blob3Y);
      blob1X.value = 0;
      blob1Y.value = 0;
      blob1Scale.value = 1;
      blob2X.value = 0;
      blob2Y.value = 0;
      blob2Scale.value = 1;
      blob3X.value = 0;
      blob3Y.value = 0;
      return;
    }

    // Blob 1: Deep Blue & Indigo (24s cycle)
    blob1X.value = withRepeat(
      withTiming(28, { duration: 24000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withTiming(-36, { duration: 28000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    blob1Scale.value = withRepeat(
      withTiming(1.08, { duration: 22000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    // Blob 2: Violet & Magenta (26s cycle)
    blob2X.value = withRepeat(
      withTiming(-32, { duration: 26000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withTiming(30, { duration: 29000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    blob2Scale.value = withRepeat(
      withTiming(1.06, { duration: 25000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    // Blob 3: Warm Sunset Orange Glow (30s cycle)
    blob3X.value = withRepeat(
      withTiming(24, { duration: 30000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    blob3Y.value = withRepeat(
      withTiming(-20, { duration: 27000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(blob1X);
      cancelAnimation(blob1Y);
      cancelAnimation(blob1Scale);
      cancelAnimation(blob2X);
      cancelAnimation(blob2Y);
      cancelAnimation(blob2Scale);
      cancelAnimation(blob3X);
      cancelAnimation(blob3Y);
    };
  }, [isReducedMotion, paused]);

  const animatedStyleBlob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value },
      { scale: blob1Scale.value },
    ],
  }));

  const animatedStyleBlob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value },
      { scale: blob2Scale.value },
    ],
  }));

  const animatedStyleBlob3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob3X.value },
      { translateY: blob3Y.value },
    ],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* ── Base Layer: Solid Pitch Obsidian Base ── */}
      <View style={styles.baseBackground} />

      {/* ── Aurora Blob 1: Deep Blue & Cyan (Top Left) ── */}
      <Animated.View style={[styles.blobContainer, animatedStyleBlob1]}>
        <Svg width={SCREEN_WIDTH * 1.3} height={SCREEN_HEIGHT * 0.7} viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="blueBlob" cx="40%" cy="35%" rx="55%" ry="55%" fx="40%" fy="35%">
              <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.38" />
              <Stop offset="45%" stopColor="#2563EB" stopOpacity="0.22" />
              <Stop offset="75%" stopColor="#0F172A" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#05060A" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="400" fill="url(#blueBlob)" />
        </Svg>
      </Animated.View>

      {/* ── Aurora Blob 2: Violet & Rich Magenta (Center Right) ── */}
      <Animated.View style={[styles.blobContainer, styles.blob2Position, animatedStyleBlob2]}>
        <Svg width={SCREEN_WIDTH * 1.4} height={SCREEN_HEIGHT * 0.75} viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="violetBlob" cx="65%" cy="45%" rx="60%" ry="60%" fx="65%" fy="45%">
              <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.32" />
              <Stop offset="35%" stopColor="#BE185D" stopOpacity="0.24" />
              <Stop offset="70%" stopColor="#581C87" stopOpacity="0.09" />
              <Stop offset="100%" stopColor="#05060A" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="400" fill="url(#violetBlob)" />
        </Svg>
      </Animated.View>

      {/* ── Aurora Blob 3: Warm Sunset Orange/Amber Ambient Glow (Bottom Center) ── */}
      <Animated.View style={[styles.blobContainer, styles.blob3Position, animatedStyleBlob3]}>
        <Svg width={SCREEN_WIDTH * 1.3} height={SCREEN_HEIGHT * 0.6} viewBox="0 0 400 400">
          <Defs>
            <RadialGradient id="warmBlob" cx="50%" cy="60%" rx="55%" ry="55%" fx="50%" fy="60%">
              <Stop offset="0%" stopColor="#EA580C" stopOpacity="0.24" />
              <Stop offset="40%" stopColor="#D97706" stopOpacity="0.14" />
              <Stop offset="75%" stopColor="#831843" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#05060A" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="400" height="400" fill="url(#warmBlob)" />
        </Svg>
      </Animated.View>

      {/* ── Dark Vignette Overlay: Keeps edges crisp and dark ── */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="50%" rx="70%" ry="70%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#05060A" stopOpacity="0.0" />
            <Stop offset="65%" stopColor="#05060A" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#05060A" stopOpacity="0.80" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#vignette)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  baseBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#05060A',
  },
  blobContainer: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.08,
    left: -SCREEN_WIDTH * 0.15,
  },
  blob2Position: {
    top: SCREEN_HEIGHT * 0.22,
    left: SCREEN_WIDTH * 0.05,
  },
  blob3Position: {
    top: SCREEN_HEIGHT * 0.48,
    left: -SCREEN_WIDTH * 0.1,
  },
});

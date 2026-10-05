import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';

interface UnfeedCrystalWordmarkProps {
  fontSize?: number;
  align?: 'left' | 'center';
  loopShine?: boolean;
  style?: ViewStyle;
}

export const UnfeedCrystalWordmark: React.FC<UnfeedCrystalWordmarkProps> = ({
  fontSize = 60,
  align = 'center',
  loopShine = true,
  style,
}) => {
  const [fontsLoaded] = useFonts({
    GrandHotel_400Regular,
  });

  const isReducedMotion = useReducedMotion();
  const width = fontSize * 3.8;
  const height = fontSize * 1.5;

  // UI-thread specular shine position
  const shineX = useSharedValue(-width * 0.8);

  useEffect(() => {
    if (isReducedMotion) {
      cancelAnimation(shineX);
      shineX.value = -width * 0.8;
      return;
    }

    if (loopShine) {
      // Loop every 5.5 seconds: quick smooth sweep across letters, then pause
      shineX.value = withRepeat(
        withSequence(
          withDelay(
            4500,
            withTiming(width * 1.6, {
              duration: 1000,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            })
          ),
          withTiming(-width * 0.8, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      // Single quiet shimmer on open (for logged-in header pill)
      shineX.value = withSequence(
        withDelay(
          400,
          withTiming(width * 1.6, {
            duration: 1100,
            easing: Easing.out(Easing.cubic),
          })
        )
      );
    }

    return () => {
      cancelAnimation(shineX);
    };
  }, [loopShine, width, isReducedMotion]);

  const animatedShineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shineX.value },
      { rotate: '25deg' },
    ],
  }));

  if (!fontsLoaded) {
    // Keep exact bounding box while font loads to prevent layout shift
    return <View style={[{ width, height }, style]} />;
  }

  const fontStyle: TextStyle = {
    fontSize,
    fontFamily: 'GrandHotel_400Regular',
    fontWeight: '400',
    includeFontPadding: false,
    letterSpacing: -0.2,
    textAlign: align,
  };

  // Exact Instagram brand gradient
  const gradientColors = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'] as const;

  return (
    <View style={[styles.outerContainer, { width, height }, style]}>
      {/* ── Soft Ambient Glow Behind Crystal Text ── */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          {
            width: width * 0.85,
            height: height * 0.8,
            borderRadius: height * 0.4,
          },
        ]}
      />

      {/* ── Crystal Text with Masked Specular Shine ── */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View style={[styles.maskContainer, { alignItems: align === 'center' ? 'center' : 'flex-start' }]}>
            <Text style={[fontStyle, { color: '#000000', width: '100%' }]}>
              Unfeed
            </Text>
          </View>
        }
      >
        {/* Layer 1: Core Instagram Gradient Base */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 2: White Polished Highlight along Top Edge */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.42)', 'rgba(255, 255, 255, 0.0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 3: UI-Thread Specular Shine Sweep */}
        <Animated.View
          style={[
            styles.shineStrip,
            { width: width * 0.45, height: height * 2.2 },
            animatedShineStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.0)',
              'rgba(255, 255, 255, 0.65)',
              'rgba(255, 255, 255, 0.0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ambientGlow: {
    position: 'absolute',
    backgroundColor: '#D62976',
    opacity: 0.22,
    shadowColor: '#D62976',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 4,
  },
  shineStrip: {
    position: 'absolute',
    top: -30,
    left: 0,
  },
});

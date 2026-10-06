/* eslint-disable react-hooks/immutability */
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
  const shineX = useSharedValue(-width * 0.85);

  useEffect(() => {
    if (isReducedMotion) {
      cancelAnimation(shineX);
      shineX.value = -width * 0.85;
      return;
    }

    if (loopShine) {
      // Loop every 4.5 seconds: smooth luxury light sweep across the letters
      shineX.value = withRepeat(
        withSequence(
          withDelay(
            3500,
            withTiming(width * 1.6, {
              duration: 1100,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            })
          ),
          withTiming(-width * 0.85, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      // Single quiet shimmer on open
      shineX.value = withSequence(
        withDelay(
          300,
          withTiming(width * 1.6, {
            duration: 1100,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
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
      {/* ── Crystal Text with Masked Specular Shine (No pink background pill) ── */}
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
            { width: width * 0.40, height: height * 2.5 },
            animatedShineStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.0)',
              'rgba(255, 255, 255, 0.20)',
              'rgba(255, 255, 255, 0.78)',
              'rgba(255, 255, 255, 0.20)',
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
  shineStrip: {
    position: 'absolute',
    top: -30,
    left: 0,
  },
});

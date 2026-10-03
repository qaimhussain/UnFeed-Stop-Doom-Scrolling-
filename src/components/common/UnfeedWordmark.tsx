import React from 'react';
import { View, Text, StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';

interface UnfeedWordmarkProps {
  fontSize?: number;
  color?: string;
  useGradient?: boolean;
  align?: 'left' | 'center';
  style?: ViewStyle;
}

export const UnfeedWordmark: React.FC<UnfeedWordmarkProps> = ({
  fontSize = 32,
  color,
  useGradient = true,
  align = 'center',
  style,
}) => {
  const [fontsLoaded] = useFonts({
    GrandHotel_400Regular,
  });

  const fontStyle: TextStyle = {
    fontSize,
    fontFamily: fontsLoaded
      ? 'GrandHotel_400Regular'
      : Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'sans-serif' }),
    fontWeight: '400',
    includeFontPadding: false,
    letterSpacing: -0.2,
    textAlign: align,
  };

  // Instagram diagonal gradient
  const gradientColors = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'] as const;

  // If not using gradient, render pure iconic Instagram cursive wordmark (clean, crisp, no clipping)
  if (!useGradient) {
    return (
      <View
        style={[
          styles.simpleContainer,
          { alignItems: align === 'center' ? 'center' : 'flex-start' },
          style,
        ]}
      >
        <Text style={[fontStyle, { color: color || '#FFFFFF' }]}>
          Unfeed
        </Text>
      </View>
    );
  }

  // On Web, provide CSS gradient text
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.simpleContainer, style]}>
        <Text
          style={[
            fontStyle,
            {
              backgroundImage:
                'linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)',
              WebkitBackgroundImage:
                'linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            } as any,
          ]}
        >
          Unfeed
        </Text>
      </View>
    );
  }

  // Android / iOS with MaskedView
  const width = fontSize * 3.8;
  const height = fontSize * 1.5;

  return (
    <View style={[{ width, height, justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}>
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
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  simpleContainer: {
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  maskContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
});

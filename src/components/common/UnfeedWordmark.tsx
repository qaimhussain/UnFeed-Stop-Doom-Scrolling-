import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';

interface UnfeedWordmarkProps {
  fontSize?: number;
}

export const UnfeedWordmark: React.FC<UnfeedWordmarkProps> = ({ fontSize = 32 }) => {
  const [fontsLoaded] = useFonts({
    GrandHotel_400Regular,
  });

  const width = fontSize * 3.4;
  const height = fontSize * 1.35;

  const fontStyle = {
    fontSize,
    fontFamily: fontsLoaded ? 'GrandHotel_400Regular' : Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'sans-serif' }),
    fontWeight: '400' as const,
    includeFontPadding: false,
  };

  // Instagram diagonal gradient: #FEDA75 (yellow), #FA7E1E (orange), #D62976 (magenta), #962FBF (purple), #4F5BD5 (blue)
  const gradientColors = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'] as const;

  // On Web, MaskedView can sometimes have rendering edge cases; provide standard CSS background-clip fallback
  if (Platform.OS === 'web') {
    return (
      <View style={{ height, justifyContent: 'center' }}>
        <Text
          style={[
            fontStyle,
            {
              backgroundImage: 'linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)',
              WebkitBackgroundImage: 'linear-gradient(45deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)',
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

  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'flex-start' }}>
      <MaskedView
        style={{ width: '100%', height: '100%' }}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[fontStyle, { color: '#000000' }]}>
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
  maskContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
  },
});

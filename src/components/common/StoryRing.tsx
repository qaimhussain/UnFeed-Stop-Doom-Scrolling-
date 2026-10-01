import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface StoryRingProps {
  size: number;
  hasStory?: boolean;
  isSeen?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  size,
  hasStory = false,
  isSeen = false,
  children,
  style,
}) => {
  const { colors } = useTheme();

  if (!hasStory) {
    return <View style={style}>{children}</View>;
  }

  const ringThickness = 2.5;
  const gap = 2.5;
  const totalOuterSize = size + (ringThickness + gap) * 2;
  const innerGapSize = size + gap * 2;

  if (isSeen) {
    return (
      <View
        style={[
          styles.center,
          {
            width: totalOuterSize,
            height: totalOuterSize,
            borderRadius: totalOuterSize / 2,
            borderWidth: 1.5,
            borderColor: colors.storyRingSeen,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.center,
            {
              width: innerGapSize,
              height: innerGapSize,
              borderRadius: innerGapSize / 2,
              backgroundColor: colors.background,
            },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  // Unseen story: Instagram gradient ring
  return (
    <LinearGradient
      colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.center,
        {
          width: totalOuterSize,
          height: totalOuterSize,
          borderRadius: totalOuterSize / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.center,
          {
            width: innerGapSize,
            height: innerGapSize,
            borderRadius: innerGapSize / 2,
            backgroundColor: colors.background,
          },
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

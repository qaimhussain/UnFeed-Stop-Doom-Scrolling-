import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface HairlineDividerProps {
  style?: ViewStyle;
  insetLeft?: number;
}

export const HairlineDivider: React.FC<HairlineDividerProps> = ({ style, insetLeft = 0 }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.divider,
          marginLeft: insetLeft,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth || 0.5,
    width: '100%',
  },
});

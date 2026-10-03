import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
  const [opacityAnim] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.divider,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const ChatSkeletonRow: React.FC = () => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.chatRow, { paddingHorizontal: spacing.base, paddingVertical: spacing.md }]}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={{ marginLeft: spacing.md, flex: 1, justifyContent: 'center' }}>
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={12} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

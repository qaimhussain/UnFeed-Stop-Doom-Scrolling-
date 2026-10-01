import React, { useState } from 'react';
import {
  View,
  Image,
  ImageProps,
  StyleSheet,
  Text,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source'> {
  source?: { uri?: string } | number;
  uri?: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ImageStyle>;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  source,
  uri,
  fallbackIcon = 'image-outline',
  fallbackText,
  containerStyle,
  style,
  ...rest
}) => {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  const resolvedSource = uri ? { uri } : source;
  const imageUri = typeof resolvedSource === 'object' && resolvedSource !== null ? resolvedSource.uri : null;

  if (hasError || (!imageUri && typeof resolvedSource !== 'number')) {
    return (
      <View
        style={[
          styles.fallbackContainer,
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider },
          containerStyle,
          style as any,
        ]}
      >
        {fallbackText ? (
          <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
            {fallbackText}
          </Text>
        ) : (
          <Ionicons name={fallbackIcon} size={24} color={colors.textTertiary} />
        )}
      </View>
    );
  }

  return (
    <Image
      source={resolvedSource!}
      style={style}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  fallbackText: {
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
  },
});

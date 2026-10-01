import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ImageStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { StoryRing } from './StoryRing';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
  hasStory?: boolean;
  isSeen?: boolean;
  isOnline?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = 'User',
  size = 48,
  hasStory = false,
  isSeen = false,
  isOnline = false,
  onPress,
  style,
}) => {
  const { colors, typography } = useTheme();
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      onPress();
    }
  };

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const content = (
    <View style={[{ width: size, height: size }, style]}>
      {url && !imageError ? (
        <Image
          source={{ uri: url }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.inputBackground,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.divider,
            },
          ]}
        >
          <Text
            style={[
              typography.captionBold,
              {
                color: colors.textSecondary,
                fontSize: Math.max(10, size * 0.35),
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              backgroundColor: '#10D070',
              borderColor: colors.background,
              width: Math.max(10, size * 0.26),
              height: Math.max(10, size * 0.26),
              borderRadius: size * 0.13,
              borderWidth: 2,
            },
          ]}
        />
      )}
    </View>
  );

  const wrappedInRing = (
    <StoryRing size={size} hasStory={hasStory} isSeen={isSeen}>
      {content}
    </StoryRing>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        {wrappedInRing}
      </TouchableOpacity>
    );
  }

  return wrappedInRing;
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

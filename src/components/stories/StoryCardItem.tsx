import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { UserStory } from '../../types';
import { StoryRing } from '../common/StoryRing';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface StoryCardItemProps {
  story: UserStory;
  onPress: () => void;
}

export const StoryCardItem: React.FC<StoryCardItemProps> = ({ story, onPress }) => {
  const { colors, typography } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const coverSlide = story.slides[0];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.divider,
        },
      ]}
    >
      {/* Background preview image */}
      {coverSlide && (
        <ImageWithFallback
          uri={coverSlide.mediaUrl}
          style={styles.coverImage}
          fallbackIcon="image-outline"
        />
      )}

      {/* Dark overlay gradient for readability */}
      <View style={styles.overlay} />

      {/* Top author ring */}
      <View style={styles.authorBadge}>
        <StoryRing size={36} hasStory={true} isSeen={story.isSeen}>
          <ImageWithFallback
            uri={story.user.avatarUrl}
            style={styles.avatarImg}
            fallbackText={story.user.username}
          />
        </StoryRing>
      </View>

      {/* Bottom User Info */}
      <View style={styles.footer}>
        <Text style={[typography.captionBold, styles.authorName]} numberOfLines={1}>
          {story.user.username}
        </Text>
        <Text style={[typography.footnote, styles.timestamp]} numberOfLines={1}>
          {story.lastUpdated}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    position: 'relative',
    margin: 4,
    flex: 1,
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  authorBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  authorName: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontSize: 10,
  },
});

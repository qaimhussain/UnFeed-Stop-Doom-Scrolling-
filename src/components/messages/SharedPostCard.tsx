import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { SharedPostPreview } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface SharedPostCardProps {
  post: SharedPostPreview;
  isSentByMe?: boolean;
  onPress?: (post: SharedPostPreview) => void;
}

export const SharedPostCard: React.FC<SharedPostCardProps> = ({ post, isSentByMe = false, onPress }) => {
  const { colors, typography, spacing } = useTheme();
  const savedItems = useAppStore((state) => state.savedItems);
  const toggleSaveItem = useAppStore((state) => state.toggleSaveItem);

  const isSaved = savedItems.some((item) => item.id === post.id || item.caption === post.caption);

  const handleSaveToggle = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    await toggleSaveItem({
      id: post.id,
      mediaUrl: post.mediaUrl,
      caption: post.caption,
      authorUsername: post.authorUsername,
      authorAvatar: post.authorAvatar,
      collectionIds: ['col_all'],
      createdAt: 'Just now',
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.divider,
        },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { padding: spacing.sm }]}>
        <ImageWithFallback uri={post.authorAvatar} style={styles.authorAvatar} fallbackText={post.authorUsername} />
        <Text
          style={[typography.captionBold, { color: colors.textPrimary, marginLeft: 8, flex: 1 }]}
          numberOfLines={1}
        >
          {post.authorUsername}
        </Text>
        <View style={styles.staticPill}>
          <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 10 }]}>
            Static Post
          </Text>
        </View>
      </View>

      {/* Media Image */}
      <TouchableOpacity
        activeOpacity={onPress ? 0.85 : 1}
        onPress={onPress ? () => onPress(post) : undefined}
      >
        <ImageWithFallback uri={post.mediaUrl} style={styles.image} fallbackIcon="image-outline" />
      </TouchableOpacity>

      {/* Caption & Save Action */}
      <View style={[styles.footer, { padding: spacing.sm }]}>
        <Text
          style={[typography.caption, { color: colors.textPrimary, flex: 1, marginRight: 8 }]}
          numberOfLines={2}
        >
          {post.caption}
        </Text>

        <TouchableOpacity
          onPress={handleSaveToggle}
          style={[
            styles.saveButton,
            {
              backgroundColor: isSaved ? colors.accent : colors.surface,
              borderColor: isSaved ? colors.accent : colors.divider,
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={isSaved ? '#FFFFFF' : colors.textPrimary}
          />
          <Text
            style={[
              typography.captionBold,
              {
                color: isSaved ? '#FFFFFF' : colors.textPrimary,
                marginLeft: 4,
                fontSize: 11,
              },
            ]}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  staticPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    opacity: 0.8,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
  },
});

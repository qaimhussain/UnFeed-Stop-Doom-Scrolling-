import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Collection } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CollectionFolderItemProps {
  collection: Collection;
  onPress: () => void;
  onLongPress?: () => void;
}

export const CollectionFolderItem: React.FC<CollectionFolderItemProps> = ({
  collection,
  onPress,
  onLongPress,
}) => {
  const { colors, typography } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.container}
    >
      <View
        style={[
          styles.thumbnailWrapper,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.divider,
          },
        ]}
      >
        {collection.coverImageUrl ? (
          <ImageWithFallback uri={collection.coverImageUrl} style={styles.coverImage} fallbackIcon="folder-outline" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="folder-outline" size={32} color={colors.textSecondary} />
          </View>
        )}
      </View>

      <Text
        style={[
          typography.bodyMedium,
          {
            color: colors.textPrimary,
            marginTop: 6,
            textAlign: 'left',
          },
        ]}
        numberOfLines={1}
      >
        {collection.name}
      </Text>

      <Text
        style={[
          typography.footnote,
          {
            color: colors.textSecondary,
            marginTop: 1,
            textAlign: 'left',
          },
        ]}
      >
        {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
  },
  thumbnailWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SavedItem } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface SavedGridThumbnailProps {
  item: SavedItem;
  numColumns?: number;
  onPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SavedGridThumbnail: React.FC<SavedGridThumbnailProps> = ({
  item,
  numColumns = 3,
  onPress,
}) => {
  const itemSize = (SCREEN_WIDTH - (numColumns - 1) * 1.5) / numColumns;

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
      style={[styles.container, { width: itemSize, height: itemSize }]}
    >
      <ImageWithFallback uri={item.mediaUrl} style={styles.image} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 1.5,
    marginBottom: 1.5,
    backgroundColor: '#E1E1E1',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

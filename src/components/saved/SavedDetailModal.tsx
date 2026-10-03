import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { SavedItem, Collection } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface SavedDetailModalProps {
  visible: boolean;
  item: SavedItem | null;
  collections: Collection[];
  onClose: () => void;
  onRemove: (itemId: string) => void;
  onMoveToCollection?: (itemId: string, collectionId: string) => void;
}

export const SavedDetailModal: React.FC<SavedDetailModalProps> = ({
  visible,
  item,
  collections,
  onClose,
  onRemove,
  onMoveToCollection,
}) => {
  const { colors, typography, spacing } = useTheme();
  const [showMovePicker, setShowMovePicker] = useState(false);

  if (!item) return null;

  const handleRemove = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    onRemove(item.id);
    onClose();
  };

  const handleMove = (collectionId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onMoveToCollection?.(item.id, collectionId);
    setShowMovePicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {/* Top Navigation */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[typography.h3, { color: colors.textPrimary }]}>Saved Post</Text>

          <TouchableOpacity
            onPress={() => setShowMovePicker(!showMovePicker)}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="folder-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Move to collection dropdown if open */}
        {showMovePicker && (
          <View
            style={[
              styles.movePickerContainer,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider },
            ]}
          >
            <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 8 }]}>
              ADD TO COLLECTION:
            </Text>
            {collections
              .filter((c) => c.id !== 'col_all')
              .map((c) => {
                const isInCol = item.collectionIds.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => handleMove(c.id)}
                    style={styles.colPickerRow}
                  >
                    <Ionicons
                      name={isInCol ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isInCol ? colors.accent : colors.textSecondary}
                    />
                    <Text
                      style={[
                        typography.body,
                        { color: colors.textPrimary, marginLeft: 8 },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* Main Post Detail */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Post Author Info */}
          <View style={[styles.authorRow, { paddingHorizontal: spacing.base, paddingVertical: spacing.md }]}>
            <ImageWithFallback uri={item.authorAvatar} style={styles.authorAvatar} fallbackText={item.authorUsername} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                {item.authorUsername}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Saved • {item.createdAt}
              </Text>
            </View>
          </View>

          {/* Full Media Image */}
          <View style={styles.mediaWrapper}>
            <ImageWithFallback uri={item.mediaUrl} style={styles.mediaImage} fallbackIcon="image-outline" />
          </View>

          {/* Caption & Actions */}
          <View style={[styles.captionSection, { padding: spacing.base }]}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleRemove}
                style={[
                  styles.removeBtn,
                  {
                    borderColor: colors.destructive,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="bookmark" size={18} color={colors.destructive} />
                <Text style={[typography.captionBold, { color: colors.destructive, marginLeft: 6 }]}>
                  Remove from saved
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.md }]}>
              <Text style={typography.bodyBold}>{item.authorUsername} </Text>
              {item.caption}
            </Text>

            <View style={[styles.noticeBox, { backgroundColor: colors.surfaceSecondary, marginTop: spacing.xl }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 8, flex: 1 }]}>
                Distraction-free: No comments, recommended posts, or endless scrolling.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  mediaWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1A1A1A',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  captionSection: {},
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  movePickerContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  colPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { SavedGridThumbnail } from '../components/saved/SavedGridThumbnail';
import { SavedDetailModal } from '../components/saved/SavedDetailModal';
import { CreateCollectionModal } from '../components/saved/CreateCollectionModal';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { EmptyState } from '../components/common/EmptyState';
import { SavedItem } from '../types';

interface CollectionDetailScreenProps {
  route: {
    params: {
      collectionId: string;
    };
  };
  navigation: any;
}

export const CollectionDetailScreen: React.FC<CollectionDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { collectionId } = route.params;
  const { colors, typography, spacing } = useTheme();

  const collection = useAppStore((state) =>
    state.collections.find((c) => c.id === collectionId)
  );
  const collections = useAppStore((state) => state.collections);
  const allSavedItems = useAppStore((state) => state.savedItems);
  const renameCollection = useAppStore((state) => state.renameCollection);
  const deleteCollection = useAppStore((state) => state.deleteCollection);
  const removeSavedItem = useAppStore((state) => state.removeSavedItem);
  const moveItemToCollection = useAppStore((state) => state.moveItemToCollection);

  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);

  if (!collection) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorBox}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Collection not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={[typography.bodyBold, { color: colors.accent }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const items =
    collectionId === 'col_all'
      ? allSavedItems
      : allSavedItems.filter((i) => i.collectionIds.includes(collectionId));

  const handleDeleteCollection = () => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? Saved posts will remain in "All Posts".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            }
            await deleteCollection(collectionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[typography.h3, { color: colors.textPrimary }]} numberOfLines={1}>
          {collection.name}
        </Text>

        {collectionId !== 'col_all' ? (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(collection.name, 'Manage collection', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Rename', onPress: () => setIsRenameModalVisible(true) },
                { text: 'Delete Collection', style: 'destructive', onPress: handleDeleteCollection },
              ]);
            }}
            style={styles.headerBtn}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {/* Grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <SavedGridThumbnail item={item} onPress={() => setSelectedItem(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="Collection is empty"
            description="Add posts to this collection by saving them from chats or the All Posts tab."
          />
        }
        ListFooterComponent={
          items.length > 0 ? (
            <CaughtUpNotice subtitle={`All items in ${collection.name}.`} />
          ) : null
        }
      />

      {/* Detail Modal */}
      <SavedDetailModal
        visible={selectedItem !== null}
        item={selectedItem}
        collections={collections}
        onClose={() => setSelectedItem(null)}
        onRemove={(id) => removeSavedItem(id)}
        onMoveToCollection={(itemId, colId) => moveItemToCollection(itemId, colId)}
      />

      {/* Rename Modal */}
      <CreateCollectionModal
        visible={isRenameModalVisible}
        initialName={collection.name}
        isRenaming={true}
        onClose={() => setIsRenameModalVisible(false)}
        onSave={(newName) => renameCollection(collectionId, newName)}
      />
    </SafeAreaView>
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
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

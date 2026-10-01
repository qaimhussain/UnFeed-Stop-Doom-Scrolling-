import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { SavedGridThumbnail } from '../components/saved/SavedGridThumbnail';
import { CollectionFolderItem } from '../components/saved/CollectionFolderItem';
import { SavedDetailModal } from '../components/saved/SavedDetailModal';
import { CreateCollectionModal } from '../components/saved/CreateCollectionModal';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { EmptyState } from '../components/common/EmptyState';
import { SavedItem, Collection } from '../types';

interface SavedScreenProps {
  navigation: any;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ navigation }) => {
  const { colors, typography, isDark, spacing } = useTheme();
  const savedItems = useAppStore((state) => state.savedItems);
  const collections = useAppStore((state) => state.collections);
  const dailyFocusWindow = useAppStore((state) => state.dailyFocusWindow);
  const createCollection = useAppStore((state) => state.createCollection);
  const removeSavedItem = useAppStore((state) => state.removeSavedItem);
  const moveItemToCollection = useAppStore((state) => state.moveItemToCollection);

  const [activeTab, setActiveTab] = useState<'all' | 'collections'>('all');
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const handleTabChange = (tab: 'all' | 'collections') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setActiveTab(tab);
  };

  const handleOpenCollection = (collection: Collection) => {
    navigation.navigate('CollectionDetail', { collectionId: collection.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header
        title="Saved"
        rightActions={[
          {
            icon: 'add-outline',
            onPress: () => setIsCreateModalVisible(true),
          },
        ]}
      />

      {/* Segmented Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => handleTabChange('all')}
          style={[
            styles.tabItem,
            activeTab === 'all' && { borderBottomColor: colors.textPrimary, borderBottomWidth: 1.5 },
          ]}
        >
          <Ionicons
            name={activeTab === 'all' ? 'grid' : 'grid-outline'}
            size={20}
            color={activeTab === 'all' ? colors.textPrimary : colors.textSecondary}
          />
          <Text
            style={[
              typography.captionBold,
              {
                color: activeTab === 'all' ? colors.textPrimary : colors.textSecondary,
                marginLeft: 6,
              },
            ]}
          >
            All Posts ({savedItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('collections')}
          style={[
            styles.tabItem,
            activeTab === 'collections' && {
              borderBottomColor: colors.textPrimary,
              borderBottomWidth: 1.5,
            },
          ]}
        >
          <Ionicons
            name={activeTab === 'collections' ? 'folder' : 'folder-outline'}
            size={20}
            color={activeTab === 'collections' ? colors.textPrimary : colors.textSecondary}
          />
          <Text
            style={[
              typography.captionBold,
              {
                color: activeTab === 'collections' ? colors.textPrimary : colors.textSecondary,
                marginLeft: 6,
              },
            ]}
          >
            Collections ({collections.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Library Subheader */}
      <View style={[styles.timerRow, { borderBottomColor: colors.divider }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Private library • Only visible to you
        </Text>
      </View>

      {/* Content */}
      {activeTab === 'all' ? (
        /* 3-Column Square Grid */
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <SavedGridThumbnail item={item} onPress={() => setSelectedItem(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="Save photos and videos"
              description="Save items from chats or friend stories. No one will be notified."
            />
          }
          ListFooterComponent={
            savedItems.length > 0 ? (
              <CaughtUpNotice subtitle="All saved items displayed. No algorithmic recommendations." />
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        /* Collections Grid */
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.colWrapper}
          contentContainerStyle={[styles.colListContent, { padding: spacing.base }]}
          renderItem={({ item }) => (
            <CollectionFolderItem
              collection={item}
              onPress={() => handleOpenCollection(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="folder-outline"
              title="Organize with collections"
              description="Group your saved posts into folders by topic or idea."
              actionLabel="New Collection"
              onAction={() => setIsCreateModalVisible(true)}
            />
          }
          ListFooterComponent={
            collections.length > 0 ? (
              <CaughtUpNotice subtitle="All your personal collections." />
            ) : null
          }
        />
      )}

      {/* Post Detail Modal */}
      <SavedDetailModal
        visible={selectedItem !== null}
        item={selectedItem}
        collections={collections}
        onClose={() => setSelectedItem(null)}
        onRemove={(id) => removeSavedItem(id)}
        onMoveToCollection={(itemId, colId) => moveItemToCollection(itemId, colId)}
      />

      {/* Create Collection Modal */}
      <CreateCollectionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSave={(name) => createCollection(name)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingBottom: 24,
  },
  colWrapper: {
    justifyContent: 'space-between',
  },
  colListContent: {
    paddingBottom: 24,
  },
});

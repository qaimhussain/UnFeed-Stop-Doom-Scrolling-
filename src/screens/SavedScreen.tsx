import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { UnfeedWordmark } from '../components/common/UnfeedWordmark';
import { SavedGridThumbnail } from '../components/saved/SavedGridThumbnail';
import { CollectionFolderItem } from '../components/saved/CollectionFolderItem';
import { SavedDetailModal } from '../components/saved/SavedDetailModal';
import { CreateCollectionModal } from '../components/saved/CreateCollectionModal';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { EmptyState } from '../components/common/EmptyState';
import { InstagramWebView } from '../components/webview/InstagramWebView';
import { INSTAGRAM_CONFIG } from '../config/instagramRules';
import { SavedItem, Collection } from '../types';

interface SavedScreenProps {
  navigation: any;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ navigation }) => {
  const { colors, typography, isDark, spacing } = useTheme();
  const savedItems = useAppStore((state) => state.savedItems);
  const collections = useAppStore((state) => state.collections);
  const createCollection = useAppStore((state) => state.createCollection);
  const removeSavedItem = useAppStore((state) => state.removeSavedItem);
  const moveItemToCollection = useAppStore((state) => state.moveItemToCollection);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const isInstagramLoggedIn = useAppStore((state) => state.isInstagramLoggedIn);

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

  // Real Instagram Saved Posts Mode (Logged in with real account)
  if (!isDemoMode && isInstagramLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Minimal Glass Top Bar with Wordmark */}
        <View style={[styles.realHeader, { borderBottomColor: colors.divider }]}>
          <UnfeedWordmark fontSize={32} color={colors.textPrimary} />
          <View style={styles.headerRightRow}>
            <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[typography.captionBold, { color: colors.textSecondary, fontSize: 11 }]}>
                Saved Posts
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Instagram Saved Posts WebView */}
        <View style={styles.realWebViewContainer}>
          <InstagramWebView
            initialUrl={INSTAGRAM_CONFIG.SAVED_URL}
            fallbackUrl="https://www.instagram.com/saved/"
            style={styles.realWebView}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Demo Mode Saved Collections
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header
        title="Saved (Demo)"
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

      {/* Tab Content */}
      {activeTab === 'all' ? (
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SavedGridThumbnail
              item={item}
              onPress={() => setSelectedItem(item)}
            />
          )}
          ListFooterComponent={() => (
            <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.sm }}>
              <CaughtUpNotice subtitle="All bookmarked inspirations organized." />
            </View>
          )}
          ListEmptyComponent={() => (
            <EmptyState
              icon="bookmark-outline"
              title="No Saved Posts"
              description="Your saved posts from Instagram will appear here."
            />
          )}
        />
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.colListContent}
          columnWrapperStyle={styles.colWrapper}
          renderItem={({ item }) => (
            <CollectionFolderItem
              collection={item}
              onPress={() => handleOpenCollection(item)}
            />
          )}
        />
      )}

      {/* Modals */}
      <SavedDetailModal
        visible={selectedItem !== null}
        item={selectedItem}
        collections={collections}
        onClose={() => setSelectedItem(null)}
        onRemove={(id) => removeSavedItem(id)}
        onMoveToCollection={(itemId, colId) => moveItemToCollection(itemId, colId)}
      />

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
  realHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 8,
  },
  realWebViewContainer: {
    flex: 1,
    paddingBottom: 68, // Clearance for floating glass tab bar
  },
  realWebView: {
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  colWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  colListContent: {
    paddingBottom: 80,
  },
});

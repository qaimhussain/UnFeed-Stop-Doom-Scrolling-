import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  BackHandler,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { UnfeedWordmark } from '../components/common/UnfeedWordmark';
import { GlassSurface } from '../components/common/GlassSurface';
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
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, spacing } = useTheme();
  const savedItems = useAppStore((state) => state.savedItems);
  const collections = useAppStore((state) => state.collections);
  const createCollection = useAppStore((state) => state.createCollection);
  const removeSavedItem = useAppStore((state) => state.removeSavedItem);
  const moveItemToCollection = useAppStore((state) => state.moveItemToCollection);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const isInstagramLoggedIn = useAppStore((state) => state.isInstagramLoggedIn);
  const instagramUsername = useAppStore((state) => state.instagramUsername);

  const [activeTab, setActiveTab] = useState<'all' | 'collections'>('all');
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [showOfflineVault, setShowOfflineVault] = useState(false);
  const [handleInput, setHandleInput] = useState('');
  const webViewRef = useRef<any>(null);

  // Clearance so content stops right above floating tab bar
  const bottomTabBarClearance = 50 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16) + 16;

  // Compute real Instagram user saved posts URL
  const realSavedUrl = instagramUsername
    ? `https://www.instagram.com/${encodeURIComponent(instagramUsername)}/saved/`
    : '';

  const isViewingSingleSavedPost =
    currentUrl.includes('/p/') ||
    currentUrl.includes('/reel/') ||
    currentUrl.includes('/reels/') ||
    currentUrl.includes('/tv/');

  // Android Back Button handler for Saved
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isViewingSingleSavedPost && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isViewingSingleSavedPost]);

  const handleTabChange = (tab: 'all' | 'collections') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setActiveTab(tab);
  };

  const handleOpenCollection = (collection: Collection) => {
    navigation.navigate('CollectionDetail', { collectionId: collection.id });
  };

  // If logged in but username is not yet known, prompt user cleanly rather than loading public @saved
  if (!isDemoMode && isInstagramLoggedIn && !showOfflineVault && !instagramUsername) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.realHeader, { borderBottomColor: colors.divider }]}>
          <UnfeedWordmark fontSize={32} useGradient={true} align="left" />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.promptContainer, { paddingBottom: bottomTabBarClearance }]}>
          <GlassSurface
            useRealBlur={true}
            blurIntensity={isDark ? 45 : 25}
            borderRadius={24}
            elevation={isDark ? 8 : 4}
            style={styles.promptCard}
          >
            <View style={[styles.promptIconCircle, { backgroundColor: isDark ? 'rgba(0,149,246,0.15)' : 'rgba(0,149,246,0.1)' }]}>
              <Ionicons name="bookmark" size={28} color="#0095F6" />
            </View>

            <Text style={[typography.h3, styles.promptTitle, { color: colors.textPrimary }]}>
              Your Saved Vault
            </Text>

            <Text style={[typography.body, styles.promptSubtitle, { color: colors.textSecondary }]}>
              Instagram stores saved posts under your handle. Enter your Instagram username once to open your private vault.
            </Text>

            <View style={[styles.inputRow, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
              <Text style={[styles.atSymbol, { color: colors.textTertiary }]}>@</Text>
              <TextInput
                value={handleInput}
                onChangeText={setHandleInput}
                placeholder="your_handle"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.handleTextInput, { color: colors.textPrimary }]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.openVaultButton, { opacity: handleInput.trim().length > 0 ? 1 : 0.6 }]}
              disabled={handleInput.trim().length === 0}
              onPress={() => {
                const clean = handleInput.trim().replace(/^@+/, '').toLowerCase();
                if (clean.length > 0) {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  }
                  useAppStore.getState().setInstagramLoggedIn(true, clean);
                }
              }}
            >
              <LinearGradient
                colors={['#0095F6', '#6A53AE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.openVaultGradient}
              >
                <Text style={styles.openVaultButtonText}>Open My Saved Posts</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.offlineFallbackButton}
              onPress={() => setShowOfflineVault(true)}
            >
              <Ionicons name="cloud-offline-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={[typography.captionBold, { color: colors.accent }]}>
                Browse Local Offline Vault
              </Text>
            </TouchableOpacity>
          </GlassSurface>
        </View>
      </SafeAreaView>
    );
  }

  // Real Instagram Saved Posts Mode (Logged in with real account and not explicitly viewing offline vault)
  if (!isDemoMode && isInstagramLoggedIn && !showOfflineVault && realSavedUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Minimal Clean Top Bar with Wordmark */}
        <View style={[styles.realHeader, { borderBottomColor: colors.divider }]}>
          {isViewingSingleSavedPost ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButtonRow}
              onPress={() => webViewRef.current?.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                Back to Saved
              </Text>
            </TouchableOpacity>
          ) : (
            <UnfeedWordmark fontSize={32} useGradient={true} align="left" />
          )}

          <View style={styles.headerRightRow}>
            {/* Quick jump to Offline Cached Vault */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.pillBadge,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.divider,
                  borderWidth: 0.5,
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 6,
                },
              ]}
              onPress={() => setShowOfflineVault(true)}
              accessibilityLabel="Open Offline Saved Vault"
            >
              <Ionicons name="cloud-offline-outline" size={13} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={[typography.captionBold, { color: colors.accent, fontSize: 11 }]}>
                Offline Vault
              </Text>
            </TouchableOpacity>

            {instagramUsername && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.pillBadge,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.divider,
                    borderWidth: 0.5,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: 6,
                  },
                ]}
                onPress={() => {
                  Alert.alert(
                    'Saved Account',
                    `Currently showing saved posts for @${instagramUsername}.\n\nDo you want to switch account handle?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Change Handle',
                        onPress: () => {
                          useAppStore.getState().setInstagramLoggedIn(true, null);
                        },
                      },
                    ]
                  );
                }}
                accessibilityLabel="Saved handle"
              >
                <Text style={[typography.captionBold, { color: colors.textSecondary, fontSize: 11 }]}>
                  @{instagramUsername}
                </Text>
              </TouchableOpacity>
            )}

            <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[typography.captionBold, { color: colors.textSecondary, fontSize: 11 }]}>
                {currentUrl.includes('/reel/') || currentUrl.includes('/reels/') ? 'Reel' : isViewingSingleSavedPost ? 'Post' : 'Saved'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Settings"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Instagram Saved Posts WebView */}
        <View style={[styles.realWebViewContainer, { paddingBottom: bottomTabBarClearance }]}>
          <InstagramWebView
            ref={webViewRef}
            key={realSavedUrl}
            initialUrl={realSavedUrl}
            fallbackUrl={realSavedUrl}
            isFromSaved={true}
            onNavigationStateChange={(navState) => {
              setCurrentUrl(navState.url);
            }}
            style={styles.realWebView}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Offline Saved Collections & Vault View
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header
        title={!isDemoMode && isInstagramLoggedIn ? "Offline Saved Vault" : "Saved"}
        leftAction={
          !isDemoMode && isInstagramLoggedIn
            ? {
                icon: 'arrow-back',
                onPress: () => setShowOfflineVault(false),
              }
            : undefined
        }
        rightActions={[
          {
            icon: 'add-outline',
            onPress: () => setIsCreateModalVisible(true),
          },
        ]}
      />

      {/* Offline Status Banner */}
      <View
        style={[
          styles.offlineNoticeBar,
          {
            backgroundColor: isDark ? 'rgba(0,149,246,0.1)' : 'rgba(0,149,246,0.06)',
            borderColor: colors.divider,
          },
        ]}
      >
        <Ionicons name="cloud-offline-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
        <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
          Offline Peace of Mind • All saved posts & collections are locally cached.
        </Text>
      </View>

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
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomTabBarClearance + 24 }]}
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
          contentContainerStyle={[styles.colListContent, { paddingBottom: bottomTabBarClearance + 24 }]}
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
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  realWebViewContainer: {
    flex: 1,
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
    minHeight: 48,
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
  offlineNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  promptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  promptCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 24,
  },
  promptIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  promptSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  handleTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  openVaultButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  openVaultGradient: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  openVaultButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  offlineFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});

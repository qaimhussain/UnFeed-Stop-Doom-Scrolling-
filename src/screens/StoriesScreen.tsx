import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { UnfeedWordmark } from '../components/common/UnfeedWordmark';
import { StoryCardItem } from '../components/stories/StoryCardItem';
import { StoryViewerModal } from '../components/stories/StoryViewerModal';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { EmptyState } from '../components/common/EmptyState';
import { InstagramWebView } from '../components/webview/InstagramWebView';
import { INSTAGRAM_CONFIG } from '../config/instagramRules';

interface StoriesScreenProps {
  navigation: any;
}

export const StoriesScreen: React.FC<StoriesScreenProps> = ({ navigation }) => {
  const { colors, typography, isDark, spacing } = useTheme();
  const stories = useAppStore((state) => state.stories);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const isInstagramLoggedIn = useAppStore((state) => state.isInstagramLoggedIn);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
  };

  // Real Instagram Stories Mode (Logged in with real account)
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
                Stories Only
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

        {/* Real Instagram Stories Tray & Viewer (Feed hidden via CSS) */}
        <View style={styles.realWebViewContainer}>
          <InstagramWebView
            initialUrl={INSTAGRAM_CONFIG.BASE_URL}
            fallbackUrl={INSTAGRAM_CONFIG.BASE_URL}
            style={styles.realWebView}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Demo Mode Stories
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header
        title="Stories (Demo)"
        rightActions={[
          {
            icon: 'settings-outline',
            onPress: () => navigation.navigate('Settings'),
          },
        ]}
      />

      {/* Stories Grid */}
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[styles.gridContent, { padding: spacing.xs }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item, index }) => (
          <StoryCardItem
            story={item}
            onPress={() => handleOpenStory(index)}
          />
        )}
        ListFooterComponent={() => (
          <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.sm }}>
            <CaughtUpNotice subtitle="You are all caught up on stories." />
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            icon="aperture-outline"
            title="No Stories"
            description="No active stories from the people you follow."
          />
        )}
      />

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          visible={true}
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onNavigateToChat={(convId) => {
            setActiveStoryIndex(null);
            navigation.navigate('ChatDetail', { conversationId: convId });
          }}
        />
      )}
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
  gridContent: {
    paddingBottom: 80,
  },
});

import React, { useState, useEffect, useRef } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

import { GlassSurface } from '../components/common/GlassSurface';
import { storyTimeService } from '../services/storyTimeService';

interface StoriesScreenProps {
  navigation: any;
}

export const StoriesScreen: React.FC<StoriesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, spacing } = useTheme();
  const stories = useAppStore((state) => state.stories);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const isInstagramLoggedIn = useAppStore((state) => state.isInstagramLoggedIn);
  const storyTimeUsage = useAppStore((state) => state.storyTimeUsage);
  const startStoryViewingSession = useAppStore((state) => state.startStoryViewingSession);
  const endStoryViewingSession = useAppStore((state) => state.endStoryViewingSession);
  const tickStoryTime = useAppStore((state) => state.tickStoryTime);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const webViewRef = useRef<any>(null);

  // Clearance so content stops right above floating tab bar
  const bottomTabBarClearance = 50 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16) + 16;

  const secondsUsed = storyTimeUsage?.secondsUsed ?? 0;
  const isStoryLimitReached = secondsUsed >= 1200;
  const remainingSeconds = Math.max(0, 1200 - secondsUsed);
  const isViewingStory = currentUrl.includes('/stories/');
  const isWarning = remainingSeconds <= 120 && remainingSeconds > 0; // 2 minutes or less

  // Story viewing timer countdown: only ticks while URL contains /stories/ and limit not reached
  useEffect(() => {
    if (isViewingStory && !isStoryLimitReached) {
      startStoryViewingSession();
      const interval = setInterval(() => {
        tickStoryTime();
      }, 1000);
      return () => {
        clearInterval(interval);
        endStoryViewingSession();
      };
    } else {
      endStoryViewingSession();
    }
  }, [isViewingStory, isStoryLimitReached]);

  // Format timer strings
  const timerMins = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const formattedTimeLeft = `${timerMins}:${String(timerSecs).padStart(2, '0')}`;

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
            <View
              style={[
                styles.pillBadge,
                {
                  backgroundColor: isWarning
                    ? 'rgba(255, 160, 0, 0.16)'
                    : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: isWarning ? '#FFA000' : colors.textSecondary,
                    fontSize: 11,
                  },
                ]}
              >
                {isStoryLimitReached ? '0m left' : `${Math.ceil(remainingSeconds / 60)}m left`}
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

        {/* Real Instagram Stories Tray & Viewer (Feed hidden via CSS) */}
        <View style={[styles.realWebViewContainer, { paddingBottom: bottomTabBarClearance }]}>
          <InstagramWebView
            ref={webViewRef}
            initialUrl={INSTAGRAM_CONFIG.BASE_URL}
            fallbackUrl={INSTAGRAM_CONFIG.BASE_URL}
            isStoriesContext={true}
            onNavigationStateChange={(navState) => {
              setCurrentUrl(navState.url);
            }}
            style={styles.realWebView}
          />

          {/* Floating Glass Pill: Story time left: mm:ss (warn at 2 min) */}
          {isViewingStory && !isStoryLimitReached && (
            <View style={styles.floatingTimerWrap} pointerEvents="box-none">
              <GlassSurface
                useRealBlur={true}
                blurIntensity={55}
                borderRadius={20}
                elevation={6}
                style={[
                  styles.timerGlassCard,
                  isWarning && styles.timerWarningBorder,
                ]}
              >
                <Ionicons
                  name={isWarning ? 'alert-circle' : 'timer-outline'}
                  size={15}
                  color={isWarning ? '#FFA000' : colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    typography.captionBold,
                    { color: isWarning ? '#FFA000' : '#FFFFFF' },
                  ]}
                >
                  Story time left: {formattedTimeLeft}
                </Text>
              </GlassSurface>
            </View>
          )}

          {/* Lock Overlay when 20m daily limit is reached */}
          {isStoryLimitReached && isViewingStory && (
            <View style={styles.lockOverlay}>
              <GlassSurface
                useRealBlur={true}
                blurIntensity={65}
                borderRadius={24}
                elevation={10}
                style={styles.lockCard}
              >
                <Ionicons name="time" size={44} color="#FA7E1E" style={{ marginBottom: 12 }} />
                <Text style={[typography.h3, { color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }]}>
                  Daily Story Time Reached
                </Text>
                <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                  {"You've used today's story time. See you tomorrow."}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.closeStoryBtn, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    if (webViewRef.current) {
                      webViewRef.current.injectJavaScript(
                        `window.location.href = "${INSTAGRAM_CONFIG.BASE_URL}"; true;`
                      );
                    }
                  }}
                >
                  <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Close Story</Text>
                </TouchableOpacity>
              </GlassSurface>
            </View>
          )}
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
        contentContainerStyle={[styles.gridContent, { padding: spacing.xs, paddingBottom: bottomTabBarClearance + 24 }]}
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
  gridContent: {
    paddingBottom: 80,
  },
  floatingTimerWrap: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  timerGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timerWarningBorder: {
    borderColor: '#FFA000',
    borderWidth: 1,
    backgroundColor: 'rgba(25, 15, 0, 0.85)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 200,
  },
  lockCard: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 24, 0.85)',
  },
  closeStoryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
});

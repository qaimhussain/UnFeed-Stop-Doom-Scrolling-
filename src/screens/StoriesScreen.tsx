import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { StoryCardItem } from '../components/stories/StoryCardItem';
import { StoryViewerModal } from '../components/stories/StoryViewerModal';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { EmptyState } from '../components/common/EmptyState';
import { LockedTabScreen } from '../components/focus/LockedTabScreen';
import { storyTimeService } from '../services/storyTimeService';
import { STORY_DAILY_LIMIT_SECONDS } from '../config/storyTimeConfig';

interface StoriesScreenProps {
  navigation: any;
}

export const StoriesScreen: React.FC<StoriesScreenProps> = ({ navigation }) => {
  const { colors, typography, isDark, spacing } = useTheme();
  const stories = useAppStore((state) => state.stories);
  const storyTimeUsage = useAppStore((state) => state.storyTimeUsage);
  const tickStoryTime = useAppStore((state) => state.tickStoryTime);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tick clock for rollover check
  useEffect(() => {
    const timer = setInterval(() => {
      tickStoryTime();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickStoryTime]);

  const accessStatus = storyTimeService.getStoryAccessStatus(storyTimeUsage.secondsUsed);

  // Auto-close open viewer if limit reached while on Stories
  useEffect(() => {
    if (!accessStatus.isAccessible && activeStoryIndex !== null) {
      setActiveStoryIndex(null);
    }
  }, [accessStatus.isAccessible, activeStoryIndex]);

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

  const handleNavigateToChat = (conversationId: string) => {
    navigation.navigate('ChatDetail', { conversationId });
  };

  // If locked, render calm full-screen glass card
  if (!accessStatus.isAccessible) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Header title="Stories" />
        <LockedTabScreen
          tabName="Stories"
          reason="story_limit_reached"
          onNavigateToMessages={() => navigation.navigate('Messages')}
        />
      </SafeAreaView>
    );
  }

  const unseenStoriesCount = stories.filter((s) => !s.isSeen).length;
  const progressRatio = Math.min(1, storyTimeUsage.secondsUsed / STORY_DAILY_LIMIT_SECONDS);
  const timeProgressText = storyTimeService.formatTimeProgress(storyTimeUsage.secondsUsed);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header
        title="Stories"
        rightActions={[
          {
            icon: 'information-circle-outline',
            onPress: () => {},
          },
        ]}
      />

      {/* Story Time Usage Subheader & Slim Progress Bar */}
      <View style={[styles.subHeader, { borderBottomColor: colors.divider }]}>
        <View style={styles.progressRow}>
          <Text style={[typography.captionBold, { color: colors.textPrimary, fontSize: 12 }]}>
            {timeProgressText}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>
            {Math.max(0, Math.floor((STORY_DAILY_LIMIT_SECONDS - storyTimeUsage.secondsUsed) / 60))}m left today
          </Text>
        </View>

        {/* Slim Progress Bar */}
        <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSecondary, borderColor: colors.divider }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.round(progressRatio * 100)}%`,
                backgroundColor: progressRatio > 0.85 ? '#FA7E1E' : colors.accent,
              },
            ]}
          />
        </View>
      </View>


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
          <StoryCardItem story={item} onPress={() => handleOpenStory(index)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="images-outline"
            title="No active stories"
            description="Your close friends have not shared any stories in the past 24 hours."
          />
        }
        ListFooterComponent={
          stories.length > 0 ? (
            <CaughtUpNotice subtitle="You've viewed all available stories. No algorithmic loop." />
          ) : null
        }
      />

      {/* Fullscreen Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          visible={activeStoryIndex !== null}
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onNavigateToChat={handleNavigateToChat}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    borderWidth: 0.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  gridContent: {
    paddingBottom: 24,
  },
});

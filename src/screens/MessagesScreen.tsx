import React, { useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/common/Header';
import { UnfeedWordmark } from '../components/common/UnfeedWordmark';
import { SearchBar } from '../components/common/SearchBar';
import { CaughtUpNotice } from '../components/common/CaughtUpNotice';
import { ChatSkeletonRow } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { NotesBar } from '../components/messages/NotesBar';
import { ConversationItem } from '../components/messages/ConversationItem';
import { ShortNoteModal } from '../components/notes/ShortNoteModal';
import { StoryViewerModal } from '../components/stories/StoryViewerModal';
import { SessionTimerIndicator } from '../components/focus/SessionTimerIndicator';
import { storyTimeService } from '../services/storyTimeService';
import { InstagramWebView } from '../components/webview/InstagramWebView';
import { INSTAGRAM_CONFIG } from '../config/instagramRules';
import { User, ShortNote, Conversation } from '../types';

interface MessagesScreenProps {
  navigation: any;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const { colors, typography, isDark } = useTheme();
  const currentUser = useAppStore((state) => state.currentUser);
  const userNote = useAppStore((state) => state.userNote);
  const contacts = useAppStore((state) => state.contacts);
  const shortNotes = useAppStore((state) => state.shortNotes);
  const conversations = useAppStore((state) => state.conversations);
  const stories = useAppStore((state) => state.stories);
  const storyTimeUsage = useAppStore((state) => state.storyTimeUsage);
  const updateUserNote = useAppStore((state) => state.updateUserNote);
  const toggleMuteChat = useAppStore((state) => state.toggleMuteChat);
  const deleteChat = useAppStore((state) => state.deleteChat);
  const isDemoMode = useAppStore((state) => state.isDemoMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = c.participant.fullName.toLowerCase().includes(query);
    const usernameMatch = c.participant.username.toLowerCase().includes(query);
    const msgMatch = c.lastMessage?.text?.toLowerCase().includes(query);
    return nameMatch || usernameMatch || msgMatch;
  });

  const handleOpenChat = (conversation: Conversation) => {
    navigation.navigate('ChatDetail', { conversationId: conversation.id });
  };

  const handleNewMessage = () => {
    navigation.navigate('NewMessage');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const handleFriendNotePress = (contact: User, note: ShortNote) => {
    Alert.alert(
      contact.fullName,
      `"${note.text}"\n\nShared ${note.createdAt ? 'recently' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Message',
          onPress: async () => {
            const convId = await useAppStore.getState().startConversation(contact);
            navigation.navigate('ChatDetail', { conversationId: convId });
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View>
      {/* Session Timer Pill if active */}
      <View style={styles.sessionTimerWrap}>
        <SessionTimerIndicator />
      </View>

      {/* Notes Bar */}
      <NotesBar
        currentUser={currentUser}
        userNote={userNote}
        contacts={contacts}
        shortNotes={shortNotes}
        onPressYourNote={() => setIsNoteModalVisible(true)}
        onPressFriendNote={handleFriendNotePress}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search messages & contacts"
      />
    </View>
  );

  if (!isDemoMode) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Minimal Glass Top Bar */}
        <View style={[styles.realHeader, { borderBottomColor: colors.divider }]}>
          <UnfeedWordmark fontSize={32} color={colors.textPrimary} />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerIconButton}
            onPress={handleOpenSettings}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Real Instagram Messages WebView */}
        <View style={styles.realWebViewContainer}>
          <InstagramWebView
            initialUrl={INSTAGRAM_CONFIG.DIRECT_INBOX_URL}
            fallbackUrl={INSTAGRAM_CONFIG.DIRECT_INBOX_URL}
            style={styles.realWebView}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <Header
        useWordmark={true}
        onTitlePress={() => {
          Alert.alert('Account', `Signed in as @${currentUser.username}\nDistraction-free companion to Instagram.`);
        }}
        rightActions={[
          {
            icon: 'settings-outline',
            onPress: handleOpenSettings,
          },
          {
            icon: 'create-outline',
            onPress: handleNewMessage,
          },
        ]}
      />

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => {
          const authorStory = stories.find((s) => s.user.id === item.participant.id);
          return (
            <ConversationItem
              conversation={item}
              hasStory={!!authorStory}
              storyIsSeen={authorStory?.isSeen}
              onPress={() => handleOpenChat(item)}
              onMute={() => toggleMuteChat(item.id)}
              onDelete={() => {
                Alert.alert(
                  'Delete Chat',
                  `Are you sure you want to delete conversation with ${item.participant.fullName}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteChat(item.id) },
                  ]
                );
              }}
              onAvatarPress={() => {
                if (authorStory) {
                  const accessStatus = storyTimeService.getStoryAccessStatus(storyTimeUsage.secondsUsed);

                  if (!accessStatus.isAccessible) {
                    Alert.alert(
                      'Story Time Used',
                      "You've used today's 20 minutes of story time. See you tomorrow.",
                      [
                        { text: 'Go to Chat', onPress: () => handleOpenChat(item) },
                        { text: 'OK', style: 'cancel' },
                      ]
                    );
                    return;
                  }

                  const storyIndex = stories.findIndex((s) => s.id === authorStory.id);
                  setActiveStoryIndex(storyIndex >= 0 ? storyIndex : 0);
                } else {
                  handleOpenChat(item);
                }
              }}
            />
          );
        }}
        ListEmptyComponent={
          searchQuery.trim().length > 0 ? (
            <EmptyState
              icon="search-outline"
              title="No chats found"
              description={`No messages matching "${searchQuery}".`}
            />
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              description="Connect with close friends directly without any feed distractions."
              actionLabel="Start a chat"
              onAction={handleNewMessage}
            />
          )
        }
        ListFooterComponent={
          filteredConversations.length > 0 ? (
            <CaughtUpNotice subtitle="You're caught up with all your direct messages." />
          ) : null
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
      />

      {/* 60 Char Short Note Modal */}
      <ShortNoteModal
        visible={isNoteModalVisible}
        currentUser={currentUser}
        initialText={userNote.text}
        onClose={() => setIsNoteModalVisible(false)}
        onSave={(text) => updateUserNote(text)}
      />

      {/* Story Viewer Modal (active when opened during Focus Window) */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          visible={activeStoryIndex !== null}
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
  wordmark: {
    fontSize: 26,
    fontFamily: Platform.select({ ios: 'Snell Roundhand', default: 'sans-serif-condensed' }),
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 8,
  },
  realWebViewContainer: {
    flex: 1,
    paddingBottom: 68, // clearance for floating glass tab bar
  },
  realWebView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  sessionTimerWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
});

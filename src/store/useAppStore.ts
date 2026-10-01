import { create } from 'zustand';
import { AppState as RNAppState } from 'react-native';
import {
  User,
  ShortNote,
  Conversation,
  Message,
  UserStory,
  Collection,
  SavedItem,
  PersonalNote,
  NoteBlock,
  FocusSettings,
  ScreenTimeState,
  ThemeMode,
  DailyFocusWindow,
  StoryCapUsage,
  StoryTimeUsage,
} from '../types';
import {
  CURRENT_USER,
  INITIAL_USER_NOTE,
  MOCK_CONTACTS,
  MOCK_SHORT_NOTES,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES_BY_CHAT,
  MOCK_STORIES,
  MOCK_COLLECTIONS,
  MOCK_SAVED_ITEMS,
  MOCK_PERSONAL_NOTES,
} from '../services/mockData';
import { storageService } from '../services/storageService';
import { focusWindowService } from '../services/focusWindowService';
import { FOCUS_WINDOW_CONFIG } from '../config/focusWindowConfig';
import { storyTimeService } from '../services/storyTimeService';
import { STORY_DAILY_LIMIT_SECONDS, STORY_TIME_CONFIG } from '../config/storyTimeConfig';

const STORAGE_KEYS = {
  USER_NOTE: 'unfeed_user_note',
  CONVERSATIONS: 'unfeed_conversations',
  MESSAGES: 'unfeed_messages',
  STORIES: 'unfeed_stories',
  COLLECTIONS: 'unfeed_collections',
  SAVED_ITEMS: 'unfeed_saved_items',
  NOTES: 'unfeed_notes',
  FOCUS_SETTINGS: 'unfeed_focus_settings',
  SCREEN_TIME: 'unfeed_screen_time',
  FOCUS_WINDOW: 'unfeed_focus_window',
  STORY_CAP_USAGE: 'unfeed_story_cap_usage',
  STORY_TIME_USAGE: 'unfeed_story_time_usage',
};


function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

interface AppState {
  isInitialized: boolean;
  currentUser: User;
  contacts: User[];
  userNote: ShortNote;
  shortNotes: Record<string, ShortNote>;
  conversations: Conversation[];
  messagesByChat: Record<string, Message[]>;
  stories: UserStory[];
  collections: Collection[];
  savedItems: SavedItem[];
  personalNotes: PersonalNote[];
  focusSettings: FocusSettings;
  screenTime: ScreenTimeState;
  isDailyLimitReached: boolean;
  isSessionTimerAlertVisible: boolean;

  // Story Time & Limit
  storyTimeUsage: StoryTimeUsage;
  dailyFocusWindow: DailyFocusWindow | null;
  storyCapUsage: StoryCapUsage;
  isStoryViewerActive: boolean;
  isStoryViewerPaused: boolean;
  storyViewerActiveStartTime: number | null;

  // Actions
  initStore: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  checkAndRefreshFocusWindow: () => Promise<void>;
  toggleDebugWindow: () => Promise<void>;
  resetStoryTime: () => Promise<void>;
  simulateStoryLimitReached: () => Promise<void>;
  startStoryViewingSession: () => void;
  pauseStoryViewingSession: () => void;
  resumeStoryViewingSession: () => void;
  endStoryViewingSession: () => void;
  tickStoryTime: () => void;
  tickFocusWindow: () => void;
  saveStoryTimeUsage: () => Promise<void>;
  saveStoryCapUsage: () => Promise<void>;
  
  // DM & Chat
  sendMessage: (conversationId: string, content: {
    text?: string;
    mediaUrl?: string;
    mediaType?: 'text' | 'image' | 'voice' | 'shared_post';
    voiceDuration?: number;
    replyTo?: { id: string; senderName: string; text: string };
  }) => Promise<Message>;
  markChatRead: (conversationId: string) => Promise<void>;
  toggleMuteChat: (conversationId: string) => Promise<void>;
  deleteChat: (conversationId: string) => Promise<void>;
  reactToMessage: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  updateUserNote: (text: string) => Promise<void>;
  startConversation: (contact: User) => Promise<string>;

  // Stories
  markStorySeen: (storyId: string) => Promise<void>;
  replyToStory: (story: UserStory, text: string) => Promise<string>;

  // Saved Items & Collections
  toggleSaveItem: (item: SavedItem) => Promise<boolean>;
  removeSavedItem: (itemId: string) => Promise<void>;
  createCollection: (name: string) => Promise<Collection>;
  renameCollection: (id: string, newName: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  moveItemToCollection: (itemId: string, collectionId: string) => Promise<void>;

  // Personal Notes
  createNote: (title: string, content: string, blocks?: NoteBlock[], isPinned?: boolean) => Promise<PersonalNote>;
  updateNote: (id: string, updates: Partial<PersonalNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;

  // Screen Time & Wellbeing ("Time in Unfeed")
  setDailyLimit: (minutes: number | null) => Promise<void>;
  snoozeDailyLimit: () => Promise<void>;
  lockUntilTomorrow: () => Promise<void>;
  startSessionTimer: (minutes: number | null) => Promise<void>;
  cancelSessionTimer: () => Promise<void>;
  tickScreenTime: (secondsPassed: number) => void;
  dismissDailyLimit: () => void;
  dismissSessionTimerAlert: () => void;
  toggleNotifications: () => Promise<void>;
  toggleReduceEffects: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  currentUser: CURRENT_USER,
  contacts: MOCK_CONTACTS,
  userNote: INITIAL_USER_NOTE,
  shortNotes: MOCK_SHORT_NOTES,
  conversations: MOCK_CONVERSATIONS,
  messagesByChat: MOCK_MESSAGES_BY_CHAT,
  stories: MOCK_STORIES,
  collections: MOCK_COLLECTIONS,
  savedItems: MOCK_SAVED_ITEMS,
  personalNotes: MOCK_PERSONAL_NOTES,
  focusSettings: {
    dailyLimitMinutes: null,
    sessionTimerMinutes: null,
    sessionStartedAt: null,
    notificationsEnabled: true,
    themeMode: 'system',
    reduceEffects: false,
  },
  screenTime: {
    todayDate: getTodayString(),
    minutesToday: 18,
    secondsAccumulated: 0,
    snoozeCountToday: 0,
    isLockedUntilTomorrow: false,
  },
  isDailyLimitReached: false,
  isSessionTimerAlertVisible: false,

  // Focus Window & Story Time Initial State
  storyTimeUsage: {
    date: getTodayString(),
    secondsUsed: 0,
    lastSavedAt: Date.now(),
  },
  dailyFocusWindow: {
    date: getTodayString(),
    startEpochMs: 0,
    durationMinutes: 1440,
    endEpochMs: 9999999999999,
    notificationScheduled: false,
    isOverrideOpen: true,
  },
  storyCapUsage: {
    date: getTodayString(),
    secondsUsed: 0,
    lastSavedAt: Date.now(),
  },
  isStoryViewerActive: false,
  isStoryViewerPaused: false,
  storyViewerActiveStartTime: null,

  initStore: async () => {
    try {
      const today = getTodayString();
      const nowMs = Date.now();
      const [
        savedUserNote,
        savedConversations,
        savedMessages,
        savedStories,
        savedCollections,
        savedItems,
        savedNotes,
        savedFocus,
        savedScreenTime,
        savedStoryTime,
      ] = await Promise.all([
        storageService.getItem<ShortNote>(STORAGE_KEYS.USER_NOTE, INITIAL_USER_NOTE),
        storageService.getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, MOCK_CONVERSATIONS),
        storageService.getItem<Record<string, Message[]>>(STORAGE_KEYS.MESSAGES, MOCK_MESSAGES_BY_CHAT),
        storageService.getItem<UserStory[]>(STORAGE_KEYS.STORIES, MOCK_STORIES),
        storageService.getItem<Collection[]>(STORAGE_KEYS.COLLECTIONS, MOCK_COLLECTIONS),
        storageService.getItem<SavedItem[]>(STORAGE_KEYS.SAVED_ITEMS, MOCK_SAVED_ITEMS),
        storageService.getItem<PersonalNote[]>(STORAGE_KEYS.NOTES, MOCK_PERSONAL_NOTES),
        storageService.getItem<FocusSettings>(STORAGE_KEYS.FOCUS_SETTINGS, {
          dailyLimitMinutes: null,
          sessionTimerMinutes: null,
          sessionStartedAt: null,
          notificationsEnabled: true,
          themeMode: 'system',
        }),
        storageService.getItem<ScreenTimeState>(STORAGE_KEYS.SCREEN_TIME, {
          todayDate: today,
          minutesToday: 18,
          secondsAccumulated: 0,
          snoozeCountToday: 0,
          isLockedUntilTomorrow: false,
        }),
        storageService.getItem<StoryTimeUsage>(STORAGE_KEYS.STORY_TIME_USAGE, {
          date: today,
          secondsUsed: 0,
          lastSavedAt: nowMs,
        }),
      ]);

      const activeScreenTime: ScreenTimeState =
        savedScreenTime.todayDate === today
          ? {
              todayDate: today,
              minutesToday: savedScreenTime.minutesToday || 0,
              secondsAccumulated: savedScreenTime.secondsAccumulated || 0,
              snoozeCountToday: savedScreenTime.snoozeCountToday || 0,
              isLockedUntilTomorrow: !!savedScreenTime.isLockedUntilTomorrow,
            }
          : {
              todayDate: today,
              minutesToday: 0,
              secondsAccumulated: 0,
              snoozeCountToday: 0,
              isLockedUntilTomorrow: false,
            };

      // Check story time usage & clock-change rollover
      const rollover = storyTimeService.shouldRollover(
        savedStoryTime.date,
        today,
        savedStoryTime.lastSavedAt || nowMs,
        nowMs
      );

      let activeStoryTime: StoryTimeUsage;
      if (rollover.shouldReset) {
        // Genuine forward calendar day
        activeStoryTime = { date: today, secondsUsed: 0, lastSavedAt: nowMs };
      } else {
        // Same day or clock tampering attempt
        activeStoryTime = {
          date: today,
          secondsUsed: Math.min(STORY_DAILY_LIMIT_SECONDS, savedStoryTime.secondsUsed || 0),
          lastSavedAt: nowMs,
        };
      }
      await storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, activeStoryTime);

      // AppState change listener: pause counting when app goes to background
      RNAppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          get().pauseStoryViewingSession();
        }
      });

      set({
        isInitialized: true,
        userNote: savedUserNote,
        conversations: savedConversations,
        messagesByChat: savedMessages,
        stories: savedStories,
        collections: savedCollections,
        savedItems: savedItems,
        personalNotes: savedNotes,
        focusSettings: savedFocus,
        screenTime: activeScreenTime,
        dailyFocusWindow: {
          date: today,
          startEpochMs: 0,
          durationMinutes: 1440,
          endEpochMs: 9999999999999,
          notificationScheduled: false,
          isOverrideOpen: true,
        },
        storyTimeUsage: activeStoryTime,
        storyCapUsage: {
          date: today,
          secondsUsed: activeStoryTime.secondsUsed,
          lastSavedAt: activeStoryTime.lastSavedAt,
        },
      });
    } catch (e) {
      console.warn('[useAppStore] Error initializing store:', e);
      set({ isInitialized: true });
    }
  },


  checkAndRefreshFocusWindow: async () => {
    const today = getTodayString();
    const currentWindow = get().dailyFocusWindow;
    if (!currentWindow || currentWindow.date !== today) {
      if (currentWindow?.notificationId) {
        await focusWindowService.cancelNotification(currentWindow.notificationId);
      }
      const newWin = focusWindowService.generateDailyWindow(today);
      const notifId = await focusWindowService.scheduleWindowNotification(newWin);
      if (notifId) {
        newWin.notificationId = notifId;
        newWin.notificationScheduled = true;
      }
      set({ dailyFocusWindow: newWin });
      await storageService.setItem(STORAGE_KEYS.FOCUS_WINDOW, newWin);
    }
    const currentCap = get().storyCapUsage;
    if (currentCap.date !== today) {
      const resetCap: StoryCapUsage = { date: today, secondsUsed: 0, lastSavedAt: Date.now() };
      set({ storyCapUsage: resetCap });
      await storageService.setItem(STORAGE_KEYS.STORY_CAP_USAGE, resetCap);
    }
  },

  toggleDebugWindow: async () => {
    const current = get().dailyFocusWindow;
    if (!current) return;
    const updated: DailyFocusWindow = {
      ...current,
      isOverrideOpen: !current.isOverrideOpen,
    };
    set({ dailyFocusWindow: updated });
    await storageService.setItem(STORAGE_KEYS.FOCUS_WINDOW, updated);
  },

  resetStoryTime: async () => {
    const today = getTodayString();
    const resetUsage: StoryTimeUsage = {
      date: today,
      secondsUsed: 0,
      lastSavedAt: Date.now(),
    };
    set({
      storyTimeUsage: resetUsage,
      storyCapUsage: { date: today, secondsUsed: 0, lastSavedAt: Date.now() },
    });
    await storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, resetUsage);
  },

  simulateStoryLimitReached: async () => {
    const today = getTodayString();
    const limitUsage: StoryTimeUsage = {
      date: today,
      secondsUsed: STORY_DAILY_LIMIT_SECONDS,
      lastSavedAt: Date.now(),
    };
    set({
      storyTimeUsage: limitUsage,
      storyCapUsage: { date: today, secondsUsed: STORY_DAILY_LIMIT_SECONDS, lastSavedAt: Date.now() },
    });
    await storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, limitUsage);
  },

  startStoryViewingSession: () => {
    set({
      isStoryViewerActive: true,
      isStoryViewerPaused: false,
      storyViewerActiveStartTime: Date.now(),
    });
  },

  pauseStoryViewingSession: () => {
    const { isStoryViewerActive, isStoryViewerPaused, storyViewerActiveStartTime, storyTimeUsage } = get();
    if (!isStoryViewerActive || isStoryViewerPaused || !storyViewerActiveStartTime) return;
    const now = Date.now();
    const elapsedSecs = Math.max(0, Math.floor((now - storyViewerActiveStartTime) / 1000));
    const newUsed = Math.min(STORY_DAILY_LIMIT_SECONDS, storyTimeUsage.secondsUsed + elapsedSecs);
    const updatedUsage: StoryTimeUsage = {
      date: storyTimeUsage.date,
      secondsUsed: newUsed,
      lastSavedAt: now,
    };
    set({
      isStoryViewerPaused: true,
      storyViewerActiveStartTime: null,
      storyTimeUsage: updatedUsage,
      storyCapUsage: { date: updatedUsage.date, secondsUsed: newUsed, lastSavedAt: now },
    });
    storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, updatedUsage);
  },

  resumeStoryViewingSession: () => {
    const { isStoryViewerActive } = get();
    if (!isStoryViewerActive) return;
    set({
      isStoryViewerPaused: false,
      storyViewerActiveStartTime: Date.now(),
    });
  },

  endStoryViewingSession: () => {
    const { isStoryViewerActive, isStoryViewerPaused, storyViewerActiveStartTime, storyTimeUsage } = get();
    if (!isStoryViewerActive) return;
    const now = Date.now();
    let newUsed = storyTimeUsage.secondsUsed;
    if (!isStoryViewerPaused && storyViewerActiveStartTime) {
      const elapsedSecs = Math.max(0, Math.floor((now - storyViewerActiveStartTime) / 1000));
      newUsed = Math.min(STORY_DAILY_LIMIT_SECONDS, storyTimeUsage.secondsUsed + elapsedSecs);
    }
    const updatedUsage: StoryTimeUsage = {
      date: storyTimeUsage.date,
      secondsUsed: newUsed,
      lastSavedAt: now,
    };
    set({
      isStoryViewerActive: false,
      isStoryViewerPaused: false,
      storyViewerActiveStartTime: null,
      storyTimeUsage: updatedUsage,
      storyCapUsage: { date: updatedUsage.date, secondsUsed: newUsed, lastSavedAt: now },
    });
    storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, updatedUsage);
  },

  tickStoryTime: () => {
    const today = getTodayString();
    const { isStoryViewerActive, isStoryViewerPaused, storyViewerActiveStartTime, storyTimeUsage } = get();
    const now = Date.now();

    // Check midnight rollover with clock-tamper protection
    const rollover = storyTimeService.shouldRollover(
      storyTimeUsage.date,
      today,
      storyTimeUsage.lastSavedAt,
      now
    );
    if (rollover.shouldReset) {
      const resetUsage: StoryTimeUsage = { date: today, secondsUsed: 0, lastSavedAt: now };
      set({
        storyTimeUsage: resetUsage,
        storyCapUsage: { date: today, secondsUsed: 0, lastSavedAt: now },
      });
      storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, resetUsage);
      return;
    }

    // Story viewer tick
    if (isStoryViewerActive && !isStoryViewerPaused && storyViewerActiveStartTime) {
      const elapsedSecs = Math.max(0, Math.floor((now - storyViewerActiveStartTime) / 1000));
      if (elapsedSecs >= STORY_TIME_CONFIG.PERSIST_INTERVAL_SECONDS) {
        const newUsed = Math.min(STORY_DAILY_LIMIT_SECONDS, storyTimeUsage.secondsUsed + elapsedSecs);
        const updatedUsage: StoryTimeUsage = {
          date: today,
          secondsUsed: newUsed,
          lastSavedAt: now,
        };
        set({
          storyViewerActiveStartTime: now,
          storyTimeUsage: updatedUsage,
          storyCapUsage: { date: today, secondsUsed: newUsed, lastSavedAt: now },
        });
        storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, updatedUsage);
      }
    }
  },

  tickFocusWindow: () => {
    get().tickStoryTime();
  },

  saveStoryTimeUsage: async () => {
    await storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, get().storyTimeUsage);
  },

  saveStoryCapUsage: async () => {
    await storageService.setItem(STORAGE_KEYS.STORY_TIME_USAGE, get().storyTimeUsage);
  },


  setThemeMode: async (mode: ThemeMode) => {
    const updated = { ...get().focusSettings, themeMode: mode };
    set({ focusSettings: updated });
    await storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updated);
  },

  sendMessage: async (conversationId, content) => {
    const state = get();
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderId: 'current_user',
      text: content.text,
      mediaUrl: content.mediaUrl,
      mediaType: content.mediaType || 'text',
      voiceDuration: content.voiceDuration,
      replyTo: content.replyTo,
      createdAt: 'Just now',
      isSeen: true,
      reactions: {},
    };

    const currentChatMsgs = state.messagesByChat[conversationId] || [];
    const updatedChatMsgs = [...currentChatMsgs, newMsg];
    const updatedMessagesByChat = {
      ...state.messagesByChat,
      [conversationId]: updatedChatMsgs,
    };

    const updatedConversations = state.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: newMsg,
          updatedAt: 'Just now',
        };
      }
      return c;
    });

    set({
      messagesByChat: updatedMessagesByChat,
      conversations: updatedConversations,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.MESSAGES, updatedMessagesByChat),
      storageService.setItem(STORAGE_KEYS.CONVERSATIONS, updatedConversations),
    ]);

    // Optional simulated reply after a brief delay if it was a user message
    const outgoingText = content.text;
    if (outgoingText && !content.replyTo) {
      setTimeout(() => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (conv) {
          const replyText = getSimulatedReply(outgoingText);
          if (replyText) {
            const simulatedMsg: Message = {
              id: `msg_reply_${Date.now()}`,
              conversationId,
              senderId: conv.participant.id,
              text: replyText,
              createdAt: 'Just now',
              isSeen: false,
              reactions: {},
            };
            const currentMsgs = get().messagesByChat[conversationId] || [];
            const newChatMsgs = [...currentMsgs, simulatedMsg];
            const newMsgsMap = { ...get().messagesByChat, [conversationId]: newChatMsgs };
            const newConvs = get().conversations.map((c) =>
              c.id === conversationId
                ? { ...c, lastMessage: simulatedMsg, unreadCount: c.unreadCount + 1, updatedAt: 'Just now' }
                : c
            );
            set({ messagesByChat: newMsgsMap, conversations: newConvs });
            storageService.setItem(STORAGE_KEYS.MESSAGES, newMsgsMap);
            storageService.setItem(STORAGE_KEYS.CONVERSATIONS, newConvs);
          }
        }
      }, 3500);
    }

    return newMsg;
  },

  markChatRead: async (conversationId) => {
    const updatedConversations = get().conversations.map((c) => {
      if (c.id === conversationId && c.unreadCount > 0) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    set({ conversations: updatedConversations });
    await storageService.setItem(STORAGE_KEYS.CONVERSATIONS, updatedConversations);
  },

  toggleMuteChat: async (conversationId) => {
    const updatedConversations = get().conversations.map((c) => {
      if (c.id === conversationId) {
        return { ...c, isMuted: !c.isMuted };
      }
      return c;
    });
    set({ conversations: updatedConversations });
    await storageService.setItem(STORAGE_KEYS.CONVERSATIONS, updatedConversations);
  },

  deleteChat: async (conversationId) => {
    const updatedConversations = get().conversations.filter((c) => c.id !== conversationId);
    const updatedMessagesByChat = { ...get().messagesByChat };
    delete updatedMessagesByChat[conversationId];

    set({
      conversations: updatedConversations,
      messagesByChat: updatedMessagesByChat,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.CONVERSATIONS, updatedConversations),
      storageService.setItem(STORAGE_KEYS.MESSAGES, updatedMessagesByChat),
    ]);
  },

  reactToMessage: async (conversationId, messageId, emoji) => {
    const chatMsgs = get().messagesByChat[conversationId] || [];
    const updatedMsgs = chatMsgs.map((m) => {
      if (m.id === messageId) {
        const reactions = { ...(m.reactions || {}) };
        const users = reactions[emoji] || [];
        const hasReacted = users.includes('current_user');

        if (hasReacted) {
          // Remove reaction
          const filtered = users.filter((u) => u !== 'current_user');
          if (filtered.length > 0) {
            reactions[emoji] = filtered;
          } else {
            delete reactions[emoji];
          }
        } else {
          // Add reaction
          reactions[emoji] = [...users, 'current_user'];
        }
        return { ...m, reactions };
      }
      return m;
    });

    const updatedMap = { ...get().messagesByChat, [conversationId]: updatedMsgs };
    set({ messagesByChat: updatedMap });
    await storageService.setItem(STORAGE_KEYS.MESSAGES, updatedMap);
  },

  updateUserNote: async (text) => {
    const updatedNote: ShortNote = {
      id: `sn_me_${Date.now()}`,
      userId: 'current_user',
      text: text.slice(0, 60),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    };
    set({ userNote: updatedNote });
    await storageService.setItem(STORAGE_KEYS.USER_NOTE, updatedNote);
  },

  startConversation: async (contact) => {
    const existing = get().conversations.find((c) => c.participant.id === contact.id);
    if (existing) {
      return existing.id;
    }
    const newChatId = `chat_${Date.now()}`;
    const newConv: Conversation = {
      id: newChatId,
      participant: contact,
      unreadCount: 0,
      isMuted: false,
      updatedAt: 'Just now',
    };
    const updatedConvs = [newConv, ...get().conversations];
    set({
      conversations: updatedConvs,
      messagesByChat: { ...get().messagesByChat, [newChatId]: [] },
    });
    await storageService.setItem(STORAGE_KEYS.CONVERSATIONS, updatedConvs);
    return newChatId;
  },

  markStorySeen: async (storyId) => {
    const updated = get().stories.map((s) => {
      if (s.id === storyId) {
        return { ...s, isSeen: true };
      }
      return s;
    });
    set({ stories: updated });
    await storageService.setItem(STORAGE_KEYS.STORIES, updated);
  },

  replyToStory: async (story, text) => {
    // Find or create conversation with this story author
    let convId = get().conversations.find((c) => c.participant.id === story.user.id)?.id;
    if (!convId) {
      convId = await get().startConversation(story.user);
    }
    // Send story reply message
    await get().sendMessage(convId, {
      text: `Replied to story: "${text}"`,
    });
    return convId;
  },

  toggleSaveItem: async (item) => {
    const exists = get().savedItems.some((s) => s.id === item.id);
    let updated: SavedItem[];
    if (exists) {
      updated = get().savedItems.filter((s) => s.id !== item.id);
    } else {
      updated = [item, ...get().savedItems];
    }
    set({ savedItems: updated });
    await storageService.setItem(STORAGE_KEYS.SAVED_ITEMS, updated);
    return !exists;
  },

  removeSavedItem: async (itemId) => {
    const updated = get().savedItems.filter((s) => s.id !== itemId);
    set({ savedItems: updated });
    await storageService.setItem(STORAGE_KEYS.SAVED_ITEMS, updated);
  },

  createCollection: async (name) => {
    const newCol: Collection = {
      id: `col_${Date.now()}`,
      name: name.trim(),
      itemCount: 0,
      createdAt: getTodayString(),
    };
    const updated = [...get().collections, newCol];
    set({ collections: updated });
    await storageService.setItem(STORAGE_KEYS.COLLECTIONS, updated);
    return newCol;
  },

  renameCollection: async (id, newName) => {
    const updated = get().collections.map((c) => (c.id === id ? { ...c, name: newName.trim() } : c));
    set({ collections: updated });
    await storageService.setItem(STORAGE_KEYS.COLLECTIONS, updated);
  },

  deleteCollection: async (id) => {
    const updated = get().collections.filter((c) => c.id !== id);
    // Remove collection ID from saved items
    const updatedItems = get().savedItems.map((item) => ({
      ...item,
      collectionIds: item.collectionIds.filter((cid) => cid !== id),
    }));
    set({ collections: updated, savedItems: updatedItems });
    await Promise.all([
      storageService.setItem(STORAGE_KEYS.COLLECTIONS, updated),
      storageService.setItem(STORAGE_KEYS.SAVED_ITEMS, updatedItems),
    ]);
  },

  moveItemToCollection: async (itemId, collectionId) => {
    const updated = get().savedItems.map((item) => {
      if (item.id === itemId) {
        const has = item.collectionIds.includes(collectionId);
        const newIds = has ? item.collectionIds : [...item.collectionIds, collectionId];
        return { ...item, collectionIds: newIds };
      }
      return item;
    });
    set({ savedItems: updated });
    await storageService.setItem(STORAGE_KEYS.SAVED_ITEMS, updated);
  },

  createNote: async (title, content, blocksOrPinned, isPinned = false) => {
    let blocks: NoteBlock[] | undefined;
    let pinned = false;
    if (typeof blocksOrPinned === 'boolean') {
      pinned = blocksOrPinned;
    } else {
      blocks = blocksOrPinned;
      pinned = !!isPinned;
    }
    const newNote: PersonalNote = {
      id: `note_${Date.now()}`,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      blocks: blocks || [
        { id: `b_${Date.now()}`, type: 'paragraph', text: content.trim() },
      ],
      isPinned: pinned,
      createdAt: getTodayString(),
      updatedAt: 'Just now',
    };
    const updated = [newNote, ...get().personalNotes];
    set({ personalNotes: updated });
    await storageService.setItem(STORAGE_KEYS.NOTES, updated);
    return newNote;
  },

  updateNote: async (id, updates) => {
    const updated = get().personalNotes.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: 'Just now' } : n
    );
    set({ personalNotes: updated });
    await storageService.setItem(STORAGE_KEYS.NOTES, updated);
  },

  deleteNote: async (id) => {
    const updated = get().personalNotes.filter((n) => n.id !== id);
    set({ personalNotes: updated });
    await storageService.setItem(STORAGE_KEYS.NOTES, updated);
  },

  togglePinNote: async (id) => {
    const updated = get().personalNotes.map((n) =>
      n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: 'Just now' } : n
    );
    set({ personalNotes: updated });
    await storageService.setItem(STORAGE_KEYS.NOTES, updated);
  },

  setDailyLimit: async (minutes) => {
    const updated = { ...get().focusSettings, dailyLimitMinutes: minutes };
    set({ focusSettings: updated });
    await storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updated);
  },

  snoozeDailyLimit: async () => {
    const current = get().screenTime;
    if (current.snoozeCountToday >= 2) return;

    const updatedScreenTime: ScreenTimeState = {
      ...current,
      snoozeCountToday: current.snoozeCountToday + 1,
    };

    // Add 5 minutes to today's active limit
    const currentLimit = get().focusSettings.dailyLimitMinutes ?? current.minutesToday;
    const updatedSettings = {
      ...get().focusSettings,
      dailyLimitMinutes: Math.max(currentLimit, current.minutesToday) + 5,
    };

    set({
      screenTime: updatedScreenTime,
      focusSettings: updatedSettings,
      isDailyLimitReached: false,
    });

    await Promise.all([
      storageService.setItem(STORAGE_KEYS.SCREEN_TIME, updatedScreenTime),
      storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updatedSettings),
    ]);
  },

  lockUntilTomorrow: async () => {
    const updatedScreenTime: ScreenTimeState = {
      ...get().screenTime,
      isLockedUntilTomorrow: true,
    };
    set({
      screenTime: updatedScreenTime,
      isDailyLimitReached: true,
    });
    await storageService.setItem(STORAGE_KEYS.SCREEN_TIME, updatedScreenTime);
  },

  startSessionTimer: async (minutes) => {
    const updated = {
      ...get().focusSettings,
      sessionTimerMinutes: minutes,
      sessionStartedAt: Date.now(),
    };
    set({ focusSettings: updated, isSessionTimerAlertVisible: false });
    await storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updated);
  },

  cancelSessionTimer: async () => {
    const updated = {
      ...get().focusSettings,
      sessionTimerMinutes: null,
      sessionStartedAt: null,
    };
    set({ focusSettings: updated });
    await storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updated);
  },

  tickScreenTime: (secondsPassed: number) => {
    const today = getTodayString();
    const current = get().screenTime;
    let newAccum = current.secondsAccumulated + secondsPassed;
    let newMinutes = current.minutesToday;
    let snoozeCount = current.snoozeCountToday;
    let lockedTomorrow = current.isLockedUntilTomorrow;

    if (current.todayDate !== today) {
      newMinutes = 0;
      newAccum = secondsPassed;
      snoozeCount = 0;
      lockedTomorrow = false;
    }

    if (newAccum >= 60) {
      newMinutes += Math.floor(newAccum / 60);
      newAccum = newAccum % 60;
    }

    const updatedScreenTime: ScreenTimeState = {
      todayDate: today,
      minutesToday: newMinutes,
      secondsAccumulated: newAccum,
      snoozeCountToday: snoozeCount,
      isLockedUntilTomorrow: lockedTomorrow,
    };

    const limit = get().focusSettings.dailyLimitMinutes;
    const reachedLimit = lockedTomorrow || (limit !== null && newMinutes >= limit);

    // Check session timer
    const sessionMins = get().focusSettings.sessionTimerMinutes;
    const sessionStart = get().focusSettings.sessionStartedAt;
    let triggerSessionAlert = false;
    if (sessionMins && sessionStart) {
      const elapsedMinutes = (Date.now() - sessionStart) / 60000;
      if (elapsedMinutes >= sessionMins) {
        triggerSessionAlert = true;
      }
    }

    set({
      screenTime: updatedScreenTime,
      isDailyLimitReached: reachedLimit && !get().isDailyLimitReached ? true : get().isDailyLimitReached,
      isSessionTimerAlertVisible: triggerSessionAlert && !get().isSessionTimerAlertVisible ? true : get().isSessionTimerAlertVisible,
    });
  },

  dismissDailyLimit: () => {
    set({ isDailyLimitReached: false });
  },

  dismissSessionTimerAlert: () => {
    set({ isSessionTimerAlertVisible: false });
    get().cancelSessionTimer();
  },

  toggleNotifications: async () => {
    const updated = {
      ...get().focusSettings,
      notificationsEnabled: !get().focusSettings.notificationsEnabled,
    };
    set({ focusSettings: updated });
    await storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updated);
  },

  toggleReduceEffects: async () => {
    const updated = {
      ...get().focusSettings,
      reduceEffects: !get().focusSettings.reduceEffects,
    };
    set({ focusSettings: updated });
    await storageService.setItem(STORAGE_KEYS.FOCUS_SETTINGS, updated);
  },
}));

function getSimulatedReply(incoming: string): string | null {
  const lower = incoming.toLowerCase();
  if (lower.includes('hello') || lower.includes('hey')) {
    return 'Hey! Great to hear from you. Hope you are having a productive day!';
  }
  if (lower.includes('coffee') || lower.includes('cafe')) {
    return 'Definitely up for a coffee break later. Let me know the spot!';
  }
  if (lower.includes('design') || lower.includes('app')) {
    return 'Love this direction. The typography and dark mode feel super clean.';
  }
  if (lower.includes('?') || lower.includes('how')) {
    return 'Things are going well over here! Focusing on building intentional tools.';
  }
  return 'Sounds awesome! Keep me posted.';
}

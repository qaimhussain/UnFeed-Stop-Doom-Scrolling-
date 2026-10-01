export type ThemeMode = 'system' | 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen?: string;
  isVerified?: boolean;
}

export interface ShortNote {
  id: string;
  userId: string;
  text: string; // Max 60 chars
  createdAt: string;
  expiresAt: string;
}

export interface SharedPostPreview {
  id: string;
  authorUsername: string;
  authorAvatar: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
  isSaved?: boolean;
}

export interface MessageReaction {
  emoji: string;
  users: string[]; // user IDs
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // 'current_user' or participant id
  text?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'voice' | 'shared_post';
  voiceDuration?: number; // in seconds
  sharedPost?: SharedPostPreview;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  createdAt: string;
  isSeen: boolean;
  isDelivered?: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  isMuted: boolean;
  isTyping?: boolean;
  updatedAt: string;
}

export interface StorySlide {
  id: string;
  mediaUrl: string;
  timestamp: string;
  duration: number; // default e.g. 5 seconds
  caption?: string;
}

export interface UserStory {
  id: string;
  user: User;
  slides: StorySlide[];
  isSeen: boolean;
  lastUpdated: string;
}

export interface Collection {
  id: string;
  name: string;
  coverImageUrl?: string;
  itemCount: number;
  createdAt: string;
}

export interface SavedItem {
  id: string;
  mediaUrl: string;
  caption: string;
  authorUsername: string;
  authorAvatar: string;
  collectionIds: string[];
  createdAt: string;
}

export type NoteBlockType = 'paragraph' | 'bullet' | 'checklist';

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  text: string;
  checked?: boolean; // For checklist items
}

export interface PersonalNote {
  id: string;
  title: string;
  content: string; // Plain text preview / fallback
  blocks?: NoteBlock[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSettings {
  dailyLimitMinutes: number | null; // e.g. 15, 30, 45, 60 or null (unlimited)
  sessionTimerMinutes: number | null; // active session limit e.g. 10 minutes
  sessionStartedAt: number | null; // timestamp ms
  notificationsEnabled: boolean;
  themeMode: ThemeMode;
  reduceEffects?: boolean; // Replaces glass surfaces with solid surfaces
}

export interface ScreenTimeState {
  todayDate: string; // YYYY-MM-DD
  minutesToday: number;
  secondsAccumulated: number;
  snoozeCountToday: number; // User can only use "5 more minutes" twice per day
  isLockedUntilTomorrow: boolean; // Set if user selects "Lock until tomorrow"
}

export type WindowStatus = 'upcoming' | 'active' | 'passed';

export type TabAccessStatus =
  | { isAccessible: true }
  | { isAccessible: false; reason: 'story_limit_reached' | 'window_upcoming' | 'window_passed' | 'story_cap_reached' };

export interface StoryTimeUsage {
  date: string; // YYYY-MM-DD
  secondsUsed: number; // up to STORY_DAILY_LIMIT_SECONDS (1200)
  lastSavedAt: number; // timestamp ms for clock-change protection
}

export interface DailyFocusWindow {
  date: string; // YYYY-MM-DD
  startEpochMs: number;
  durationMinutes: number;
  endEpochMs: number;
  notificationScheduled: boolean;
  notificationId?: string;
  isOverrideOpen?: boolean; // For dev debug toggle
}

export interface StoryCapUsage {
  date: string; // YYYY-MM-DD
  secondsUsed: number;
  lastSavedAt: number;
}


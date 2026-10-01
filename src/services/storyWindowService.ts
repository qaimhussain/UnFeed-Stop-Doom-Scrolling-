declare const require: any;

let PlatformOS = 'web';
try {
  const RN = require('react-native');
  if (RN && RN.Platform) {
    PlatformOS = RN.Platform.OS;
  }
} catch {
  PlatformOS = 'web';
}

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

import { DailyFocusWindow, StoryCapUsage, WindowStatus, TabAccessStatus } from '../types';
import { STORY_WINDOW_CONFIG, STORY_DAILY_CAP_SECONDS } from '../config/storyWindowConfig';

export class StoryWindowService {
  /**
   * Helper to format a Date as YYYY-MM-DD in local time
   */
  getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generates a daily random story window between 12:00 and 22:00 local time
   * with a duration between 15 and 20 minutes.
   */
  generateDailyWindow(
    dateStr: string,
    randomSeed?: { startHourFraction?: number; durationMinutes?: number }
  ): DailyFocusWindow {
    const [year, month, day] = dateStr.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);

    // Random start hour between 12:00 (12.0) and 22:00 (22.0)
    const fraction = randomSeed?.startHourFraction ?? Math.random();
    const minStartMinutes = STORY_WINDOW_CONFIG.WINDOW_START_HOUR_MIN * 60; // 720 (12:00)
    const maxStartMinutes = (STORY_WINDOW_CONFIG.WINDOW_START_HOUR_MAX - 1) * 60 + 40; // 21:40 so it fits before 22:00
    const startMinuteOfDay = Math.floor(
      minStartMinutes + fraction * (maxStartMinutes - minStartMinutes)
    );

    const startHour = Math.floor(startMinuteOfDay / 60);
    const startMin = startMinuteOfDay % 60;

    const startDate = new Date(baseDate);
    startDate.setHours(startHour, startMin, 0, 0);

    // Random duration between 15 and 20 minutes
    const durationMin =
      randomSeed?.durationMinutes ??
      Math.floor(
        STORY_WINDOW_CONFIG.WINDOW_DURATION_MIN_MINUTES +
          Math.random() *
            (STORY_WINDOW_CONFIG.WINDOW_DURATION_MAX_MINUTES -
              STORY_WINDOW_CONFIG.WINDOW_DURATION_MIN_MINUTES +
              1)
      );

    const startEpochMs = startDate.getTime();
    const endEpochMs = startEpochMs + durationMin * 60 * 1000;

    return {
      date: dateStr,
      startEpochMs,
      durationMinutes: durationMin,
      endEpochMs,
      notificationScheduled: false,
      isOverrideOpen: false,
    };
  }

  /**
   * Evaluates the current window status: 'upcoming' | 'active' | 'passed'
   */
  getWindowStatus(window: DailyFocusWindow, now: number = Date.now()): WindowStatus {
    if (window.isOverrideOpen) {
      return 'active';
    }
    if (now < window.startEpochMs) {
      return 'upcoming';
    }
    if (now >= window.startEpochMs && now < window.endEpochMs) {
      return 'active';
    }
    return 'passed';
  }

  /**
   * Returns remaining seconds for active window, or 0 if inactive
   */
  getRemainingWindowSeconds(window: DailyFocusWindow, now: number = Date.now()): number {
    if (window.isOverrideOpen) {
      return window.durationMinutes * 60;
    }
    if (now < window.startEpochMs) {
      return 0;
    }
    if (now >= window.endEpochMs) {
      return 0;
    }
    return Math.max(0, Math.floor((window.endEpochMs - now) / 1000));
  }

  /**
   * Rules Priority for Stories Tab:
   * 1. Check story cap: if used >= STORY_DAILY_CAP_SECONDS (900s), LOCKED with 'story_cap_reached'
   * 2. Check window status:
   *    - upcoming => LOCKED with 'window_upcoming'
   *    - passed => LOCKED with 'window_passed'
   *    - active => ACCESSIBLE
   */
  getStoryAccessStatus(
    window: DailyFocusWindow,
    storySecondsUsed: number,
    now: number = Date.now()
  ): TabAccessStatus {
    if (storySecondsUsed >= STORY_DAILY_CAP_SECONDS) {
      return { isAccessible: false, reason: 'story_cap_reached' };
    }

    const windowStatus = this.getWindowStatus(window, now);
    if (windowStatus === 'upcoming') {
      return { isAccessible: false, reason: 'window_upcoming' };
    }
    if (windowStatus === 'passed') {
      return { isAccessible: false, reason: 'window_passed' };
    }
    return { isAccessible: true };
  }

  /**
   * Rules Priority for Saved Tab:
   * ALWAYS AVAILABLE, NEVER LOCKED. Works at any time with no timers.
   */
  getSavedAccessStatus(): TabAccessStatus {
    return { isAccessible: true };
  }

  /**
   * Check if date rollover occurred (e.g. crossing midnight)
   */
  shouldRollover(currentSavedDate: string, todayDateStr: string): boolean {
    return currentSavedDate !== todayDateStr;
  }

  /**
   * Notifications setup: requests permissions and registers Android notification channels
   */
  async configureNotifications(): Promise<boolean> {
    if (PlatformOS === 'web' || !Notifications) {
      return false;
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (PlatformOS === 'android') {
        await Notifications.setNotificationChannelAsync(
          STORY_WINDOW_CONFIG.NOTIFICATION_CHANNEL_ID,
          {
            name: STORY_WINDOW_CONFIG.NOTIFICATION_CHANNEL_NAME,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0095F6',
            enableVibrate: true,
            sound: 'default',
          }
        );
      }

      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        const requested = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: false, allowSound: true },
          android: {},
        });
        return requested.granted;
      }
      return settings.granted;
    } catch (err) {
      console.warn('[StoryWindowService] Failed to configure notifications:', err);
      return false;
    }
  }

  /**
   * Schedules a local notification at window.startEpochMs with exact alarm scheduling
   * Notification text: "Your story window is open for X minutes."
   */
  async scheduleWindowNotification(window: DailyFocusWindow): Promise<string | null> {
    if (PlatformOS === 'web' || !Notifications) {
      return null;
    }

    const now = Date.now();
    if (window.startEpochMs <= now) {
      return null;
    }

    try {
      const isConfigured = await this.configureNotifications();
      if (!isConfigured) return null;

      const triggerSeconds = Math.max(1, Math.floor((window.startEpochMs - now) / 1000));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Story Window',
          body: `Your story window is open for ${window.durationMinutes} minutes.`,
          sound: 'default',
          data: { type: 'story_window_open', date: window.date },
        },
        trigger: {
          seconds: triggerSeconds,
          channelId: STORY_WINDOW_CONFIG.NOTIFICATION_CHANNEL_ID,
        },
      });

      return notificationId;
    } catch (err) {
      console.warn('[StoryWindowService] Failed to schedule window notification:', err);
      return null;
    }
  }

  /**
   * Cancels a scheduled window notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    if (PlatformOS === 'web' || !Notifications || !notificationId) {
      return;
    }
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn('[StoryWindowService] Failed to cancel notification:', err);
    }
  }
}

export const storyWindowService = new StoryWindowService();

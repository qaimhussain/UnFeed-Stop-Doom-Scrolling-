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
import { FOCUS_WINDOW_CONFIG } from '../config/focusWindowConfig';

export class FocusWindowService {
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
   * Generates a deterministic or randomized daily window between 12:00 and 22:00 local time
   * with duration between 15 and 20 minutes.
   */
  generateDailyWindow(
    dateStr: string,
    randomSeed?: { startHourFraction?: number; durationMinutes?: number }
  ): DailyFocusWindow {
    const [year, month, day] = dateStr.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);

    // Random start hour between 12:00 (12.0) and 22:00 (22.0)
    // 10-hour span = 600 minutes
    const fraction = randomSeed?.startHourFraction ?? Math.random();
    const minStartMinutes = FOCUS_WINDOW_CONFIG.WINDOW_START_HOUR_MIN * 60; // 720 (12:00)
    const maxStartMinutes = (FOCUS_WINDOW_CONFIG.WINDOW_START_HOUR_MAX - 1) * 60 + 40; // 21:40 so it fits before 22:00
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
        FOCUS_WINDOW_CONFIG.WINDOW_DURATION_MIN_MINUTES +
          Math.random() *
            (FOCUS_WINDOW_CONFIG.WINDOW_DURATION_MAX_MINUTES -
              FOCUS_WINDOW_CONFIG.WINDOW_DURATION_MIN_MINUTES +
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
   * 1. Check story cap: if used >= 900s, LOCKED with 'story_cap_reached'
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
    if (storySecondsUsed >= FOCUS_WINDOW_CONFIG.STORY_DAILY_CAP_SECONDS) {
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
      // Notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Android Channel setup
      if (PlatformOS === 'android') {
        await Notifications.setNotificationChannelAsync(
          FOCUS_WINDOW_CONFIG.NOTIFICATION_CHANNEL_ID,
          {
            name: FOCUS_WINDOW_CONFIG.NOTIFICATION_CHANNEL_NAME,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0095F6',
            enableVibrate: true,
            sound: 'default',
          }
        );
      }

      // Permissions check
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[FocusWindowService] configureNotifications error:', e);
      return false;
    }
  }

  /**
   * Schedule the notification at window.startEpochMs
   */
  async scheduleWindowNotification(window: DailyFocusWindow): Promise<string | undefined> {
    if (PlatformOS === 'web' || !Notifications) {
      return undefined;
    }

    try {
      const now = Date.now();
      if (window.startEpochMs <= now) {
        // Window is already past or running today
        return undefined;
      }

      const triggerDate = new Date(window.startEpochMs);

      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Story Window',
          body: `Your story window is open for ${window.durationMinutes} minutes.`,
          sound: 'default',
          color: '#0095F6',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: FOCUS_WINDOW_CONFIG.NOTIFICATION_CHANNEL_ID,
        },
      });

      return notifId;
    } catch (e) {
      console.warn('[FocusWindowService] scheduleWindowNotification error:', e);
      return undefined;
    }
  }

  /**
   * Cancels existing scheduled notifications
   */
  async cancelNotification(notificationId?: string): Promise<void> {
    if (PlatformOS === 'web' || !Notifications || !notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn('[FocusWindowService] cancelNotification error:', e);
    }
  }
}

export const focusWindowService = new FocusWindowService();

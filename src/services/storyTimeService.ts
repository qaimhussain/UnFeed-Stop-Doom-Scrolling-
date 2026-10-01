import { StoryTimeUsage, TabAccessStatus } from '../types';
import { STORY_DAILY_LIMIT_SECONDS, STORY_TIME_CONFIG } from '../config/storyTimeConfig';

export class StoryTimeService {
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
   * Check if daily story viewing limit is reached (1200 seconds / 20 minutes)
   */
  isLimitReached(secondsUsed: number): boolean {
    return secondsUsed >= STORY_DAILY_LIMIT_SECONDS;
  }

  /**
   * Returns remaining seconds for today's story time
   */
  getRemainingSeconds(secondsUsed: number): number {
    return Math.max(0, STORY_DAILY_LIMIT_SECONDS - secondsUsed);
  }

  /**
   * Evaluates access status for Stories tab:
   * Accessible if secondsUsed < STORY_DAILY_LIMIT_SECONDS.
   * If limit reached, locked with reason 'story_limit_reached'.
   */
  getStoryAccessStatus(secondsUsed: number): TabAccessStatus {
    if (this.isLimitReached(secondsUsed)) {
      return { isAccessible: false, reason: 'story_limit_reached' };
    }
    return { isAccessible: true };
  }

  /**
   * Evaluates access status for Saved tab:
   * ALWAYS AVAILABLE, NEVER LOCKED.
   */
  getSavedAccessStatus(): TabAccessStatus {
    return { isAccessible: true };
  }

  /**
   * Clock-change protection and daily rollover logic:
   * - Resets to 0 only on a genuine forward move to a new calendar day.
   * - If device time jumped backward or date changed unexpectedly backward, DO NOT give new time.
   */
  shouldRollover(
    lastSavedDate: string,
    currentDateStr: string,
    lastSavedTimestamp: number,
    currentTimestamp: number = Date.now()
  ): { shouldReset: boolean; reason: 'same_day' | 'genuine_new_day' | 'clock_tamper_backward' } {
    // 1. Clock jumped backward by more than 60 seconds (drift tolerance)
    if (currentTimestamp < lastSavedTimestamp - 60000) {
      return { shouldReset: false, reason: 'clock_tamper_backward' };
    }

    // 2. Date string moved backward (e.g. user set system calendar back)
    if (currentDateStr < lastSavedDate) {
      return { shouldReset: false, reason: 'clock_tamper_backward' };
    }

    // 3. Genuine forward calendar day move
    if (currentDateStr > lastSavedDate) {
      return { shouldReset: true, reason: 'genuine_new_day' };
    }

    // 4. Same calendar day
    return { shouldReset: false, reason: 'same_day' };
  }

  /**
   * Formats remaining time for story viewer pill, e.g. "14:32"
   */
  formatTimeRemaining(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Formats time used string for Stories tab, e.g. "6 of 20 min used"
   */
  formatTimeProgress(secondsUsed: number): string {
    const minsUsed = Math.min(20, Math.floor(secondsUsed / 60));
    const totalMins = Math.floor(STORY_DAILY_LIMIT_SECONDS / 60);
    return `${minsUsed} of ${totalMins} min used`;
  }
}

export const storyTimeService = new StoryTimeService();

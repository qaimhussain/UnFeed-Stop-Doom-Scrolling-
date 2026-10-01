/**
 * Daily Story Time Configuration for Unfeed
 * 
 * Fixed 20 minutes of story viewing per day, usable at any time of day.
 * No random windows, no notifications.
 */
export const STORY_DAILY_LIMIT_SECONDS = 1200; // 20 minutes (1200 seconds)

export const STORY_TIME_CONFIG = {
  // Daily limit in seconds
  STORY_DAILY_LIMIT_SECONDS,

  // Warning threshold inside story viewer (2 minutes = 120 seconds)
  WARNING_THRESHOLD_SECONDS: 120,

  // Interval in seconds to persist time to storage while watching
  PERSIST_INTERVAL_SECONDS: 3,
} as const;

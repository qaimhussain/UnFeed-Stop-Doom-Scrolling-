export const STORY_DAILY_CAP_SECONDS = 900;

export const STORY_WINDOW_CONFIG = {
  // Window start time range in local hours: 12:00 to 22:00
  WINDOW_START_HOUR_MIN: 12,
  WINDOW_START_HOUR_MAX: 22,

  // Duration in minutes: between 15 and 20 minutes
  WINDOW_DURATION_MIN_MINUTES: 15,
  WINDOW_DURATION_MAX_MINUTES: 20,

  // Story daily cap: maximum 15 minutes = 900 seconds
  STORY_DAILY_CAP_SECONDS,

  // Notification channel
  NOTIFICATION_CHANNEL_ID: 'unfeed_story_window',
  NOTIFICATION_CHANNEL_NAME: 'Story Window',

  // Warning thresholds in seconds
  WINDOW_WARNING_THRESHOLD_SECONDS: 60,
  STORY_WARNING_THRESHOLD_SECONDS: 60,
} as const;

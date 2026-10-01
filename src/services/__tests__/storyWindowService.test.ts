import { storyWindowService } from '../storyWindowService';
import { STORY_WINDOW_CONFIG, STORY_DAILY_CAP_SECONDS } from '../../config/storyWindowConfig';
import { DailyFocusWindow } from '../../types';

export function runStoryWindowTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${testName}`);
    } else {
      failed++;
      errors.push(testName);
      console.error(`  ✗ FAIL: ${testName}`);
    }
  }

  console.log('\n--- Running StoryWindowService Unit Tests ---');

  // Test 1: Window Generation (start time between 12:00 and 22:00, duration 15-20m)
  {
    const dateStr = '2026-10-01';
    const window = storyWindowService.generateDailyWindow(dateStr, {
      startHourFraction: 0.5,
      durationMinutes: 17,
    });

    assert(window.date === dateStr, 'Window date matches generated date');
    assert(window.durationMinutes === 17, 'Window duration matches specified duration');
    assert(window.endEpochMs - window.startEpochMs === 17 * 60 * 1000, 'End epoch correctly computed');

    const startDate = new Date(window.startEpochMs);
    const startHour = startDate.getHours();
    assert(
      startHour >= STORY_WINDOW_CONFIG.WINDOW_START_HOUR_MIN &&
        startHour <= STORY_WINDOW_CONFIG.WINDOW_START_HOUR_MAX,
      'Start hour is within 12:00 to 22:00 range'
    );
  }

  // Test 2: Randomized Window Generation Bounds over 100 iterations
  {
    let allValid = true;
    for (let i = 0; i < 100; i++) {
      const win = storyWindowService.generateDailyWindow('2026-10-01');
      const s = new Date(win.startEpochMs);
      const h = s.getHours();
      if (h < 12 || h > 22) allValid = false;
      if (win.durationMinutes < 15 || win.durationMinutes > 20) allValid = false;
      if (win.endEpochMs <= win.startEpochMs) allValid = false;
    }
    assert(allValid, '100 randomized windows all fall strictly within 12:00-22:00 and 15-20 min duration');
  }

  // Test 3: Daily Rollover Detection
  {
    assert(storyWindowService.shouldRollover('2026-10-01', '2026-10-02'), 'Rollover triggers across midnight / new date');
    assert(!storyWindowService.shouldRollover('2026-10-01', '2026-10-01'), 'Rollover does not trigger on identical date');
  }

  // Test 4: Window Status Transitions
  {
    const start = 1000000;
    const durationMin = 16;
    const end = start + durationMin * 60 * 1000;
    const mockWindow: DailyFocusWindow = {
      date: '2026-10-01',
      startEpochMs: start,
      durationMinutes: durationMin,
      endEpochMs: end,
      notificationScheduled: false,
    };

    assert(storyWindowService.getWindowStatus(mockWindow, start - 1000) === 'upcoming', 'Before start time is upcoming');
    assert(storyWindowService.getWindowStatus(mockWindow, start) === 'active', 'At start time is active');
    assert(storyWindowService.getWindowStatus(mockWindow, start + 30000) === 'active', 'Inside window is active');
    assert(storyWindowService.getWindowStatus(mockWindow, end) === 'passed', 'At end time is passed');
    assert(storyWindowService.getWindowStatus(mockWindow, end + 1000) === 'passed', 'After end time is passed');

    // Debug override
    const overrideWindow: DailyFocusWindow = { ...mockWindow, isOverrideOpen: true };
    assert(storyWindowService.getWindowStatus(overrideWindow, start - 50000) === 'active', 'Debug override forces active');
  }

  // Test 5: Remaining Seconds in Window
  {
    const start = 2000000;
    const end = start + 120 * 1000; // 120 seconds
    const mockWindow: DailyFocusWindow = {
      date: '2026-10-01',
      startEpochMs: start,
      durationMinutes: 2,
      endEpochMs: end,
      notificationScheduled: false,
    };

    assert(storyWindowService.getRemainingWindowSeconds(mockWindow, start - 1000) === 0, 'Remaining is 0 before window');
    assert(storyWindowService.getRemainingWindowSeconds(mockWindow, start) === 120, 'Remaining is 120s at start');
    assert(storyWindowService.getRemainingWindowSeconds(mockWindow, start + 30000) === 90, 'Remaining is 90s after 30s elapsed');
    assert(storyWindowService.getRemainingWindowSeconds(mockWindow, end) === 0, 'Remaining is 0 at end');
    assert(storyWindowService.getRemainingWindowSeconds(mockWindow, end + 5000) === 0, 'Remaining is 0 after end');
  }

  // Test 6: Priority Rules for Stories Tab
  {
    const start = 1000000;
    const end = start + 15 * 60 * 1000;
    const mockWindow: DailyFocusWindow = {
      date: '2026-10-01',
      startEpochMs: start,
      durationMinutes: 15,
      endEpochMs: end,
      notificationScheduled: false,
    };

    // Priority 1: Story daily cap (900 seconds)
    assert(STORY_DAILY_CAP_SECONDS === 900, 'STORY_DAILY_CAP_SECONDS constant equals 900 (15 minutes)');

    // Cap reached -> locked with story_cap_reached even when window is currently active
    const capExceededDuringActive = storyWindowService.getStoryAccessStatus(mockWindow, 900, start + 5000);
    assert(
      capExceededDuringActive.isAccessible === false &&
        (capExceededDuringActive as any).reason === 'story_cap_reached',
      'Daily cap reached (900s) overrides active window and locks stories with story_cap_reached'
    );

    // Cap reached -> locked even when debug override is active
    const overrideWindow: DailyFocusWindow = { ...mockWindow, isOverrideOpen: true };
    const capExceededDuringOverride = storyWindowService.getStoryAccessStatus(overrideWindow, 900, start + 5000);
    assert(
      capExceededDuringOverride.isAccessible === false &&
        (capExceededDuringOverride as any).reason === 'story_cap_reached',
      'Daily cap reached (900s) overrides debug toggle and keeps stories locked'
    );

    // Active window + cap remaining (< 900s) -> accessible
    const activeAllowed = storyWindowService.getStoryAccessStatus(mockWindow, 450, start + 5000);
    assert(activeAllowed.isAccessible === true, 'Active window + cap remaining grants access to stories');

    // Upcoming window + cap remaining -> locked with window_upcoming
    const upcomingStatus = storyWindowService.getStoryAccessStatus(mockWindow, 0, start - 1000);
    assert(
      upcomingStatus.isAccessible === false &&
        (upcomingStatus as any).reason === 'window_upcoming',
      'Upcoming window locks stories with window_upcoming'
    );

    // Passed window + cap remaining -> locked with window_passed
    const passedStatus = storyWindowService.getStoryAccessStatus(mockWindow, 0, end + 1000);
    assert(
      passedStatus.isAccessible === false &&
        (passedStatus as any).reason === 'window_passed',
      'Passed window locks stories with window_passed'
    );
  }

  // Test 7: Priority Rules for Saved Tab (ALWAYS AVAILABLE, NEVER LOCKED)
  {
    const savedStatus = storyWindowService.getSavedAccessStatus();
    assert(savedStatus.isAccessible === true, 'Saved tab is unconditionally accessible with no timers');
  }

  return { passed, failed, errors };
}

import { focusWindowService } from '../focusWindowService';
import { FOCUS_WINDOW_CONFIG } from '../../config/focusWindowConfig';
import { DailyFocusWindow } from '../../types';

export function runFocusWindowTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running FocusWindowService Unit Tests ---');

  // Test 1: Window Generation (start time between 12:00 and 22:00, duration 15-20m)
  {
    const dateStr = '2026-10-01';
    const window = focusWindowService.generateDailyWindow(dateStr, {
      startHourFraction: 0.5,
      durationMinutes: 18,
    });

    assert(window.date === dateStr, 'Window date matches generated date');
    assert(window.durationMinutes === 18, 'Window duration matches specified duration');
    assert(window.endEpochMs - window.startEpochMs === 18 * 60 * 1000, 'End epoch correctly computed');

    const startDate = new Date(window.startEpochMs);
    const startHour = startDate.getHours();
    assert(
      startHour >= FOCUS_WINDOW_CONFIG.WINDOW_START_HOUR_MIN &&
        startHour <= FOCUS_WINDOW_CONFIG.WINDOW_START_HOUR_MAX,
      'Start hour is between 12:00 and 22:00'
    );
  }

  // Test 2: Random Window Generation bounds over 100 iterations
  {
    let allValid = true;
    for (let i = 0; i < 100; i++) {
      const win = focusWindowService.generateDailyWindow('2026-10-01');
      const s = new Date(win.startEpochMs);
      const h = s.getHours();
      if (h < 12 || h > 22) allValid = false;
      if (win.durationMinutes < 15 || win.durationMinutes > 20) allValid = false;
    }
    assert(allValid, '100 randomized windows all fall strictly within 12:00-22:00 and 15-20 min duration');
  }

  // Test 3: Rollover Detection
  {
    assert(focusWindowService.shouldRollover('2026-10-01', '2026-10-02'), 'Rollover triggers on new date');
    assert(!focusWindowService.shouldRollover('2026-10-01', '2026-10-01'), 'Rollover does not trigger on same date');
  }

  // Test 4: Window Status Transitions
  {
    const start = 1000000;
    const durationMin = 15;
    const end = start + durationMin * 60 * 1000;
    const mockWindow: DailyFocusWindow = {
      date: '2026-10-01',
      startEpochMs: start,
      durationMinutes: durationMin,
      endEpochMs: end,
      notificationScheduled: false,
    };

    assert(focusWindowService.getWindowStatus(mockWindow, start - 1000) === 'upcoming', 'Before start time is upcoming');
    assert(focusWindowService.getWindowStatus(mockWindow, start) === 'active', 'At start time is active');
    assert(focusWindowService.getWindowStatus(mockWindow, start + 30000) === 'active', 'Inside window is active');
    assert(focusWindowService.getWindowStatus(mockWindow, end) === 'passed', 'At end time is passed');
    assert(focusWindowService.getWindowStatus(mockWindow, end + 1000) === 'passed', 'After end time is passed');

    // Debug override
    const overrideWindow: DailyFocusWindow = { ...mockWindow, isOverrideOpen: true };
    assert(focusWindowService.getWindowStatus(overrideWindow, start - 50000) === 'active', 'Debug override forces active');
  }

  // Test 5: Priority Rules for Stories Tab
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

    // Rule A: Story cap exceeded (>= 900s) -> always locked with 'story_cap_reached' even during active window
    const capExceededStatus = focusWindowService.getStoryAccessStatus(mockWindow, 900, start + 1000);
    assert(!capExceededStatus.isAccessible && capExceededStatus.reason === 'story_cap_reached', 'Story cap 900s reached locks stories with story_cap_reached');

    // Rule B: Active window + story cap remaining -> accessible
    const activeAllowed = focusWindowService.getStoryAccessStatus(mockWindow, 450, start + 1000);
    assert(activeAllowed.isAccessible === true, 'Active window + story cap remaining grants access to stories');

    // Rule C: Upcoming window -> locked with 'window_upcoming'
    const upcomingStatus = focusWindowService.getStoryAccessStatus(mockWindow, 0, start - 1000);
    assert(!upcomingStatus.isAccessible && upcomingStatus.reason === 'window_upcoming', 'Upcoming window locks stories with window_upcoming');

    // Rule D: Passed window -> locked with 'window_passed'
    const passedStatus = focusWindowService.getStoryAccessStatus(mockWindow, 0, end + 1000);
    assert(!passedStatus.isAccessible && passedStatus.reason === 'window_passed', 'Passed window locks stories with window_passed');
  }

  // Test 6: Priority Rules for Saved Tab
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

    // Saved tab is ALWAYS AVAILABLE, NEVER LOCKED
    const savedActive = focusWindowService.getSavedAccessStatus();
    assert(savedActive.isAccessible === true, 'Saved tab is always accessible with no timers');
  }

  // Test 7: Remaining seconds calculation
  {
    const start = 1000000;
    const end = start + 100000; // 100 seconds
    const mockWindow: DailyFocusWindow = {
      date: '2026-10-01',
      startEpochMs: start,
      durationMinutes: 15,
      endEpochMs: end,
      notificationScheduled: false,
    };

    assert(focusWindowService.getRemainingWindowSeconds(mockWindow, start) === 100, 'Calculates 100s remaining at start');
    assert(focusWindowService.getRemainingWindowSeconds(mockWindow, start + 40000) === 60, 'Calculates 60s remaining at mid point');
    assert(focusWindowService.getRemainingWindowSeconds(mockWindow, end + 1000) === 0, 'Calculates 0s remaining when passed');
  }

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed, errors };
}

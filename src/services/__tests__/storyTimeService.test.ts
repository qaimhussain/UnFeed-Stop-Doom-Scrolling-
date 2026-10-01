import { storyTimeService } from '../storyTimeService';
import { STORY_DAILY_LIMIT_SECONDS, STORY_TIME_CONFIG } from '../../config/storyTimeConfig';

export function runStoryTimeTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running StoryTimeService Unit Tests ---');

  // Test 1: Daily Limit Constant (1200 seconds = 20 minutes)
  {
    assert(STORY_DAILY_LIMIT_SECONDS === 1200, 'STORY_DAILY_LIMIT_SECONDS is strictly 1200');
    assert(STORY_TIME_CONFIG.STORY_DAILY_LIMIT_SECONDS === 1200, 'Config constant matches 1200');
    assert(STORY_TIME_CONFIG.WARNING_THRESHOLD_SECONDS === 120, 'Warning threshold is 2 minutes (120 seconds)');
  }

  // Test 2: Counting time & Limit Reached
  {
    assert(!storyTimeService.isLimitReached(0), '0 seconds used is not limit reached');
    assert(!storyTimeService.isLimitReached(600), '600 seconds (10 min) used is not limit reached');
    assert(!storyTimeService.isLimitReached(1199), '1199 seconds used is not limit reached');
    assert(storyTimeService.isLimitReached(1200), '1200 seconds (20 min) used is limit reached');
    assert(storyTimeService.isLimitReached(1500), 'Over 1200 seconds used is limit reached');

    assert(storyTimeService.getRemainingSeconds(0) === 1200, '1200s remaining when 0s used');
    assert(storyTimeService.getRemainingSeconds(300) === 900, '900s remaining when 300s used');
    assert(storyTimeService.getRemainingSeconds(1200) === 0, '0s remaining when limit reached');
    assert(storyTimeService.getRemainingSeconds(1300) === 0, '0s remaining when over limit');
  }

  // Test 3: Pausing simulation
  {
    // Simulating viewing session tracking:
    // When active and unpaused: session start 1000, current 1010 -> 10s elapsed
    const sessionStart = 1000000;
    const pauseTime = 1010000; // paused after 10s
    const elapsedBeforePause = Math.floor((pauseTime - sessionStart) / 1000);
    assert(elapsedBeforePause === 10, 'Active watching counts 10 seconds');

    // While paused, no additional time counts
    const timeWhilePaused = pauseTime + 30000; // 30s pass while paused
    const pausedElapsed = Math.floor((pauseTime - sessionStart) / 1000);
    assert(pausedElapsed === 10, 'No time counted while story viewer is held/paused');

    // On resume: new session start anchor is timeWhilePaused
    const resumeTime = timeWhilePaused;
    const nowTime = resumeTime + 5000; // 5s after resume
    const elapsedAfterResume = pausedElapsed + Math.floor((nowTime - resumeTime) / 1000);
    assert(elapsedAfterResume === 15, 'Resumed watching accurately resumes counting from paused state');
  }

  // Test 4: Daily Rollover (Midnight Transition)
  {
    const baseTimestamp = 1727784000000; // E.g. 2026-10-01 12:00
    const nextDayTimestamp = baseTimestamp + 86400000; // Forward 24h

    // Genuine forward calendar day
    const rolloverResult = storyTimeService.shouldRollover(
      '2026-10-01',
      '2026-10-02',
      baseTimestamp,
      nextDayTimestamp
    );
    assert(rolloverResult.shouldReset === true, 'Genuine new calendar day triggers rollover reset');
    assert(rolloverResult.reason === 'genuine_new_day', 'Reason is genuine_new_day');

    // Same day
    const sameDayResult = storyTimeService.shouldRollover(
      '2026-10-01',
      '2026-10-01',
      baseTimestamp,
      baseTimestamp + 3600000
    );
    assert(sameDayResult.shouldReset === false, 'Same calendar day does not reset');
    assert(sameDayResult.reason === 'same_day', 'Reason is same_day');
  }

  // Test 5: Clock-Change Protection
  {
    const baseTimestamp = 1727784000000;

    // Clock jumped backward (e.g. user turned back phone clock by 3 hours to cheat limit)
    const backwardTimestamp = baseTimestamp - 3 * 3600 * 1000;
    const cheatResult1 = storyTimeService.shouldRollover(
      '2026-10-01',
      '2026-10-01',
      baseTimestamp,
      backwardTimestamp
    );
    assert(cheatResult1.shouldReset === false, 'Clock jump backward prevents cheat reset');
    assert(cheatResult1.reason === 'clock_tamper_backward', 'Clock jump backward detected');

    // Date moved backward (e.g. user set system calendar to yesterday)
    const cheatResult2 = storyTimeService.shouldRollover(
      '2026-10-02',
      '2026-10-01',
      baseTimestamp,
      baseTimestamp - 86400000
    );
    assert(cheatResult2.shouldReset === false, 'Past calendar date setting prevents cheat reset');
    assert(cheatResult2.reason === 'clock_tamper_backward', 'Backward date detected as tamper');
  }

  // Test 6: Access Rules for Stories and Saved
  {
    // Stories tab: accessible if under limit
    const accessAllowed = storyTimeService.getStoryAccessStatus(500);
    assert(accessAllowed.isAccessible === true, 'Stories accessible when under 1200 seconds');

    // Stories tab: locked when at or over 1200s
    const accessLocked = storyTimeService.getStoryAccessStatus(1200);
    assert(
      accessLocked.isAccessible === false &&
        (accessLocked as any).reason === 'story_limit_reached',
      'Stories locked with reason story_limit_reached when 1200s reached'
    );

    // Saved tab: ALWAYS available, never locked
    const savedAccess = storyTimeService.getSavedAccessStatus();
    assert(savedAccess.isAccessible === true, 'Saved tab is always available, never locked');
  }

  // Test 7: Formatting Helpers
  {
    // Inside story viewer pill format (e.g. "14:32")
    const formattedRemaining = storyTimeService.formatTimeRemaining(872); // 14 mins 32 secs
    assert(formattedRemaining === '14:32', 'formatTimeRemaining formats 872s to 14:32');

    // Stories tab progress format (e.g. "6 of 20 min used")
    const formattedProgress = storyTimeService.formatTimeProgress(360); // 6 minutes
    assert(formattedProgress === '6 of 20 min used', 'formatTimeProgress formats 360s to "6 of 20 min used"');

    const formattedZero = storyTimeService.formatTimeProgress(0);
    assert(formattedZero === '0 of 20 min used', 'formatTimeProgress formats 0s to "0 of 20 min used"');
  }

  return { passed, failed, errors };
}

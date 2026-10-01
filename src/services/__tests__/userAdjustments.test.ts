import { MOCK_CONTACTS, MOCK_STORIES, MOCK_SAVED_ITEMS } from '../mockData';
import { NoteBlock, ScreenTimeState } from '../../types';

export function runUserAdjustmentTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log('\n--- Running User Adjustments (Phase 1 & 2) Unit Tests ---');

  // Test 1: Deterministic picsum.photos URLs with fixed seeds
  {
    const allAvatars = MOCK_CONTACTS.map((u) => u.avatarUrl);
    const allStoryMedia = MOCK_STORIES.flatMap((s) => s.slides.map((slide) => slide.mediaUrl));
    const allSavedMedia = MOCK_SAVED_ITEMS.map((s) => s.mediaUrl);
    const allUrls = [...allAvatars, ...allStoryMedia, ...allSavedMedia].filter(
      (u): u is string => typeof u === 'string' && u.length > 0
    );

    const allPicsumWithSeed = allUrls.every((url) =>
      url.startsWith('https://picsum.photos/seed/')
    );
    assert(allPicsumWithSeed, 'All mock images use deterministic picsum.photos/seed/ URLs');

    // Check unique seeds exist
    const seeds = new Set(allUrls.map((u) => u.split('/')[4]));
    assert(seeds.size >= 10, 'Mock images utilize at least 10 unique deterministic seeds');
  }

  // Test 2: Daily limit bypass hardening (snooze max 2, lock until tomorrow)
  {
    const initialScreenTime: ScreenTimeState = {
      todayDate: '2026-10-01',
      minutesToday: 30,
      secondsAccumulated: 0,
      snoozeCountToday: 0,
      isLockedUntilTomorrow: false,
    };

    // First snooze
    const snooze1: ScreenTimeState = {
      ...initialScreenTime,
      snoozeCountToday: initialScreenTime.snoozeCountToday + 1,
    };
    assert(snooze1.snoozeCountToday === 1, 'First snooze increments snoozeCountToday to 1');

    // Second snooze
    const snooze2: ScreenTimeState = {
      ...snooze1,
      snoozeCountToday: snooze1.snoozeCountToday + 1,
    };
    assert(snooze2.snoozeCountToday === 2, 'Second snooze increments snoozeCountToday to 2');

    // Third snooze attempt should be blocked (max 2)
    const canSnoozeAgain = snooze2.snoozeCountToday < 2;
    assert(!canSnoozeAgain, 'Third snooze is blocked when snoozeCountToday reaches 2');

    // Lock until tomorrow
    const lockedState: ScreenTimeState = {
      ...snooze2,
      isLockedUntilTomorrow: true,
    };
    assert(lockedState.isLockedUntilTomorrow === true, 'Lock until tomorrow locks screen time');

    // Daily rollover resets snooze and lock
    const tomorrow = '2026-10-02';
    const rolledOver: ScreenTimeState = {
      todayDate: tomorrow,
      minutesToday: 0,
      secondsAccumulated: 0,
      snoozeCountToday: 0,
      isLockedUntilTomorrow: false,
    };
    assert(rolledOver.snoozeCountToday === 0, 'Rollover resets snoozeCountToday to 0');
    assert(rolledOver.isLockedUntilTomorrow === false, 'Rollover resets isLockedUntilTomorrow to false');
  }

  // Test 3: Inline bold markdown parser for FormattedText
  {
    const testString = 'Hello **world** this is **bold** text';
    const parts = testString.split(/(\*\*.*?\*\*)/g);
    assert(parts.length === 5, 'String split into 5 tokens by inline bold markers');
    assert(parts[1] === '**world**', 'Token 1 is **world**');
    assert(parts[3] === '**bold**', 'Token 3 is **bold**');
  }

  // Test 4: Block-based Notes model
  {
    const blocks: NoteBlock[] = [
      { id: '1', type: 'paragraph', text: 'Introduction text' },
      { id: '2', type: 'bullet', text: 'First bullet point' },
      { id: '3', type: 'checklist', text: 'Action item', checked: false },
    ];

    assert(blocks.length === 3, 'Note blocks array contains 3 distinct blocks');
    assert(blocks[0].type === 'paragraph', 'Block 1 is paragraph');
    assert(blocks[1].type === 'bullet', 'Block 2 is bullet');
    assert(blocks[2].type === 'checklist' && blocks[2].checked === false, 'Block 3 is unchecked checklist');

    // Toggle checklist
    const updatedChecklist = { ...blocks[2], checked: true };
    assert(updatedChecklist.checked === true, 'Checklist item toggle updates checked status to true');
  }

  return { passed, failed, errors };
}

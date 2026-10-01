declare const process: any;

import { runStoryTimeTests } from '../src/services/__tests__/storyTimeService.test';
import { runStoryWindowTests } from '../src/services/__tests__/storyWindowService.test';
import { runUserAdjustmentTests } from '../src/services/__tests__/userAdjustments.test';

const r0 = runStoryTimeTests();
const r1 = runStoryWindowTests();
const r2 = runUserAdjustmentTests();

const totalPassed = r0.passed + r1.passed + r2.passed;
const totalFailed = r0.failed + r1.failed + r2.failed;
const totalErrors = [...r0.errors, ...r1.errors, ...r2.errors];

if (totalFailed > 0) {
  console.error(`Unit tests failed with ${totalFailed} errors:`, totalErrors);
  process.exit(1);
} else {
  console.log(`\nAll ${totalPassed} unit tests passed successfully! ✨\n`);
  process.exit(0);
}


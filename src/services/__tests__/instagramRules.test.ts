import {
  evaluateInstagramUrl,
  INSTAGRAM_CONFIG,
  INSTAGRAM_HIDDEN_SELECTORS,
  INJECTED_INSTAGRAM_CSS,
} from '../../config/instagramRules';

export function runInstagramRulesTests(): {
  passed: number;
  failed: number;
  errors: string[];
} {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAIL: ${testName}`);
    }
  }

  // 1. Direct Messages are always allowed
  const inboxEval = evaluateInstagramUrl('https://www.instagram.com/direct/inbox/');
  assert(inboxEval.isAllowed === true, 'Direct inbox is allowed');
  assert(inboxEval.category === 'messages', 'Direct inbox has category "messages"');

  const threadEval = evaluateInstagramUrl('https://www.instagram.com/direct/t/17841400123456789/');
  assert(threadEval.isAllowed === true, 'Direct thread is allowed');
  assert(threadEval.category === 'messages', 'Direct thread has category "messages"');

  // 2. Authentication & Login routes are allowed
  const loginEval = evaluateInstagramUrl('https://www.instagram.com/accounts/login/');
  assert(loginEval.isAllowed === true, 'Accounts login is allowed');
  assert(loginEval.category === 'login', 'Accounts login has category "login"');

  const twoFactorEval = evaluateInstagramUrl('https://www.instagram.com/two_factor/');
  assert(twoFactorEval.isAllowed === true, 'Two factor challenge is allowed');

  const fbSsoEval = evaluateInstagramUrl('https://www.facebook.com/login.php?skip_api_login=1');
  assert(fbSsoEval.isAllowed === true, 'Facebook SSO redirect is allowed');

  // 3. Saved collections are allowed
  const savedEval = evaluateInstagramUrl('https://www.instagram.com/sarah_design/saved/');
  assert(savedEval.isAllowed === true, 'Saved route is allowed');
  assert(savedEval.category === 'saved', 'Saved route has category "saved"');

  const ownProfileEval = evaluateInstagramUrl('https://www.instagram.com/sarah_design/', {
    username: 'sarah_design',
  });
  assert(ownProfileEval.isAllowed === true, 'Own profile route is allowed');

  // 4. Doomscroll routes MUST be blocked
  const feedEval = evaluateInstagramUrl('https://www.instagram.com/');
  assert(feedEval.isAllowed === false, 'Home feed is blocked');
  assert(feedEval.category === 'blocked_feed', 'Home feed category is "blocked_feed"');

  const exploreEval = evaluateInstagramUrl('https://www.instagram.com/explore/');
  assert(exploreEval.isAllowed === false, 'Explore is blocked');
  assert(exploreEval.category === 'blocked_explore', 'Explore category is "blocked_explore"');

  const reelsEval = evaluateInstagramUrl('https://www.instagram.com/reels/');
  assert(reelsEval.isAllowed === false, 'Reels is blocked');
  assert(reelsEval.category === 'blocked_reels', 'Reels category is "blocked_reels"');

  const singleReelEval = evaluateInstagramUrl('https://www.instagram.com/reel/C18yZw9L3xk/');
  assert(singleReelEval.isAllowed === false, 'Single reel is blocked');
  assert(singleReelEval.category === 'blocked_reels', 'Single reel category is "blocked_reels"');

  const postEval = evaluateInstagramUrl('https://www.instagram.com/p/C-4a9BvO5e1/');
  assert(postEval.isAllowed === false, 'Post page is blocked');
  assert(postEval.category === 'blocked_post', 'Post page category is "blocked_post"');

  const searchEval = evaluateInstagramUrl('https://www.instagram.com/search/');
  assert(searchEval.isAllowed === false, 'Search is blocked');
  assert(searchEval.category === 'blocked_search', 'Search category is "blocked_search"');

  const otherProfileEval = evaluateInstagramUrl('https://www.instagram.com/random_influencer/', {
    username: 'sarah_design',
  });
  assert(otherProfileEval.isAllowed === false, 'Other profile browsing is blocked');
  assert(otherProfileEval.category === 'blocked_profile', 'Other profile category is "blocked_profile"');

  // 5. External third-party domains blocked
  const externalEval = evaluateInstagramUrl('https://www.tiktok.com/@creator');
  assert(externalEval.isAllowed === false, 'Non-Instagram external domain is blocked');

  // 6. Story time restriction evaluation
  const storyAvailableEval = evaluateInstagramUrl('https://www.instagram.com/stories/alex/', {
    isStoryTimeAvailable: true,
  });
  assert(storyAvailableEval.isAllowed === true, 'Story is allowed when story time is available');

  const storyDepletedEval = evaluateInstagramUrl('https://www.instagram.com/stories/alex/', {
    isStoryTimeAvailable: false,
  });
  assert(storyDepletedEval.isAllowed === false, 'Story is blocked when 20m daily limit is depleted');
  assert(
    storyDepletedEval.blockMessage === "You've used today's story time. See you tomorrow.",
    'Story depleted message matches requirement'
  );

  // 8. DM exceptions: Single reel and single post sent in chat are allowed
  const dmReelEval = evaluateInstagramUrl('https://www.instagram.com/reel/C18yZw9L3xk/', {
    isFromDM: true,
  });
  assert(dmReelEval.isAllowed === true, 'Reel sent in DM is allowed for single reel playback');
  assert(dmReelEval.category === 'single_reel', 'Reel sent in DM has category "single_reel"');

  const dmPostEval = evaluateInstagramUrl('https://www.instagram.com/p/C-4a9BvO5e1/', {
    isFromDM: true,
  });
  assert(dmPostEval.isAllowed === true, 'Post sent in DM is allowed');
  assert(dmPostEval.category === 'saved', 'Post sent in DM has category "saved"');

  // 9. Saved exceptions: Single post & single reel opened from Saved grid are allowed
  const savedPostEval = evaluateInstagramUrl('https://www.instagram.com/p/C-4a9BvO5e1/', {
    isFromSaved: true,
  });
  assert(savedPostEval.isAllowed === true, 'Post opened from Saved is allowed');
  assert(savedPostEval.category === 'saved', 'Post opened from Saved has category "saved"');

  const savedReelEval = evaluateInstagramUrl('https://www.instagram.com/reel/C18yZw9L3xk/', {
    isFromSaved: true,
  });
  assert(savedReelEval.isAllowed === true, 'Reel opened from Saved is allowed');
  assert(savedReelEval.category === 'saved', 'Reel opened from Saved has category "saved"');

  const savedAuthorPostEval = evaluateInstagramUrl('https://www.instagram.com/natgeo/p/C-4a9BvO5e1/', {
    isFromSaved: true,
  });
  assert(savedAuthorPostEval.isAllowed === true, 'Author subpath post opened from Saved is allowed');
  assert(savedAuthorPostEval.category === 'saved', 'Author subpath post has category "saved"');

  // 10. Stories tab home page exception: Stories tray on / is allowed when isStoriesContext is true
  const storiesTrayEval = evaluateInstagramUrl('https://www.instagram.com/', {
    isStoriesContext: true,
  });
  assert(storiesTrayEval.isAllowed === true, 'Home page allowed in Stories context for stories tray');
  assert(storiesTrayEval.category === 'stories', 'Home page in Stories context has category "stories"');

  const blockedFeedEval = evaluateInstagramUrl('https://www.instagram.com/', {
    isStoriesContext: false,
  });
  assert(blockedFeedEval.isAllowed === false, 'Home feed is blocked when not in Stories context');

  return { passed, failed, errors };
}

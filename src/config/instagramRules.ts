/**
 * Instagram Rules & Route Classification for Unfeed
 * 
 * Central configuration file containing all allowed/blocked routes,
 * user agent settings, and injected CSS/JS selectors.
 * 
 * HARD RULES:
 * - Never read, intercept, store or log passwords or credentials.
 * - Block feed doomscrolling, explore, and reels.
 * - Allow unrestricted Direct Messages, Stories tray, and Saved posts.
 */

export const INSTAGRAM_CONFIG = {
  BASE_URL: 'https://www.instagram.com',
  LOGIN_URL: 'https://www.instagram.com/accounts/login/',
  DIRECT_INBOX_URL: 'https://www.instagram.com/direct/inbox/',
  SAVED_URL: 'https://www.instagram.com/saved/all-posts/',

  // Standard Mobile Chrome User Agent for modern Android device
  MOBILE_CHROME_USER_AGENT:
    'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
} as const;

export type RouteCategory =
  | 'login'
  | 'messages'
  | 'saved'
  | 'stories'
  | 'single_reel'
  | 'blocked_feed'
  | 'blocked_explore'
  | 'blocked_reels'
  | 'blocked_post'
  | 'blocked_search'
  | 'blocked_profile'
  | 'blocked_other';

export const INSTAGRAM_HIDDEN_SELECTORS = [
  'nav[role="navigation"]',
  'div[role="navigation"]',
  'footer',
  'header:not([role="banner"])',
  'article',
  'a[href*="/explore/"]',
  'a[href*="/reels/"]',
  'svg[aria-label="Home"]',
  'svg[aria-label="Search"]',
  'svg[aria-label="Explore"]',
  'svg[aria-label="Reels"]',
];

export interface RouteEvaluation {
  isAllowed: boolean;
  category: RouteCategory;
  blockMessage?: string;
}

export interface EvaluateInstagramUrlOptions {
  isStoryTimeAvailable?: boolean;
  username?: string;
  isFromDM?: boolean;
  isFromSaved?: boolean;
  isStoriesContext?: boolean;
}

/**
 * Evaluates whether a given Instagram URL is allowed under Unfeed's focus rules.
 */
export function evaluateInstagramUrl(
  url: string,
  options?: EvaluateInstagramUrlOptions
): RouteEvaluation {
  if (!url) {
    return { isAllowed: false, category: 'blocked_other', blockMessage: "That's the part Unfeed hides." };
  }

  // Parse path
  let path = url;
  try {
    const parsed = new URL(url);
    // Allow Facebook/Meta SSO login redirects if on auth page
    if (parsed.hostname.includes('facebook.com') && parsed.pathname.includes('login')) {
      return { isAllowed: true, category: 'login' };
    }
    // Block non-instagram domains (except login SSO)
    if (!parsed.hostname.includes('instagram.com')) {
      return { isAllowed: false, category: 'blocked_other', blockMessage: "That's the part Unfeed hides." };
    }
    path = parsed.pathname;
  } catch {
    // If not a full URL, treat as pathname
    path = url.startsWith('/') ? url : `/${url}`;
  }

  // Normalize path
  if (!path.endsWith('/')) {
    path = `${path}/`;
  }

  // 1. Auth & Login routes (Always allowed during login)
  if (
    path.startsWith('/accounts/') ||
    path.startsWith('/challenge/') ||
    path.startsWith('/two_factor/') ||
    path.startsWith('/login/')
  ) {
    return { isAllowed: true, category: 'login' };
  }

  // 2. Direct Messages (Inbox & specific conversation threads) - ALWAYS UNRESTRICTED
  if (path.startsWith('/direct/')) {
    return { isAllowed: true, category: 'messages' };
  }

  // 3. Saved Collections & Saved Items - ALWAYS UNRESTRICTED
  if (path.includes('/saved/')) {
    return { isAllowed: true, category: 'saved' };
  }

  // 4. Single Post (/p/): Allowed if from Saved or sent in DM conversation; blocked from feed/explore
  if (path.startsWith('/p/')) {
    if (options?.isFromDM || options?.isFromSaved) {
      return { isAllowed: true, category: 'saved' };
    }
    return {
      isAllowed: false,
      category: 'blocked_post',
      blockMessage: "Posts are hidden by Unfeed to stop infinite scrolling.",
    };
  }

  // 5. Reels (/reel/ or /reels/):
  // Single Reel (/reel/): Allowed ONLY when sent in chat (isFromDM)
  if (path.startsWith('/reel/')) {
    if (options?.isFromDM) {
      return { isAllowed: true, category: 'single_reel' };
    }
    return {
      isAllowed: false,
      category: 'blocked_reels',
      blockMessage: "Reels are hidden by Unfeed to stop doom scrolling.",
    };
  }

  // General Reels feed (/reels/): Always blocked
  if (path.startsWith('/reels/')) {
    return {
      isAllowed: false,
      category: 'blocked_reels',
      blockMessage: "Reels are hidden by Unfeed to stop doom scrolling.",
    };
  }

  // 6. Explore (/explore): Always blocked
  if (path.startsWith('/explore/')) {
    return {
      isAllowed: false,
      category: 'blocked_explore',
      blockMessage: "Explore is hidden by Unfeed to keep you focused.",
    };
  }

  // 7. Search (/search/): Always blocked
  if (path.startsWith('/search/')) {
    return {
      isAllowed: false,
      category: 'blocked_search',
      blockMessage: "Search is hidden by Unfeed to keep you focused.",
    };
  }

  // 8. Stories & Stories Tray (/stories/)
  if (path.startsWith('/stories/')) {
    if (options?.isStoryTimeAvailable === false) {
      return {
        isAllowed: false,
        category: 'stories',
        blockMessage: "You've used today's story time. See you tomorrow.",
      };
    }
    return { isAllowed: true, category: 'stories' };
  }

  // 9. Root / Home path (/):
  // If in Stories tab context, stories tray is allowed (feed posts hidden via CSS)
  if (path === '/') {
    if (options?.isStoriesContext) {
      return { isAllowed: true, category: 'stories' };
    }
    return {
      isAllowed: false,
      category: 'blocked_feed',
      blockMessage: "Home feed is hidden by Unfeed to stop doom scrolling.",
    };
  }

  // 10. Profile browsing
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1) {
    // Allow user's own profile
    if (options?.username && segments[0].toLowerCase() === options.username.toLowerCase()) {
      return { isAllowed: true, category: 'saved' };
    }
    return {
      isAllowed: false,
      category: 'blocked_profile',
      blockMessage: "Profiles are hidden by Unfeed to keep you focused.",
    };
  }

  return {
    isAllowed: false,
    category: 'blocked_other',
    blockMessage: "That's the part Unfeed hides.",
  };
}

/**
 * JavaScript string injected into the WebView before content loads
 * to inject custom styling and hide doomscrolling elements.
 */
export const INJECTED_INSTAGRAM_CSS = [
  '(function() {',
  '  try {',
  '    var pathname = window.location.pathname || "";',
  '    var isPostPage = pathname.indexOf("/p/") !== -1;',
  '    var isHomePage = pathname === "/" || pathname === "";',
  '    var style = document.createElement("style");',
  '    style.id = "unfeed-custom-style";',
  '    var css = [',
  '      "a[href*=\\"/explore\\"], a[href*=\\"/reels\\"], svg[aria-label=\\"Explore\\"], svg[aria-label=\\"Reels\\"], footer { display: none !important; visibility: hidden !important; height: 0 !important; pointer-events: none !important; }",',
  '      "a[href*=\\"play.google.com\\"], a[href*=\\"itunes.apple.com\\"], div[data-nosnippet] { display: none !important; }",',
  '      "body, html { overscroll-behavior-y: none !important; }"',
  '    ];',
  '    if (isHomePage) {',
  '      css.push("div[role=\\"feed\\"], main section > div > div > article { display: none !important; }");',
  '    }',
  '    if (isPostPage) {',
  '      css.push("article ~ div, div:has(> a[href*=\\"/explore/\\"]), div:has(> a[href*=\\"/reels/\\"]) { display: none !important; }");',
  '    }',
  '    style.innerHTML = css.join("\\n");',
  '    document.head.appendChild(style);',
  '  } catch(e) {}',
  '})();',
  'true;'
].join('\n');

/**
 * Script injected into Single Reel View to lock scrolling, disable
 * swipe-up to next reel, ensure audio plays, and hide suggested reels & comments.
 */
export const SINGLE_REEL_LOCK_JS = [
  '(function() {',
  '  try {',
  '    if (window.location.pathname.indexOf("/reel/") === -1) return;',
  '    function applyScrollLock() {',
  '      if (document.documentElement) {',
  '        document.documentElement.style.setProperty("overflow", "hidden", "important");',
  '        document.documentElement.style.setProperty("touch-action", "none", "important");',
  '        document.documentElement.style.setProperty("overscroll-behavior", "none", "important");',
  '        document.documentElement.style.setProperty("height", "100vh", "important");',
  '      }',
  '      if (document.body) {',
  '        document.body.style.setProperty("overflow", "hidden", "important");',
  '        document.body.style.setProperty("touch-action", "none", "important");',
  '        document.body.style.setProperty("overscroll-behavior", "none", "important");',
  '        document.body.style.setProperty("height", "100vh", "important");',
  '        document.body.style.setProperty("position", "fixed", "important");',
  '        document.body.style.setProperty("width", "100%", "important");',
  '      }',
  '    }',
  '    applyScrollLock();',
  '    document.addEventListener("DOMContentLoaded", applyScrollLock);',
  '    var blockEvent = function(e) {',
  '      if (e.cancelable) {',
  '        e.preventDefault();',
  '        e.stopPropagation();',
  '      }',
  '    };',
  '    window.addEventListener("touchmove", blockEvent, { passive: false, capture: true });',
  '    window.addEventListener("wheel", blockEvent, { passive: false, capture: true });',
  '    window.addEventListener("keydown", function(e) {',
  '      if ([32, 33, 34, 38, 40].includes(e.keyCode)) { blockEvent(e); }',
  '    }, { capture: true });',
  '    function configureAudio() {',
  '      var videos = document.querySelectorAll("video");',
  '      videos.forEach(function(v) {',
  '        try {',
  '          v.muted = false;',
  '          v.volume = 1.0;',
  '          v.loop = true;',
  '          if (v.paused) { v.play().catch(function() {}); }',
  '        } catch(e) {}',
  '      });',
  '    }',
  '    setTimeout(configureAudio, 400);',
  '    setTimeout(configureAudio, 1200);',
  '    setTimeout(configureAudio, 2500);',
  '    document.addEventListener("click", function() { configureAudio(); }, { capture: true, once: true });',
  '    var style = document.createElement("style");',
  '    style.id = "unfeed-single-reel-lock";',
  '    style.innerHTML = [',
  '      "html, body { overflow: hidden !important; touch-action: none !important; overscroll-behavior: none !important; height: 100vh !important; position: fixed !important; width: 100% !important; }",',
  '      "div[role=\\"feed\\"] > div:nth-child(n+2), section > div > div:nth-child(n+2), div:has(> a[href*=\\"/reels/\\"]), div:has(> a[href*=\\"/explore/\\"]), div[aria-label=\\"More reels\\"], footer, nav[role=\\"navigation\\"] { display: none !important; visibility: hidden !important; pointer-events: none !important; height: 0 !important; }"',
  '    ].join("\\n");',
  '    document.head.appendChild(style);',
  '  } catch(e) {}',
  '})();',
  'true;'
].join('\n');


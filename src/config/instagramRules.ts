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

/**
 * Evaluates whether a given Instagram URL is allowed under Unfeed's focus rules.
 */
export function evaluateInstagramUrl(
  url: string,
  options?: { isStoryTimeAvailable?: boolean; username?: string }
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

  // 3. Saved Items (User's saved collections & individual saved posts) - ALWAYS UNRESTRICTED
  if (path.includes('/saved/') || path.startsWith('/p/')) {
    return { isAllowed: true, category: 'saved' };
  }

  // 4. Stories & Stories Tray (on home page '/', the stories tray is shown while feed posts are hidden by CSS)
  if (path === '/' || path.startsWith('/stories/')) {
    return { isAllowed: true, category: 'stories' };
  }

  // 5. BLOCKED: Explore (/explore)
  if (path.startsWith('/explore/')) {
    return { isAllowed: false, category: 'blocked_explore', blockMessage: "Explore is hidden by Unfeed to keep you focused." };
  }

  // 6. BLOCKED: Reels (/reels, /reel)
  if (path.startsWith('/reels/') || path.startsWith('/reel/')) {
    return { isAllowed: false, category: 'blocked_reels', blockMessage: "Reels are hidden by Unfeed to stop doom scrolling." };
  }

  // 7. Profile browsing
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1) {
    // Allow user's own profile
    if (options?.username && segments[0].toLowerCase() === options.username.toLowerCase()) {
      return { isAllowed: true, category: 'saved' };
    }
  }

  // Any other page default allowed if not reels/explore
  return { isAllowed: true, category: 'saved' };
}

/**
 * JavaScript string injected into the WebView before content loads
 * to inject custom styling and hide doomscrolling elements.
 */
export const INJECTED_INSTAGRAM_CSS = `
  (function() {
    try {
      var style = document.createElement('style');
      style.id = 'unfeed-custom-style';
      style.innerHTML = \`
        /* Hide infinite feed articles so only stories tray / direct messages appear */
        article,
        div[role="feed"] {
          display: none !important;
        }

        /* Hide explore & reels navigation buttons */
        a[href*="/explore"],
        a[href*="/reels"],
        svg[aria-label="Explore"],
        svg[aria-label="Reels"],
        footer {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          pointer-events: none !important;
        }

        /* Hide app download popups and banners */
        a[href*="play.google.com"],
        a[href*="itunes.apple.com"],
        div[data-nosnippet] {
          display: none !important;
        }

        /* Clean scroll without bounce margins */
        body, html {
          overscroll-behavior-y: none !important;
        }
      \`;
      document.head.appendChild(style);
    } catch(e) {
      console.warn('Unfeed style injection error:', e);
    }
  })();
  true;
`;

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
  if (path.includes('/p/')) {
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
  // Single Reel with shortcode: Allowed when sent in chat (isFromDM) or saved (isFromSaved)
  const isSingleReel = path.includes('/reel/') || (path.includes('/reels/') && path !== '/reels/');
  if (isSingleReel) {
    if (options?.isFromDM || options?.isFromSaved) {
      return { isAllowed: true, category: options?.isFromDM ? 'single_reel' : 'saved' };
    }
    return {
      isAllowed: false,
      category: 'blocked_reels',
      blockMessage: "Reels are hidden by Unfeed to stop doom scrolling.",
    };
  }

  // General Reels feed (/reels/): Always blocked
  if (path === '/reels/' || path.startsWith('/reels/')) {
    return {
      isAllowed: false,
      category: 'blocked_reels',
      blockMessage: "Reels are hidden by Unfeed to stop doom scrolling.",
    };
  }

  // IGTV single video (/tv/): Allowed if from DM or Saved
  if (path.includes('/tv/')) {
    if (options?.isFromDM || options?.isFromSaved) {
      return { isAllowed: true, category: 'saved' };
    }
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

  // If navigating from Saved and on a subpath of user's saved items or post
  if (options?.isFromSaved) {
    return { isAllowed: true, category: 'saved' };
  }

  return {
    isAllowed: false,
    category: 'blocked_other',
    blockMessage: "That's the part Unfeed hides.",
  };
}

/**
 * JavaScript string injected into the WebView before content loads
 * to inject custom styling, hide doomscrolling elements, and blackout feed on Stories tab.
 */
export const INJECTED_INSTAGRAM_CSS = [
  '(function() {',
  '  try {',
  '    var style = document.createElement("style");',
  '    style.id = "unfeed-custom-style";',
  '    var css = [',
  '      "a[href*=\\"/explore\\"], a[href*=\\"/reels\\"], svg[aria-label=\\"Explore\\"], svg[aria-label=\\"Reels\\"], footer { display: none !important; visibility: hidden !important; height: 0 !important; pointer-events: none !important; }",',
  '      "a[href*=\\"play.google.com\\"], a[href*=\\"itunes.apple.com\\"], div[data-nosnippet] { display: none !important; }",',
  '      "body, html { overscroll-behavior-y: none !important; }",',
  '      "html.unfeed-stories-home, body.unfeed-stories-home { overflow-y: hidden !important; touch-action: pan-x !important; height: 100vh !important; position: fixed !important; width: 100% !important; }",',
  '      "html.unfeed-stories-home article, html.unfeed-stories-home [role=\\"article\\"], html.unfeed-stories-home div[role=\\"feed\\"] { display: none !important; visibility: hidden !important; height: 0 !important; pointer-events: none !important; opacity: 0 !important; }",',
  '      "article ~ div, div:has(> a[href*=\\"/explore/\\"]), div:has(> a[href*=\\"/reels/\\"]) { display: none !important; }"',
  '    ];',
  '    style.innerHTML = css.join("\\n");',
  '    document.head.appendChild(style);',
  '    function manageStoriesHomeFeed() {',
  '      var p = window.location.pathname || "";',
  '      var isHome = p === "/" || p === "";',
  '      var isStory = p.indexOf("/stories/") !== -1;',
  '      var blackout = document.getElementById("unfeed-stories-blackout");',
  '      if (isHome) {',
  '        if (document.documentElement) document.documentElement.classList.add("unfeed-stories-home");',
  '        if (document.body) document.body.classList.add("unfeed-stories-home");',
  '        if (!blackout && document.body) {',
  '          blackout = document.createElement("div");',
  '          blackout.id = "unfeed-stories-blackout";',
  '          blackout.style.cssText = "position:fixed;top:136px;left:0;right:0;bottom:0;background:rgba(12,12,18,0.72);-webkit-backdrop-filter:blur(40px) saturate(200%);backdrop-filter:blur(40px) saturate(200%);border-top:1px solid rgba(255,255,255,0.14);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,sans-serif;pointer-events:all;padding:24px;text-align:center;";',
  '          blackout.innerHTML = \'<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);box-shadow:0 16px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.25);border-radius:28px;-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);padding:24px 28px;max-width:300px;display:flex;flex-direction:column;align-items:center;"><div style="width:48px;height:48px;border-radius:24px;background:linear-gradient(135deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5);padding:2px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><div style="width:100%;height:100%;background:rgba(18,18,24,0.92);border-radius:22px;display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg></div></div><div style="font-size:16px;font-weight:700;color:#FFFFFF;letter-spacing:-0.2px;margin-bottom:6px;">Quiet Space</div><div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.45;">Only stories are active here.<br/>Tap any circle above to watch.</div></div>\';',
  '          document.body.appendChild(blackout);',
  '        } else if (blackout) {',
  '          blackout.style.display = "flex";',
  '        }',
  '        var articles = document.querySelectorAll("article, [role=\'article\'], div[role=\'feed\']");',
  '        for (var i = 0; i < articles.length; i++) {',
  '          articles[i].style.display = "none";',
  '        }',
  '      } else {',
  '        if (document.documentElement) document.documentElement.classList.remove("unfeed-stories-home");',
  '        if (document.body) document.body.classList.remove("unfeed-stories-home");',
  '        if (blackout) {',
  '          blackout.style.display = "none";',
  '        }',
  '      }',
  '    }',
  '    manageStoriesHomeFeed();',
  '    setInterval(manageStoriesHomeFeed, 500);',
  '    window.addEventListener("popstate", manageStoriesHomeFeed);',
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
  '    if (window.location.pathname.indexOf("/reel/") === -1 && window.location.pathname.indexOf("/reels/") === -1) return;',
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


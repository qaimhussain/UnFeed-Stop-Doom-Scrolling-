/**
 * Injected JavaScript for the Instagram WebView.
 *
 * NOTE: These scripts are plain strings evaluated inside the page. They never
 * read, store or transmit credentials.
 */

/**
 * Injected BEFORE content loads on every Unfeed WebView.
 *
 * - Hides explore/reels links and promo banners.
 * - Home ("/") guard: hides the feed, shows a frosted "Quiet Space" shield under
 *   the stories tray and blocks vertical scrolling. This is installed defensively
 *   (works even if <head>/<body> do not exist yet, survives SPA navigation and
 *   re-renders) so the feed can never flash through or be scrolled.
 */
export const INJECTED_INSTAGRAM_CSS = `
(function() {
  try {
    if (window.__unfeedHomeGuard) return;
    window.__unfeedHomeGuard = true;

    var CSS = [
      'a[href*="/explore"], a[href*="/reels"], svg[aria-label="Explore"], svg[aria-label="Reels"], footer { display: none !important; visibility: hidden !important; height: 0 !important; pointer-events: none !important; }',
      'a[href*="play.google.com"], a[href*="itunes.apple.com"], div[data-nosnippet] { display: none !important; }',
      'body, html { overscroll-behavior-y: none !important; }',
      'html.unfeed-stories-home, html.unfeed-stories-home body { overflow: hidden !important; touch-action: pan-x !important; height: 100% !important; width: 100% !important; overscroll-behavior: none !important; }',
      'html.unfeed-stories-home article, html.unfeed-stories-home [role="article"], html.unfeed-stories-home div[role="feed"] { display: none !important; visibility: hidden !important; height: 0 !important; pointer-events: none !important; opacity: 0 !important; }',
      'article ~ div, div:has(> a[href*="/explore/"]), div:has(> a[href*="/reels/"]) { display: none !important; }'
    ].join('\\n');

    function ensureStyle() {
      if (document.getElementById('unfeed-custom-style')) return;
      var parent = document.head || document.documentElement;
      if (!parent) return;
      var s = document.createElement('style');
      s.id = 'unfeed-custom-style';
      s.innerHTML = CSS;
      parent.appendChild(s);
    }

    function isHome() {
      var p = window.location.pathname || '';
      return p === '/' || p === '';
    }

    var SHIELD_HTML = '<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);box-shadow:0 16px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.25);border-radius:28px;-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);padding:24px 28px;max-width:300px;display:flex;flex-direction:column;align-items:center;"><div style="width:48px;height:48px;border-radius:24px;background:linear-gradient(135deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5);padding:2px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><div style="width:100%;height:100%;background:rgba(18,18,24,0.92);border-radius:22px;display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg></div></div><div style="font-size:16px;font-weight:700;color:#FFFFFF;letter-spacing:-0.2px;margin-bottom:6px;">Quiet Space</div><div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.45;">Home feed is muted so you stay in flow.<br/>Stories above • Chats &amp; Saved open.</div></div>';
    var SHIELD_CSS = 'position:fixed;top:132px;left:0;right:0;bottom:0;background:linear-gradient(to bottom, rgba(10,10,14,0) 0%, rgba(10,10,14,0.6) 28px, rgba(8,8,12,0.92) 65px, rgba(6,6,10,0.98) 100%);-webkit-backdrop-filter:blur(36px) saturate(200%);backdrop-filter:blur(36px) saturate(200%);-webkit-mask-image:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 14px, rgba(0,0,0,0.65) 38px, rgba(0,0,0,0.95) 65px, #000 90px);mask-image:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 14px, rgba(0,0,0,0.65) 38px, rgba(0,0,0,0.95) 65px, #000 90px);z-index:2147483646;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,sans-serif;pointer-events:all;padding:24px;text-align:center;touch-action:none;';

    function apply() {
      try {
        ensureStyle();
        var root = document.documentElement;
        if (!root) return;
        var shield = document.getElementById('unfeed-stories-blackout');
        if (isHome()) {
          root.classList.add('unfeed-stories-home');
          if (document.body) document.body.classList.add('unfeed-stories-home');
          var host = document.body || root;
          if (!shield) {
            shield = document.createElement('div');
            shield.id = 'unfeed-stories-blackout';
            shield.style.cssText = SHIELD_CSS;
            shield.innerHTML = SHIELD_HTML;
            shield.addEventListener('touchmove', function(e) { if (e.cancelable) e.preventDefault(); }, { passive: false });
            host.appendChild(shield);
          } else if (shield.parentNode !== host) {
            host.appendChild(shield);
          }
          shield.style.display = 'flex';
          var feeds = document.querySelectorAll('article, [role="article"], div[role="feed"]');
          for (var i = 0; i < feeds.length; i++) { feeds[i].style.display = 'none'; }
          if (window.scrollY !== 0) window.scrollTo(0, 0);
        } else {
          root.classList.remove('unfeed-stories-home');
          if (document.body) document.body.classList.remove('unfeed-stories-home');
          if (shield) shield.style.display = 'none';
        }
      } catch (e) {}
    }

    // Block vertical scrolling on home (horizontal swipes on the stories tray still work)
    var sx = 0, sy = 0;
    window.addEventListener('touchstart', function(e) {
      if (e.touches && e.touches.length) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    }, { passive: true, capture: true });
    window.addEventListener('touchmove', function(e) {
      if (!isHome() || !e.touches || !e.touches.length) return;
      var dx = Math.abs(e.touches[0].clientX - sx);
      var dy = Math.abs(e.touches[0].clientY - sy);
      if (dy > dx && e.cancelable) { e.preventDefault(); }
    }, { passive: false, capture: true });
    window.addEventListener('wheel', function(e) {
      if (isHome() && e.cancelable) e.preventDefault();
    }, { passive: false, capture: true });

    // Apply as early and as often as possible
    apply();
    var scheduled = false;
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      (window.requestAnimationFrame || setTimeout)(function() { scheduled = false; apply(); });
    }
    try {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    ['pushState', 'replaceState'].forEach(function(fn) {
      var orig = history[fn];
      history[fn] = function() {
        var r = orig.apply(this, arguments);
        apply();
        return r;
      };
    });
    window.addEventListener('popstate', apply);
    window.addEventListener('hashchange', apply);
    document.addEventListener('DOMContentLoaded', apply);
    window.addEventListener('load', apply);
    setInterval(apply, 250);
  } catch (e) {}
})();
true;
`;

/**
 * Single Reel / Post lock (DM + Saved WebViews).
 *
 * Installed once, then dynamically locks/unlocks based on the CURRENT path, so it
 * also works when a reel is opened through Instagram's in-page (SPA) navigation
 * from a chat. While locked: no scrolling, no swipe to next reel, audio on, loop on.
 */
export const SINGLE_REEL_LOCK_JS = `
(function() {
  try {
    if (window.__unfeedReelLock) return;
    window.__unfeedReelLock = true;

    var locked = false;

    function isReelPath() {
      var p = window.location.pathname || '';
      return p.indexOf('/reel/') !== -1 || (p.indexOf('/reels/') !== -1 && p !== '/reels/');
    }

    var LOCK_CSS = [
      'html.unfeed-reel-locked, html.unfeed-reel-locked body { overflow: hidden !important; touch-action: none !important; overscroll-behavior: none !important; height: 100% !important; width: 100% !important; }',
      'html.unfeed-reel-locked body { position: fixed !important; }',
      'html.unfeed-reel-locked * { scroll-snap-type: none !important; }',
      'html.unfeed-reel-locked div[aria-label="More reels"], html.unfeed-reel-locked footer, html.unfeed-reel-locked nav[role="navigation"], html.unfeed-reel-locked div:has(> a[href*="/explore/"]) { display: none !important; visibility: hidden !important; pointer-events: none !important; height: 0 !important; }'
    ].join('\\n');

    function ensureStyle() {
      if (document.getElementById('unfeed-single-reel-lock')) return;
      var parent = document.head || document.documentElement;
      if (!parent) return;
      var s = document.createElement('style');
      s.id = 'unfeed-single-reel-lock';
      s.innerHTML = LOCK_CSS;
      parent.appendChild(s);
    }

    function freezeScrollers() {
      var els = document.querySelectorAll('div, section, main');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.scrollHeight > el.clientHeight + 2) {
          var oy = window.getComputedStyle(el).overflowY;
          if (oy === 'auto' || oy === 'scroll') {
            el.style.setProperty('overflow-y', 'hidden', 'important');
            el.style.setProperty('scroll-snap-type', 'none', 'important');
            el.style.setProperty('touch-action', 'none', 'important');
          }
        }
      }
    }

    function configureAudio() {
      var videos = document.querySelectorAll('video');
      for (var i = 0; i < videos.length; i++) {
        var v = videos[i];
        try {
          v.muted = false;
          v.volume = 1.0;
          v.loop = true;
          if (v.paused) { v.play().catch(function() {}); }
        } catch (e) {}
      }
    }

    function check() {
      try {
        var shouldLock = isReelPath();
        var root = document.documentElement;
        if (!root) return;
        if (shouldLock) {
          ensureStyle();
          if (!root.classList.contains('unfeed-reel-locked')) root.classList.add('unfeed-reel-locked');
          freezeScrollers();
          if (!locked) { setTimeout(configureAudio, 300); setTimeout(configureAudio, 1000); }
          locked = true;
        } else if (locked || root.classList.contains('unfeed-reel-locked')) {
          root.classList.remove('unfeed-reel-locked');
          locked = false;
        }
      } catch (e) {}
    }

    var blockEvent = function(e) {
      if (locked && e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('touchmove', blockEvent, { passive: false, capture: true });
    window.addEventListener('wheel', blockEvent, { passive: false, capture: true });
    window.addEventListener('keydown', function(e) {
      if ([32, 33, 34, 38, 40].indexOf(e.keyCode) !== -1) { blockEvent(e); }
    }, { capture: true });
    document.addEventListener('click', function() { if (locked) configureAudio(); }, { capture: true });

    check();
    var scheduled = false;
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      (window.requestAnimationFrame || setTimeout)(function() { scheduled = false; check(); });
    }
    try {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    ['pushState', 'replaceState'].forEach(function(fn) {
      var orig = history[fn];
      history[fn] = function() {
        var r = orig.apply(this, arguments);
        check();
        return r;
      };
    });
    window.addEventListener('popstate', check);
    document.addEventListener('DOMContentLoaded', check);
    window.addEventListener('load', check);
    setInterval(check, 300);
  } catch (e) {}
})();
true;
`;

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  BackHandler,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import {
  INSTAGRAM_CONFIG,
  evaluateInstagramUrl,
  INJECTED_INSTAGRAM_CSS,
  SINGLE_REEL_LOCK_JS,
  RouteEvaluation,
} from '../../config/instagramRules';
import { BlockedDoomscrollCard } from './BlockedDoomscrollCard';
import { GlassSurface } from '../common/GlassSurface';
import { ChatSkeletonRow, Skeleton } from '../common/SkeletonLoader';
import { useTheme } from '../../theme/ThemeContext';
import { useAppStore } from '../../store/useAppStore';

export interface InstagramWebViewProps {
  initialUrl: string;
  fallbackUrl?: string;
  isFromDM?: boolean;
  isFromSaved?: boolean;
  isStoriesContext?: boolean;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoginDetected?: (url: string) => void;
  onUsernameDetected?: (username: string) => void;
  style?: object;
  testID?: string;
}

export const InstagramWebView = React.forwardRef<WebView, InstagramWebViewProps>(({
  initialUrl,
  fallbackUrl = INSTAGRAM_CONFIG.DIRECT_INBOX_URL,
  isFromDM = false,
  isFromSaved = false,
  isStoriesContext = false,
  onNavigationStateChange: externalOnNavChange,
  onLoginDetected,
  onUsernameDetected,
  style,
  testID,
}, ref) => {
  const { colors, typography, isDark } = useTheme();
  const internalWebViewRef = useRef<WebView>(null);
  const webViewRef = (ref as React.RefObject<WebView>) || internalWebViewRef;

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  // Auto-dismiss loading overlay quickly (max 900ms) so web content is interactive immediately
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const [blockedState, setBlockedState] = useState<{
    isBlocked: boolean;
    category?: string;
    message?: string;
  }>({ isBlocked: false });

  // True when the blocked page was reached via an in-page (SPA) navigation, i.e. the
  // WebView document actually changed. False when the load was cancelled before it started.
  const blockedBySpaRef = useRef(false);

  const dismissBlocked = useCallback(() => {
    const needsRestore = blockedBySpaRef.current;
    blockedBySpaRef.current = false;
    setBlockedState({ isBlocked: false });
    // A cancelled load never replaced the page, so there is nothing to reload.
    if (needsRestore && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `(function(){try{if(window.history.length>1){window.history.back();}else{window.location.replace("${fallbackUrl}");}}catch(e){window.location.replace("${fallbackUrl}");}})();true;`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackUrl]);

  const isStoryTimeAvailable = useAppStore(
    (state) => (state.storyTimeUsage?.secondsUsed ?? 0) < 1200
  );
  const instagramUsername = useAppStore((state) => state.instagramUsername);

  // Android Back Button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (blockedState.isBlocked) {
        dismissBlocked();
        return true;
      }

      if (isFromDM && (currentUrl.includes('/reel/') || currentUrl.includes('/p/'))) {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        } else if (webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.location.href = "${fallbackUrl}"; true;`
          );
          return true;
        }
      }

      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [canGoBack, blockedState, fallbackUrl, isFromDM, currentUrl, dismissBlocked]);

  // Request filter to block doomscrolling URLs before loading
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string; isTopFrame?: boolean }) => {
      const { url } = request;

      // Security: block dangerous protocols
      if (
        url.startsWith('javascript:') ||
        url.startsWith('file:') ||
        url.startsWith('content:') ||
        url.startsWith('intent:')
      ) {
        return false;
      }

      // Allow about:blank and blob:
      if (
        url.startsWith('about:') ||
        url.startsWith('blob:')
      ) {
        return true;
      }

      // Enforce HTTPS
      if (!url.startsWith('https://')) {
        return false;
      }

      // If inside DM, prevent navigating to the home feed
      if (isFromDM) {
        let reqPath = url;
        try {
          reqPath = new URL(url).pathname;
        } catch {
          reqPath = url;
        }
        if (reqPath === '/' || reqPath === '' || url.includes('instagram.com/?')) {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (window.location.pathname.indexOf('/direct/t/') !== -1) {
                window.location.href = '/direct/inbox/';
              }
              true;
            `);
          }
          return false;
        }
      }

      const evaluation: RouteEvaluation = evaluateInstagramUrl(url, {
        isStoryTimeAvailable,
        username: instagramUsername || undefined,
        isFromDM,
        isFromSaved,
        isStoriesContext,
      });

      if (!evaluation.isAllowed) {
        blockedBySpaRef.current = false;
        setBlockedState({
          isBlocked: true,
          category: evaluation.category,
          message: evaluation.blockMessage,
        });
        return false;
      }

      // Check if this allowed URL signals completed login
      if (onLoginDetected && evaluation.category !== 'login') {
        onLoginDetected(url);
      }

      // Clear any prior blocked card when navigating to an allowed route
      if (blockedState.isBlocked) {
        setBlockedState({ isBlocked: false });
      }

      return true;
    },
    [isStoryTimeAvailable, instagramUsername, isFromDM, isFromSaved, isStoriesContext, onLoginDetected, blockedState]
  );

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);

    // If navigated to home from DM, instantly return to inbox
    if (isFromDM && (navState.url === 'https://www.instagram.com/' || navState.url === 'https://www.instagram.com/?' || navState.url.startsWith('https://www.instagram.com/?'))) {
      webViewRef.current?.injectJavaScript(`window.location.href = "${INSTAGRAM_CONFIG.DIRECT_INBOX_URL}"; true;`);
      return;
    }

    // Also check on nav state changes in case of SPA pushState transitions
    const evaluation = evaluateInstagramUrl(navState.url, {
      isStoryTimeAvailable,
      username: instagramUsername || undefined,
      isFromDM,
      isFromSaved,
      isStoriesContext,
    });

    if (!evaluation.isAllowed) {
      blockedBySpaRef.current = true;
      setBlockedState({
        isBlocked: true,
        category: evaluation.category,
        message: evaluation.blockMessage,
      });
    } else {
      blockedBySpaRef.current = false;
      if (blockedState.isBlocked) {
        setBlockedState({ isBlocked: false });
      }
      if (onLoginDetected && evaluation.category !== 'login') {
        onLoginDetected(navState.url);
      }
    }

    if (externalOnNavChange) {
      externalOnNavChange(navState);
    }
  };

  const handleReturnToAllowed = () => {
    dismissBlocked();
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]} testID={testID}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        userAgent={INSTAGRAM_CONFIG.MOBILE_CHROME_USER_AGENT}
        sharedCookiesEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        androidLayerType="hardware"
        injectedJavaScriptBeforeContentLoaded={isFromDM || isFromSaved ? `${INJECTED_INSTAGRAM_CSS}\n${SINGLE_REEL_LOCK_JS}` : INJECTED_INSTAGRAM_CSS}
        injectedJavaScript={`
          (function() {
            try {
              // Signal page ready as soon as DOM is interactive
              function notifyReady() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_READY' }));
              }
              if (document.readyState === 'interactive' || document.readyState === 'complete') {
                notifyReady();
              } else {
                document.addEventListener('DOMContentLoaded', notifyReady);
                window.addEventListener('load', notifyReady);
              }

              // In DM context, intercept any click on home links or IG logo to prevent home feed leak
              if (${isFromDM ? 'true' : 'false'}) {
                document.addEventListener('click', function(e) {
                  var a = e.target && e.target.closest ? e.target.closest('a') : null;
                  if (a) {
                    var href = a.getAttribute('href') || '';
                    if (href === '/' || href === '/?' || href.startsWith('/?') || href.includes('instagram.com/?')) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.location.pathname.indexOf('/direct/t/') !== -1) {
                        window.location.href = '/direct/inbox/';
                      }
                      return false;
                    }
                  }
                }, true);
              }

              function detectUser() {
                var links = document.querySelectorAll('a[href]');
                var username = null;
                var avatarUrl = null;
                for (var i = 0; i < links.length; i++) {
                  var h = links[i].getAttribute('href');
                  if (h && h.startsWith('/') && h.endsWith('/') && h.split('/').filter(Boolean).length === 1) {
                    var u = h.replace(/\\//g, '');
                    if (!['explore', 'direct', 'reels', 'stories', 'accounts', 'saved', 'p', 'settings', 'help', 'privacy', 'terms'].includes(u.toLowerCase())) {
                      var img = links[i].querySelector('img');
                      if (img && img.src && !img.src.includes('data:image/svg')) {
                        username = u;
                        avatarUrl = img.src;
                        break;
                      }
                      if (links[i].querySelector('svg[aria-label="Profile"]')) {
                        username = u;
                      }
                    }
                  }
                }
                if (!avatarUrl) {
                  var profileImgs = document.querySelectorAll('img[alt*="profile picture"], img[alt*="Profile picture"]');
                  if (profileImgs.length > 0 && profileImgs[0].src && !profileImgs[0].src.includes('data:image/svg')) {
                    avatarUrl = profileImgs[0].src;
                  }
                }
                if (username || avatarUrl) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'DETECTED_USER_PROFILE',
                    username: username,
                    avatarUrl: avatarUrl
                  }));
                }
              }
              setTimeout(detectUser, 800);
              setTimeout(detectUser, 2000);
              setTimeout(detectUser, 4000);
            } catch(e) {}
          })();
          true;
        `}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'PAGE_READY') {
              setIsLoading(false);
              setHasLoadedOnce(true);
            }
            if ((data.type === 'DETECTED_USERNAME' || data.type === 'DETECTED_USER_PROFILE') && (data.username || data.avatarUrl)) {
              if (data.username && onUsernameDetected) onUsernameDetected(data.username);
              useAppStore.getState().setInstagramLoggedIn(true, data.username, data.avatarUrl);
            }
          } catch {}
        }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoadEnd={() => {
          setIsLoading(false);
          setHasLoadedOnce(true);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(nativeEvent.description || 'Connection error');
        }}
        style={styles.webView}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        geolocationEnabled={false}
        mixedContentMode="never"
      />

      {/* Sleek top glowing progress bar on all loads */}
      {isLoading && (
        <View style={styles.topProgressBar} pointerEvents="none">
          <LinearGradient
            colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Initial cold load skeleton (only before first render, never blocks in-app taps) */}
      {isLoading && !hasLoadedOnce && !blockedState.isBlocked && !hasError && (
        <View style={[styles.skeletonOverlay, { backgroundColor: colors.background }]} pointerEvents="none">
          <View style={[styles.skeletonHeader, { borderBottomColor: colors.divider }]}>
            <Skeleton width={140} height={18} borderRadius={6} />
            <Skeleton width={28} height={28} borderRadius={14} />
          </View>
          <View style={styles.skeletonRows}>
            <ChatSkeletonRow />
            <ChatSkeletonRow />
            <ChatSkeletonRow />
            <ChatSkeletonRow />
            <ChatSkeletonRow />
            <ChatSkeletonRow />
          </View>
        </View>
      )}

      {/* Non-intrusive floating offline chip when cached content is already rendered */}
      {hasError && hasLoadedOnce && !blockedState.isBlocked && (
        <View style={styles.floatingOfflineChipWrap} pointerEvents="box-none">
          <GlassSurface
            useRealBlur={true}
            blurIntensity={35}
            borderRadius={20}
            elevation={4}
            style={styles.floatingOfflineChip}
          >
            <Ionicons name="cloud-offline-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[typography.captionBold, { color: colors.textPrimary, fontSize: 12 }]}>
              Offline • Showing Cached View
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 8 }}
              accessibilityLabel="Retry loading"
            >
              <Ionicons name="refresh" size={14} color={colors.accent} />
            </TouchableOpacity>
          </GlassSurface>
        </View>
      )}

      {/* Peaceful Offline Screen when cold launching offline with no prior cache */}
      {hasError && !hasLoadedOnce && !blockedState.isBlocked && (
        <View style={[styles.errorOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(245,245,247,0.92)' }]}>
          <GlassSurface
            useRealBlur={true}
            blurIntensity={isDark ? 55 : 35}
            borderRadius={24}
            elevation={isDark ? 10 : 6}
            highlightIntensity={isDark ? 0.16 : 0.08}
            style={styles.errorCard}
          >
            <LinearGradient
              colors={['rgba(55,151,240,0.20)', 'rgba(150,47,191,0.16)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.errorIconWrap}
            >
              <Ionicons name="cloud-offline-outline" size={32} color={colors.accent} />
            </LinearGradient>
            <Text
              style={[
                typography.h3,
                styles.errorTitle,
                { color: colors.textPrimary },
              ]}
            >
              Offline Peace of Mind
            </Text>
            <Text
              style={[
                typography.body,
                styles.errorDesc,
                { color: colors.textSecondary },
              ]}
            >
              No internet connection detected. Still-Gram keeps your personal notes, checklists, and saved posts ready locally without disturbances.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRetry}
              style={styles.retryOuter}
            >
              <LinearGradient
                colors={['#3797F0', '#6A53AE', '#9B33B5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryButton}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>Check Connection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassSurface>
        </View>
      )}

      {/* Blocked Doomscroll Overlay Card */}
      {blockedState.isBlocked && (
        <BlockedDoomscrollCard
          category={blockedState.category}
          customMessage={blockedState.message}
          onReturnToAllowed={handleReturnToAllowed}
          returnButtonTitle={isFromSaved ? "Return to Saved" : isStoriesContext ? "Return to Stories" : "Return to Messages"}
        />
      )}

      {/* Floating glass Back to Chat button when viewing single reel or post from DM */}
      {isFromDM && (currentUrl.includes('/reel/') || currentUrl.includes('/reels/') || currentUrl.includes('/p/') || currentUrl.includes('/tv/')) && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.floatingBackToChatBtn}
          onPress={() => {
            if (canGoBack && webViewRef.current) {
              webViewRef.current.goBack();
            } else if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`window.location.href = "${fallbackUrl}"; true;`);
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <GlassSurface
            useRealBlur={true}
            blurIntensity={45}
            borderRadius={20}
            elevation={6}
            style={styles.floatingBackToChatInner}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>Back to Chat</Text>
          </GlassSurface>
        </TouchableOpacity>
      )}

      {/* Floating glass Back to Saved button when viewing single reel or post in Saved */}
      {isFromSaved && (currentUrl.includes('/reel/') || currentUrl.includes('/reels/') || currentUrl.includes('/p/') || currentUrl.includes('/tv/')) && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.floatingBackToChatBtn}
          onPress={() => {
            if (canGoBack && webViewRef.current) {
              webViewRef.current.goBack();
            } else if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`window.location.href = "${fallbackUrl}"; true;`);
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <GlassSurface
            useRealBlur={true}
            blurIntensity={45}
            borderRadius={20}
            elevation={6}
            style={styles.floatingBackToChatInner}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>Back to Saved</Text>
          </GlassSurface>
        </TouchableOpacity>
      )}
    </View>
  );
});

InstagramWebView.displayName = 'InstagramWebView';

const styles = StyleSheet.create({
  floatingBackToChatBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 100,
  },
  floatingBackToChatInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  skeletonHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skeletonRows: {
    paddingTop: 8,
  },
  topProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    zIndex: 99,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
  },
  errorIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  retryOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#3797F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingOfflineChipWrap: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingOfflineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

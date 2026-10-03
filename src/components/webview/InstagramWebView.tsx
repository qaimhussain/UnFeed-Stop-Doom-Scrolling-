import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  const [blockedState, setBlockedState] = useState<{
    isBlocked: boolean;
    category?: string;
    message?: string;
  }>({ isBlocked: false });

  const isStoryTimeAvailable = useAppStore(
    (state) => (state.storyTimeUsage?.secondsUsed ?? 0) < 1200
  );
  const instagramUsername = useAppStore((state) => state.instagramUsername);

  // Android Back Button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (blockedState.isBlocked) {
        setBlockedState({ isBlocked: false });
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.location.href = "${fallbackUrl}"; true;`
          );
        }
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
  }, [canGoBack, blockedState, fallbackUrl, isFromDM, currentUrl]);

  // Request filter to block doomscrolling URLs before loading
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string; isTopFrame?: boolean }) => {
      const { url } = request;

      // Allow about:blank, data: and blob:
      if (
        url.startsWith('about:') ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
      ) {
        return true;
      }

      const evaluation: RouteEvaluation = evaluateInstagramUrl(url, {
        isStoryTimeAvailable,
        username: instagramUsername || undefined,
        isFromDM,
        isFromSaved,
        isStoriesContext,
      });

      if (!evaluation.isAllowed) {
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

    // Also check on nav state changes in case of SPA pushState transitions
    const evaluation = evaluateInstagramUrl(navState.url, {
      isStoryTimeAvailable,
      username: instagramUsername || undefined,
      isFromDM,
      isFromSaved,
      isStoriesContext,
    });

    if (!evaluation.isAllowed) {
      setBlockedState({
        isBlocked: true,
        category: evaluation.category,
        message: evaluation.blockMessage,
      });
    } else {
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
    setBlockedState({ isBlocked: false });
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.location.href = "${fallbackUrl}"; true;`
      );
    }
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
        cacheMode="LOAD_DEFAULT"
        androidLayerType="hardware"
        injectedJavaScriptBeforeContentLoaded={isFromDM || isFromSaved ? `${INJECTED_INSTAGRAM_CSS}\n${SINGLE_REEL_LOCK_JS}` : INJECTED_INSTAGRAM_CSS}
        injectedJavaScript={`
          (function() {
            try {
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
              setTimeout(detectUser, 1000);
              setTimeout(detectUser, 2500);
              setTimeout(detectUser, 5000);
            } catch(e) {}
          })();
          true;
        `}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
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
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(nativeEvent.description || 'Connection error');
        }}
        style={styles.webView}
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
      />

      {/* Native Skeleton / Shimmer Loader while WebView loads */}
      {isLoading && !blockedState.isBlocked && !hasError && (
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
          <View style={styles.loadingPillWrap}>
            <GlassSurface
              borderRadius={20}
              style={styles.loadingCard}
              elevation={4}
            >
              <ActivityIndicator size="small" color="#0095F6" />
              <Text
                style={[
                  typography.caption,
                  styles.loadingText,
                  { color: colors.textSecondary },
                ]}
              >
                Connecting...
              </Text>
            </GlassSurface>
          </View>
        </View>
      )}

      {/* Glass Error / Offline State */}
      {hasError && !blockedState.isBlocked && (
        <View style={[styles.errorOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.70)' : 'rgba(0,0,0,0.40)' }]}>
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
              <Ionicons name="cloud-offline-outline" size={34} color="#8E8E8E" />
            </LinearGradient>
            <Text
              style={[
                typography.h3,
                styles.errorTitle,
                { color: colors.textPrimary },
              ]}
            >
              Unable to load Instagram
            </Text>
            <Text
              style={[
                typography.body,
                styles.errorDesc,
                { color: colors.textSecondary },
              ]}
            >
              {errorMessage || 'Please check your internet connection and try again.'}
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
                <Text style={styles.retryButtonText}>Try Again</Text>
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
  loadingPillWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 13,
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
});

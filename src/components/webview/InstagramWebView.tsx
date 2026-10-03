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
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoginDetected?: (url: string) => void;
  style?: object;
  testID?: string;
}

export const InstagramWebView: React.FC<InstagramWebViewProps> = ({
  initialUrl,
  fallbackUrl = INSTAGRAM_CONFIG.DIRECT_INBOX_URL,
  onNavigationStateChange: externalOnNavChange,
  onLoginDetected,
  style,
  testID,
}) => {
  const { colors, typography, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);

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
  }, [canGoBack, blockedState, fallbackUrl]);

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
    [isStoryTimeAvailable, instagramUsername, onLoginDetected, blockedState]
  );

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);

    // Also check on nav state changes in case of SPA pushState transitions
    const evaluation = evaluateInstagramUrl(navState.url, {
      isStoryTimeAvailable,
      username: instagramUsername || undefined,
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
        injectedJavaScriptBeforeContentLoaded={INJECTED_INSTAGRAM_CSS}
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
          returnButtonTitle="Return to Messages"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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

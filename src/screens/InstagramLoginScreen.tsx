/* eslint-disable react-hooks/immutability */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';
import { StaticRadialBackground } from '../components/common/StaticRadialBackground';
import { UnfeedCrystalWordmark } from '../components/common/UnfeedCrystalWordmark';
import { PrismalLiquidGlass } from '../components/common/PrismalLiquidGlass';
import { useAppStore } from '../store/useAppStore';
import { INSTAGRAM_CONFIG } from '../config/instagramRules';

interface InstagramLoginScreenProps {
  onSuccess?: () => void;
}

interface FeatureItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  title: string;
  subtitle: string;
}

const FEATURE_ITEMS: readonly FeatureItem[] = [
  {
    id: 'always-open',
    icon: 'chatbubbles-outline',
    gradient: ['#3797F0', '#4F5BD5'],
    title: 'Always open',
    subtitle: 'your chats and saved posts, any time.',
  },
  {
    id: 'stories-moderation',
    icon: 'timer-outline',
    gradient: ['#D62976', '#962FBF'],
    title: 'Stories, in moderation',
    subtitle: '20 minutes a day.',
  },
  {
    id: 'no-feed',
    icon: 'eye-off-outline',
    gradient: ['#FA7E1E', '#D62976'],
    title: 'No feed, no reels',
    subtitle: 'nothing to scroll.',
  },
] as const;

const LOGIN_MONITOR_JS = `
  (function() {
    var observer = null;
    function getUsername() {
      try {
        if (window._sharedData && window._sharedData.config && window._sharedData.config.viewer && window._sharedData.config.viewer.username) {
          return window._sharedData.config.viewer.username;
        }
        var profileImg = document.querySelector('nav a[href^="/"] img, a[href^="/"][role="link"] img');
        if (profileImg) {
          var a = profileImg.closest('a');
          if (a && a.getAttribute('href')) {
            var parts = a.getAttribute('href').split('/').filter(Boolean);
            if (parts.length === 1 && !['explore', 'direct', 'reels', 'stories', 'accounts', 'saved'].includes(parts[0].toLowerCase())) {
              return parts[0];
            }
          }
        }
      } catch(e) {}
      return null;
    }

    function checkLogin() {
      var cookies = document.cookie || '';
      var hasSession = cookies.indexOf('sessionid=') !== -1 || cookies.indexOf('ds_user_id=') !== -1;
      var hasLogout = !!document.querySelector('a[href*="/accounts/logout"]');
      var hasDirect = !!document.querySelector('a[href*="/direct/t/"]');
      var hasHome = !!document.querySelector('svg[aria-label="Home"]') || !!document.querySelector('svg[aria-label="Direct"]');
      var username = getUsername();

      if (hasSession || hasLogout || hasDirect || hasHome) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'LOGIN_SUCCESS',
            username: username
          }));
        }
        if (observer) observer.disconnect();
      }
    }

    var timeout = null;
    function debouncedCheck() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(checkLogin, 500);
    }

    var origPush = history.pushState;
    if (origPush) {
      history.pushState = function() {
        origPush.apply(this, arguments);
        debouncedCheck();
      };
    }
    var origReplace = history.replaceState;
    if (origReplace) {
      history.replaceState = function() {
        origReplace.apply(this, arguments);
        debouncedCheck();
      };
    }

    if (window.MutationObserver && document.body) {
      observer = new MutationObserver(debouncedCheck);
      observer.observe(document.body, { childList: true, subtree: true });
    }
    debouncedCheck();
  })();
  true;
`;

export const InstagramLoginScreen: React.FC<InstagramLoginScreenProps> = ({ onSuccess }) => {
  const { width: screenWidth } = useWindowDimensions();

  // Stable Zustand action selectors (no reactive state = no extra re-renders)
  const setInstagramLoggedIn = useAppStore((state) => state.setInstagramLoggedIn);
  const setDemoMode = useAppStore((state) => state.setDemoMode);

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isLoadingWebView, setIsLoadingWebView] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const isReducedMotion = useReducedMotion();

  // ── ONE Short Entrance Animation on Screen Open ──
  // Fade and 12px rise using opacity and translateY only.
  // Each element staggered by 70ms, total under 600ms (280ms + 300ms = 580ms).
  // Plays ONCE, then everything is 100% still.
  const enter0 = useSharedValue(isReducedMotion ? 1 : 0); // Top: Wordmark + Tagline + Subtitle
  const enter1 = useSharedValue(isReducedMotion ? 1 : 0); // Feature Row 1
  const enter2 = useSharedValue(isReducedMotion ? 1 : 0); // Feature Row 2
  const enter3 = useSharedValue(isReducedMotion ? 1 : 0); // Feature Row 3
  const enter4 = useSharedValue(isReducedMotion ? 1 : 0); // Bottom: Button + Privacy text

  // Button quick spring scale on press (0.97 spring feedback)
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (isReducedMotion) {
      enter0.value = 1;
      enter1.value = 1;
      enter2.value = 1;
      enter3.value = 1;
      enter4.value = 1;
      return;
    }

    const DURATION = 300;
    const EASING = Easing.out(Easing.cubic);

    enter0.value = withDelay(0, withTiming(1, { duration: DURATION, easing: EASING }));
    enter1.value = withDelay(70, withTiming(1, { duration: DURATION, easing: EASING }));
    enter2.value = withDelay(140, withTiming(1, { duration: DURATION, easing: EASING }));
    enter3.value = withDelay(210, withTiming(1, { duration: DURATION, easing: EASING }));
    enter4.value = withDelay(280, withTiming(1, { duration: DURATION, easing: EASING }));
  }, [isReducedMotion, enter0, enter1, enter2, enter3, enter4]);

  const animStyle0 = useAnimatedStyle(() => ({
    opacity: enter0.value,
    transform: [{ translateY: interpolate(enter0.value, [0, 1], [12, 0]) }],
  }));

  const animStyle1 = useAnimatedStyle(() => ({
    opacity: enter1.value,
    transform: [{ translateY: interpolate(enter1.value, [0, 1], [12, 0]) }],
  }));

  const animStyle2 = useAnimatedStyle(() => ({
    opacity: enter2.value,
    transform: [{ translateY: interpolate(enter2.value, [0, 1], [12, 0]) }],
  }));

  const animStyle3 = useAnimatedStyle(() => ({
    opacity: enter3.value,
    transform: [{ translateY: interpolate(enter3.value, [0, 1], [12, 0]) }],
  }));

  const animStyle4 = useAnimatedStyle(() => ({
    opacity: enter4.value,
    transform: [{ translateY: interpolate(enter4.value, [0, 1], [12, 0]) }],
  }));

  const animButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
  }, [buttonScale]);

  const handleStartLogin = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setIsLoginModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsLoginModalVisible(false);
  }, []);

  const handleCompleteLogin = useCallback(async (username?: string | null) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await setDemoMode(false);
    await setInstagramLoggedIn(true, username);
    setIsLoginModalVisible(false);
    if (onSuccess) onSuccess();
  }, [onSuccess, setDemoMode, setInstagramLoggedIn]);

  const handleNavigationStateChange = useCallback(async (navState: WebViewNavigation) => {
    const { url } = navState;
    if (!url) return;

    let path = '';
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const isInstagramHost = host === 'instagram.com' || host.endsWith('.instagram.com');
      const isFacebookHost = host === 'facebook.com' || host.endsWith('.facebook.com');

      if (!isInstagramHost && !isFacebookHost) {
        return;
      }
      path = parsed.pathname;
    } catch {
      path = url;
    }
    if (!path.endsWith('/')) path = `${path}/`;

    const isStillInAuth =
      path.startsWith('/accounts/login') ||
      path.startsWith('/accounts/emailsignup') ||
      path.startsWith('/two_factor') ||
      path.startsWith('/challenge');

    const isPostLoginRoute =
      path === '/' ||
      path.startsWith('/direct/') ||
      path.startsWith('/accounts/onetap') ||
      path.includes('/saved/') ||
      (!isStillInAuth && path.length > 2);

    if (!isStillInAuth && isPostLoginRoute) {
      await handleCompleteLogin();
    }
  }, [handleCompleteLogin]);

  const contentMaxWidth = Math.min(screenWidth - 40, 380);

  return (
    <View style={styles.outer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── 1. Static Near-Black Background with Fixed Deep Violet Radial Gradient (Never Moves) ── */}
      <StaticRadialBackground />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.screenContainer}>

          {/* ── 2. Top Section: Wordmark + Tagline + Subtitle (Stagger 0) ── */}
          <Animated.View style={[styles.topSection, animStyle0]}>
            <View style={styles.wordmarkWrapper}>
              <UnfeedCrystalWordmark fontSize={62} align="center" loopShine={true} />
            </View>
            <Text style={styles.tagline}>
              Keep the people. Lose the scroll.
            </Text>
            <Text style={styles.subtitle}>
              Chats, saved posts and stories, without the endless feed.
            </Text>
          </Animated.View>

          {/* ── 3. Middle Section: Static 3 Feature Rows with Prismal Liquid Glass (Staggers 1, 2, 3) ── */}
          <View style={styles.middleSection}>
            <View style={[styles.featuresContainer, { width: contentMaxWidth }]}>
              {/* Feature Row 1 */}
              <Animated.View style={animStyle1}>
                <PrismalLiquidGlass
                  borderRadius={20}
                  accentColor={FEATURE_ITEMS[0].gradient[0]}
                  style={styles.featureCardWrapper}
                  contentStyle={styles.featureCardContent}
                >
                  <LinearGradient
                    colors={FEATURE_ITEMS[0].gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name={FEATURE_ITEMS[0].icon} size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>{FEATURE_ITEMS[0].title}</Text>
                    <Text style={styles.featureSubtitle}>{FEATURE_ITEMS[0].subtitle}</Text>
                  </View>
                </PrismalLiquidGlass>
              </Animated.View>

              {/* Feature Row 2 */}
              <Animated.View style={animStyle2}>
                <PrismalLiquidGlass
                  borderRadius={20}
                  accentColor={FEATURE_ITEMS[1].gradient[0]}
                  style={styles.featureCardWrapper}
                  contentStyle={styles.featureCardContent}
                >
                  <LinearGradient
                    colors={FEATURE_ITEMS[1].gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name={FEATURE_ITEMS[1].icon} size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>{FEATURE_ITEMS[1].title}</Text>
                    <Text style={styles.featureSubtitle}>{FEATURE_ITEMS[1].subtitle}</Text>
                  </View>
                </PrismalLiquidGlass>
              </Animated.View>

              {/* Feature Row 3 */}
              <Animated.View style={animStyle3}>
                <PrismalLiquidGlass
                  borderRadius={20}
                  accentColor={FEATURE_ITEMS[2].gradient[0]}
                  style={styles.featureCardWrapper}
                  contentStyle={styles.featureCardContent}
                >
                  <LinearGradient
                    colors={FEATURE_ITEMS[2].gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconContainer}
                  >
                    <Ionicons name={FEATURE_ITEMS[2].icon} size={22} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>{FEATURE_ITEMS[2].title}</Text>
                    <Text style={styles.featureSubtitle}>{FEATURE_ITEMS[2].subtitle}</Text>
                  </View>
                </PrismalLiquidGlass>
              </Animated.View>
            </View>
          </View>

          {/* ── 4. Bottom Section: Instagram Gradient Pill Button + Privacy Text (Stagger 4) ── */}
          <Animated.View style={[styles.bottomSection, animStyle4]}>
            <Animated.View style={[{ width: contentMaxWidth }, animButtonStyle]}>
              <Pressable
                onPress={handleStartLogin}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                style={styles.loginButton}
                accessibilityRole="button"
                accessibilityLabel="Continue with Instagram"
              >
                {/* Layer 1: Core Instagram Brand Gradient */}
                <LinearGradient
                  colors={['#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Layer 2: Prismal Specular Sheen */}
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.32)',
                    'rgba(255, 255, 255, 0.08)',
                    'rgba(255, 255, 255, 0.0)',
                  ]}
                  locations={[0, 0.35, 0.70]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                {/* Layer 3: Meniscus Top Shelf Line */}
                <View style={styles.buttonTopShelf} pointerEvents="none" />

                <View style={styles.buttonInnerRow}>
                  <Ionicons
                    name="logo-instagram"
                    size={22}
                    color="#FFFFFF"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.loginButtonText}>Continue with Instagram</Text>
                </View>
              </Pressable>
            </Animated.View>

            <Text style={styles.privacyNote}>
              {"Unfeed connects securely to Instagram's official mobile site."}{'\n'}
              We never access, intercept, or store your login credentials.
            </Text>
          </Animated.View>

        </View>
      </SafeAreaView>

      {/* ── 5. Full-Screen Instagram Login WebView Modal (Mounted ONLY when requested) ── */}
      {isLoginModalVisible && (
        <Modal
          visible={isLoginModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseModal}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  Instagram Login
                </Text>
                <View style={styles.modalLockRow}>
                  <Ionicons name="lock-closed" size={11} color="#10D070" style={{ marginRight: 4 }} />
                  <Text style={styles.modalSubtitle}>instagram.com</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.doneButton}
                onPress={() => handleCompleteLogin()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
                <Ionicons name="checkmark" size={15} color="#FFFFFF" style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>

            {/* WebView Container */}
            <View style={styles.modalBody}>
              <WebView
                ref={webViewRef}
                source={{ uri: INSTAGRAM_CONFIG.LOGIN_URL }}
                userAgent={INSTAGRAM_CONFIG.MOBILE_CHROME_USER_AGENT}
                sharedCookiesEnabled={true}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                thirdPartyCookiesEnabled={true}
                injectedJavaScript={LOGIN_MONITOR_JS}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'LOGIN_SUCCESS') {
                      const cleanUsername =
                        typeof data.username === 'string'
                          ? data.username.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30)
                          : null;
                      handleCompleteLogin(cleanUsername);
                    }
                  } catch {}
                }}
                onNavigationStateChange={handleNavigationStateChange}
                onShouldStartLoadWithRequest={(request) => {
                  try {
                    const host = new URL(request.url).hostname.toLowerCase();
                    return (
                      host === 'instagram.com' ||
                      host.endsWith('.instagram.com') ||
                      host === 'facebook.com' ||
                      host.endsWith('.facebook.com')
                    );
                  } catch {
                    return false;
                  }
                }}
                onLoadStart={() => setIsLoadingWebView(true)}
                onLoadEnd={() => setIsLoadingWebView(false)}
                style={styles.modalWebView}
                setSupportMultipleWindows={false}
                originWhitelist={['https://*.instagram.com', 'https://*.facebook.com', 'https://instagram.com', 'https://facebook.com', 'about:blank']}
                allowFileAccess={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                geolocationEnabled={false}
                mixedContentMode="never"
              />

              {isLoadingWebView && (
                <View style={styles.modalLoading} pointerEvents="none">
                  <View style={styles.modalLoadingCard}>
                    <ActivityIndicator size="small" color="#0095F6" />
                    <Text style={styles.modalLoadingText}>
                      Connecting to Instagram...
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  // ── Top Section ──
  topSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  wordmarkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.1,
    lineHeight: 18.5,
    paddingHorizontal: 12,
  },

  // ── Middle Section: 3 Static Feature Rows ──
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  featuresContainer: {
    width: '100%',
  },
  featureCardWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  featureCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  featureSubtitle: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 13.5,
    lineHeight: 18,
  },

  // ── Bottom Section ──
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 8,
    width: '100%',
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
  },
  buttonTopShelf: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  privacyNote: {
    fontSize: 12,
    lineHeight: 16.5,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    letterSpacing: 0.1,
  },

  // ── Modal Styles ──
  modalContainer: {
    flex: 1,
    backgroundColor: '#05060A',
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10D070',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#3797F0',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    position: 'relative',
  },
  modalWebView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
  },
  modalLoadingCard: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#1E202B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalLoadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

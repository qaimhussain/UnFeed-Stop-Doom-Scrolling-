import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  useReducedMotion,
  cancelAnimation,
} from 'react-native-reanimated';
import { AuroraBackground } from '../components/common/AuroraBackground';
import { CrystalGlass } from '../components/common/CrystalGlass';
import { UnfeedCrystalWordmark } from '../components/common/UnfeedCrystalWordmark';
import { WelcomeCarousel } from '../components/welcome/WelcomeCarousel';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { INSTAGRAM_CONFIG } from '../config/instagramRules';

interface InstagramLoginScreenProps {
  onSuccess?: () => void;
}

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
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const setInstagramLoggedIn = useAppStore((state) => state.setInstagramLoggedIn);
  const setDemoMode = useAppStore((state) => state.setDemoMode);

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isLoadingWebView, setIsLoadingWebView] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const isReducedMotion = useReducedMotion();

  // ── Staggered Entrance Animations (80ms spacing) ──
  const enter0 = useSharedValue(isReducedMotion ? 1 : 0); // Wordmark
  const enter1 = useSharedValue(isReducedMotion ? 1 : 0); // Headline + subtitle
  const enter2 = useSharedValue(isReducedMotion ? 1 : 0); // Cards carousel
  const enter3 = useSharedValue(isReducedMotion ? 1 : 0); // Button + privacy notice

  // Button slow specular shine sweep (every 5 seconds)
  const buttonShineX = useSharedValue(-screenWidth * 0.7);

  useEffect(() => {
    if (isReducedMotion) {
      enter0.value = 1;
      enter1.value = 1;
      enter2.value = 1;
      enter3.value = 1;
      return;
    }

    // Sequence with 80ms staggering
    enter0.value = withDelay(0, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    enter1.value = withDelay(80, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    enter2.value = withDelay(160, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    enter3.value = withDelay(240, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));

    // Button slow specular shine sweep loop
    buttonShineX.value = withRepeat(
      withSequence(
        withDelay(
          3800,
          withTiming(screenWidth * 1.5, {
            duration: 1100,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        withTiming(-screenWidth * 0.7, { duration: 0 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(buttonShineX);
    };
  }, [isReducedMotion, enter0, enter1, enter2, enter3, buttonShineX, screenWidth]);

  const animStyle0 = useAnimatedStyle(() => ({
    opacity: enter0.value,
    transform: [{ translateY: interpolate(enter0.value, [0, 1], [22, 0]) }],
  }));

  const animStyle1 = useAnimatedStyle(() => ({
    opacity: enter1.value,
    transform: [{ translateY: interpolate(enter1.value, [0, 1], [22, 0]) }],
  }));

  const animStyle2 = useAnimatedStyle(() => ({
    opacity: enter2.value,
    transform: [{ translateY: interpolate(enter2.value, [0, 1], [22, 0]) }],
  }));

  const animStyle3 = useAnimatedStyle(() => ({
    opacity: enter3.value,
    transform: [{ translateY: interpolate(enter3.value, [0, 1], [22, 0]) }],
  }));

  const animButtonShineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: buttonShineX.value },
      { rotate: '25deg' },
    ],
  }));

  const handleStartLogin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setIsLoginModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsLoginModalVisible(false);
  };

  const handleCompleteLogin = async (username?: string | null) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    await setDemoMode(false);
    await setInstagramLoggedIn(true, username);
    setIsLoginModalVisible(false);
    if (onSuccess) onSuccess();
  };

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const { url } = navState;
    if (!url) return;

    let path = '';
    try {
      path = new URL(url).pathname;
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
  };

  return (
    <View style={styles.outer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background: Smooth Soft Aurora SVG Blobs (Zero Blurry Overdraw) ── */}
      <AuroraBackground />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.screenFlexContainer}>

          {/* ── 1. Top Section (~30%): Hero & Crystal Wordmark ── */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.wordmarkWrapper, animStyle0]}>
              <UnfeedCrystalWordmark fontSize={62} align="center" loopShine={true} />
            </Animated.View>

            <Animated.View style={[styles.headerTextWrapper, animStyle1]}>
              <Text style={styles.headline}>
                Stop Procrastinating. Reclaim Your Life.
              </Text>
              <Text style={styles.subtitle}>
                Your calm companion to Instagram.
              </Text>
            </Animated.View>
          </View>

          {/* ── 2. Middle Section (~45%): Large Swipeable CrystalGlass Cards ── */}
          <Animated.View style={[styles.middleSection, animStyle2]}>
            <WelcomeCarousel paused={isLoginModalVisible} />
          </Animated.View>

          {/* ── 3. Bottom Section (~25%): Large CrystalGlass Button & Contrast Privacy ── */}
          <Animated.View style={[styles.bottomSection, animStyle3]}>
            <CrystalGlass
              borderRadius={28}
              onPress={handleStartLogin}
              style={styles.loginPillWrapper}
              contentStyle={styles.loginPillContent}
              glowColor="#9B33B5"
            >
              {/* Soft Instagram Gradient Tint Fill */}
              <LinearGradient
                colors={['#3797F0', '#6A53AE', '#9B33B5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { opacity: 0.88 }]}
                pointerEvents="none"
              />

              {/* Specular Shine Sweep across the button */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.buttonShine,
                  { width: screenWidth * 0.45, height: 120 },
                  animButtonShineStyle,
                ]}
              >
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.0)',
                    'rgba(255, 255, 255, 0.50)',
                    'rgba(255, 255, 255, 0.0)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>

              {/* Button Text & Icon */}
              <View style={styles.buttonInnerRow}>
                <Ionicons
                  name="logo-instagram"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.loginButtonText}>Continue with Instagram</Text>
              </View>
            </CrystalGlass>

            {/* High-Contrast Crisp Privacy Text */}
            <Text style={styles.privacyNote}>
              {"Unfeed connects securely to Instagram's official mobile site."}{'\n'}
              We never access, intercept, or store your login credentials.
            </Text>
          </Animated.View>

        </View>
      </SafeAreaView>

      {/* ── Full-Screen Instagram Login WebView Modal ── */}
      <Modal
        visible={isLoginModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.closeButton, { backgroundColor: isDark ? '#262626' : '#EFEFEF' }]}
              onPress={handleCloseModal}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Instagram Login
              </Text>
              <View style={styles.modalLockRow}>
                <Ionicons name="lock-closed" size={11} color="#10D070" style={{ marginRight: 4 }} />
                <Text style={[styles.modalSubtitle, { color: '#10D070' }]}>instagram.com</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.doneButton, { backgroundColor: colors.accent }]}
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
                    handleCompleteLogin(data.username);
                  }
                } catch {}
              }}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setIsLoadingWebView(true)}
              onLoadEnd={() => setIsLoadingWebView(false)}
              style={styles.modalWebView}
              setSupportMultipleWindows={false}
              originWhitelist={['*']}
              allowFileAccess={false}
              allowFileAccessFromFileURLs={false}
              allowUniversalAccessFromFileURLs={false}
              geolocationEnabled={false}
              mixedContentMode="never"
            />

            {isLoadingWebView && (
              <View style={styles.modalLoading} pointerEvents="none">
                <CrystalGlass
                  useRealBlur={true}
                  blurIntensity={30}
                  borderRadius={18}
                  style={styles.modalLoadingCard}
                >
                  <ActivityIndicator size="small" color="#0095F6" />
                  <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                    Connecting to Instagram...
                  </Text>
                </CrystalGlass>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  screenFlexContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  // ── Top Section (~30%) ──
  topSection: {
    flex: 0.32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  wordmarkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTextWrapper: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  // ── Middle Section (~45%) ──
  middleSection: {
    flex: 0.44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  // ── Bottom Section (~25%) ──
  bottomSection: {
    flex: 0.24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 8,
  },
  loginPillWrapper: {
    width: '100%',
    maxWidth: 360,
  },
  loginPillContent: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonShine: {
    position: 'absolute',
    top: -30,
    left: 0,
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
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    letterSpacing: 0.1,
  },
  // ── Modal Styles ──
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
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
  },
  modalLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  modalLoadingCard: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassSurface } from '../components/common/GlassSurface';
import { UnfeedWordmark } from '../components/common/UnfeedWordmark';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { INSTAGRAM_CONFIG } from '../config/instagramRules';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

    function notifySuccess(url) {
      if (observer) {
        try { observer.disconnect(); } catch(e) {}
        observer = null;
      }
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        var uname = getUsername();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN_SUCCESS', url: url || window.location.href, username: uname }));
      }
    }

    var checkTimer = null;
    function debouncedCheck() {
      if (checkTimer) clearTimeout(checkTimer);
      checkTimer = setTimeout(check, 250);
    }

    function check() {
      try {
        var cookies = document.cookie || '';
        var hasSession = cookies.indexOf('sessionid=') !== -1 || cookies.indexOf('ds_user_id=') !== -1;
        var url = window.location.href;
        
        var isAuthUrl = url.indexOf('/accounts/login') !== -1 ||
                        url.indexOf('/accounts/emailsignup') !== -1 ||
                        url.indexOf('/two_factor') !== -1 ||
                        url.indexOf('/challenge') !== -1;
                        
        var isPostLoginUrl = url.indexOf('/direct/') !== -1 ||
                             url.indexOf('/accounts/onetap') !== -1 ||
                             url.indexOf('/saved/') !== -1 ||
                             (url.indexOf('instagram.com') !== -1 && !isAuthUrl && url.replace('https://www.instagram.com', '').length > 1);

        var hasPostLoginElements = document.querySelector('svg[aria-label="Direct"]') ||
                                   document.querySelector('a[href*="/direct/"]') ||
                                   document.querySelector('nav[role="navigation"]') ||
                                   document.querySelector('svg[aria-label="Home"]');

        if (hasSession || (isPostLoginUrl && hasPostLoginElements)) {
          notifySuccess(url);
        }
      } catch(e) {}
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

const CAROUSEL_BENEFITS = [
  {
    icon: 'hourglass-outline',
    gradient: ['#FA7E1E', '#D62976'] as [string, string],
    title: 'Save Hours Every Day',
    desc: 'Eliminate unconscious scroll binges so you can invest time into real-world goals and focus.',
  },
  {
    icon: 'ban-outline',
    gradient: ['#D62976', '#962FBF'] as [string, string],
    title: 'Kill the Dopamine Loop',
    desc: 'No home feed, no explore traps, and no infinite reels designed to steal your attention.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    gradient: ['#3797F0', '#4F5BD5'] as [string, string],
    title: 'Essential Tools Only',
    desc: 'Answer direct messages, check friends’ stories, grab your saved notes — then get back to life.',
  },
];

export const InstagramLoginScreen: React.FC<InstagramLoginScreenProps> = ({ onSuccess }) => {
  const { colors, isDark } = useTheme();
  const setInstagramLoggedIn = useAppStore((state) => state.setInstagramLoggedIn);
  const setDemoMode = useAppStore((state) => state.setDemoMode);

  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isLoadingWebView, setIsLoadingWebView] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Floating animation for the orbs
  const [orb1Y] = useState(() => new Animated.Value(0));
  const [orb2Y] = useState(() => new Animated.Value(0));
  const [orb3Y] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const makeOrb = (anim: Animated.Value, duration: number, distance: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: distance,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      ).start();

    makeOrb(orb1Y, 5200, -18);
    makeOrb(orb2Y, 6800, 14);
    makeOrb(orb3Y, 4600, -22);
  }, []);

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

  // Dark mode: deep black + purple-blue glow like Instagram dark brand
  // Light mode: clean white + soft blue-pink blush glow
  const bgGradient: [string, string, ...string[]] = isDark
    ? ['#000000', '#090d1a', '#000000']
    : ['#FAFAFA', '#F0F4FF', '#FAFAFA'];

  const orb1Color = isDark ? 'rgba(0, 149, 246, 0.18)' : 'rgba(0, 149, 246, 0.10)';
  const orb2Color = isDark ? 'rgba(150, 47, 191, 0.14)' : 'rgba(214, 41, 118, 0.07)';
  const orb3Color = isDark ? 'rgba(79, 91, 213, 0.12)' : 'rgba(79, 91, 213, 0.06)';

  const [activeCard, setActiveCard] = useState(0);
  const [transitionAnim] = useState(() => new Animated.Value(0));
  const isTransitioning = useRef(false);

  const cycleToNextCard = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 440,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      transitionAnim.setValue(0);
      setActiveCard((prev) => (prev + 1) % CAROUSEL_BENEFITS.length);
      isTransitioning.current = false;
    });

    // Safety watchdog: guarantees isTransitioning is NEVER stuck
    setTimeout(() => {
      if (isTransitioning.current) {
        transitionAnim.setValue(0);
        setActiveCard((prev) => (prev + 1) % CAROUSEL_BENEFITS.length);
        isTransitioning.current = false;
      }
    }, 550);
  }, [transitionAnim]);

  // Automatically cycle through cards every 3.6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      cycleToNextCard();
    }, 3600);
    return () => clearInterval(timer);
  }, [cycleToNextCard]);

  return (
    <SafeAreaView style={styles.outer} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Floating glow orbs ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbBase,
          styles.orb1,
          { backgroundColor: orb1Color, transform: [{ translateY: orb1Y }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbBase,
          styles.orb2,
          { backgroundColor: orb2Color, transform: [{ translateY: orb2Y }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbBase,
          styles.orb3,
          { backgroundColor: orb3Color, transform: [{ translateY: orb3Y }] },
        ]}
      />

      {/* ── Main content ── */}
      <View style={styles.mainContent}>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <UnfeedWordmark fontSize={60} useGradient={true} align="center" style={{ marginTop: 10 }} />
          <Text style={[styles.tagline, { color: colors.textPrimary }]}>
            Stop Procrastinating. Reclaim Your Life.
          </Text>
          <Text style={[styles.subTagline, { color: colors.textSecondary }]}>
            Your calm companion to Instagram.
          </Text>
        </View>

        {/* Overlapping 3D Benefit Card Deck */}
        <View style={styles.deckSection}>
          <TouchableOpacity
            activeOpacity={0.96}
            style={styles.cardDeckContainer}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              cycleToNextCard();
            }}
          >
            {CAROUSEL_BENEFITS.map((benefit, idx) => {
              const relSlot = (idx - activeCard + CAROUSEL_BENEFITS.length) % CAROUSEL_BENEFITS.length;

              // iOS Notification Deck Spring Interpolations
              let translateY: Animated.AnimatedInterpolation<number>;
              let scale: Animated.AnimatedInterpolation<number>;
              let opacity: Animated.AnimatedInterpolation<number>;
              let contentOpacity: Animated.AnimatedInterpolation<number> | number;
              let zIndex = 1;
              let elevation = 1;

              if (relSlot === 0) {
                zIndex = 10;
                elevation = 8;
                translateY = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -36],
                });
                scale = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.0, 0.96],
                });
                opacity = transitionAnim.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [1.0, 0.2, 0.0],
                });
                contentOpacity = transitionAnim.interpolate({
                  inputRange: [0, 0.4],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                });
              } else if (relSlot === 1) {
                zIndex = 5;
                elevation = 4;
                translateY = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                });
                scale = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1.0],
                });
                opacity = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.82, 1.0],
                });
                contentOpacity = transitionAnim.interpolate({
                  inputRange: [0.35, 0.9],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                });
              } else {
                // relSlot === 2
                zIndex = 1;
                elevation = 1;
                translateY = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 15],
                });
                scale = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 0.94],
                });
                opacity = transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.52, 0.82],
                });
                contentOpacity = 0;
              }

              return (
                <Animated.View
                  key={benefit.title}
                  pointerEvents={relSlot === 0 ? 'auto' : 'none'}
                  style={[
                    styles.stackedCardWrapper,
                    {
                      zIndex,
                      elevation,
                      opacity,
                      transform: [{ translateY }, { scale }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.notificationCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(26, 28, 42, 0.82)'
                          : 'rgba(255, 255, 255, 0.86)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.16)'
                          : 'rgba(0, 0, 0, 0.08)',
                        shadowOpacity: isDark ? 0.40 : 0.10,
                      },
                    ]}
                  >
                    {/* Top specular hairline (Apple crystal gloss) */}
                    <View
                      style={[
                        styles.cardSpecularHairline,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.38)'
                            : 'rgba(255, 255, 255, 0.90)',
                        },
                      ]}
                      pointerEvents="none"
                    />

                    {/* Apple Gloss reflection gradient */}
                    <LinearGradient
                      colors={
                        isDark
                          ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']
                          : ['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.05)']
                      }
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 0.7 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />

                    {/* iOS Notification Header: App Icon + UNFEED + Timestamp */}
                    <View style={styles.notificationHeaderRow}>
                      <View style={styles.notificationHeaderLeft}>
                        <LinearGradient
                          colors={benefit.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.notificationAppIcon}
                        >
                          <Ionicons
                            name={benefit.icon as any}
                            size={13}
                            color="#FFFFFF"
                          />
                        </LinearGradient>
                        <Text
                          style={[
                            styles.notificationAppLabel,
                            { color: isDark ? 'rgba(255, 255, 255, 0.60)' : 'rgba(0, 0, 0, 0.52)' },
                          ]}
                        >
                          UNFEED
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.notificationTimeLabel,
                          { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.42)' },
                        ]}
                      >
                        {`now • 0${idx + 1}/03`}
                      </Text>
                    </View>

                    {/* Notification Content: Title & Description */}
                    <Animated.View
                      style={[
                        styles.notificationContent,
                        { opacity: contentOpacity },
                      ]}
                    >
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: isDark ? '#FFFFFF' : '#111111' },
                        ]}
                        numberOfLines={1}
                      >
                        {benefit.title}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.notificationDesc,
                          { color: isDark ? 'rgba(255, 255, 255, 0.82)' : 'rgba(0, 0, 0, 0.72)' },
                        ]}
                      >
                        {benefit.desc}
                      </Text>
                    </Animated.View>

                    {/* Peeking bottom rim accent glow */}
                    <LinearGradient
                      colors={benefit.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardBottomAccentGlow}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </TouchableOpacity>

          {/* Clean Segmented Pagination Dots */}
          <View style={styles.paginationDotsRow}>
            {CAROUSEL_BENEFITS.map((b, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeCard
                    ? [styles.activeDot, { backgroundColor: b.gradient[0] }]
                    : [
                        styles.inactiveDot,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)' },
                      ],
                ]}
              />
            ))}
          </View>
        </View>

        {/* Action button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStartLogin}
            style={styles.loginButtonWrapper}
          >
            <LinearGradient
              colors={['#3797F0', '#6A53AE', '#9B33B5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <Ionicons name="logo-instagram" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.loginButtonText}>Continue with Instagram</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.privacyNote, { color: colors.textTertiary }]}>
            {"Unfeed connects securely to Instagram's official mobile site."}{'\n'}
            We never access, intercept, or store your login credentials.
          </Text>
        </View>
      </View>

      {/* ── Full-Screen Instagram Login WebView Modal ── */}
      <Modal
        visible={isLoginModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

          {/* Modal header */}
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

          {/* WebView */}
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
                <GlassSurface
                  useRealBlur={true}
                  blurIntensity={30}
                  borderRadius={18}
                  style={styles.modalLoadingCard}
                >
                  <ActivityIndicator size="small" color="#0095F6" />
                  <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                    Connecting to Instagram...
                  </Text>
                </GlassSurface>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  // Floating orbs
  orbBase: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 280,
    height: 280,
    top: SCREEN_HEIGHT * 0.08,
    left: -60,
  },
  orb2: {
    width: 320,
    height: 320,
    top: SCREEN_HEIGHT * 0.3,
    right: -80,
  },
  orb3: {
    width: 200,
    height: 200,
    bottom: SCREEN_HEIGHT * 0.12,
    left: SCREEN_WIDTH * 0.2,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subTagline: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 16,
    letterSpacing: 0.1,
  },
  deckSection: {
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  cardDeckContainer: {
    width: '100%',
    height: 198,
    position: 'relative',
    alignItems: 'center',
  },
  stackedCardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  notificationCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 136,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  cardSpecularHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationAppIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationAppLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  notificationTimeLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  notificationContent: {
    paddingLeft: 30,
    marginTop: 2,
  },
  notificationTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  notificationDesc: {
    fontSize: 13,
    lineHeight: 18.5,
    letterSpacing: 0.1,
  },
  cardBottomAccentGlow: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  paginationDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 6,
  },
  actionSection: {
    alignItems: 'center',
    width: '100%',
  },
  loginButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    shadowColor: '#3797F0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  privacyNote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    position: 'relative',
  },
  modalWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  modalLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalLoadingText: {
    marginLeft: 12,
    fontSize: 13,
  },
});

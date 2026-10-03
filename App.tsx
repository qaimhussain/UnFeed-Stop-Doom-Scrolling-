import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState as RNAppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';
import { useAppStore } from './src/store/useAppStore';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DailyLimitReachedModal } from './src/components/focus/DailyLimitReachedModal';
import { SessionTimerReminderModal } from './src/components/focus/SessionTimerReminderModal';

export const navigationRef = createNavigationContainerRef<any>();

const AppContent: React.FC = () => {
  const { isDark, colors } = useTheme();
  const isDailyLimitReached = useAppStore((state) => state.isDailyLimitReached);
  const isSessionTimerAlertVisible = useAppStore((state) => state.isSessionTimerAlertVisible);
  const dismissDailyLimit = useAppStore((state) => state.dismissDailyLimit);
  const dismissSessionTimerAlert = useAppStore((state) => state.dismissSessionTimerAlert);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.divider,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />

      {/* Global Focus / Digital Wellbeing Modals */}
      <DailyLimitReachedModal
        visible={isDailyLimitReached}
        onDismiss={dismissDailyLimit}
      />
      <SessionTimerReminderModal
        visible={isSessionTimerAlertVisible}
        onDismiss={dismissSessionTimerAlert}
      />
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    GrandHotel_400Regular,
  });

  const initStore = useAppStore((state) => state.initStore);
  const isInitialized = useAppStore((state) => state.isInitialized);
  const themeMode = useAppStore((state) => state.focusSettings.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const tickScreenTime = useAppStore((state) => state.tickScreenTime);
  const tickStoryTime = useAppStore((state) => state.tickStoryTime);
  const pauseStoryViewingSession = useAppStore((state) => state.pauseStoryViewingSession);
  const resumeStoryViewingSession = useAppStore((state) => state.resumeStoryViewingSession);
  const saveStoryCapUsage = useAppStore((state) => state.saveStoryCapUsage);

  useEffect(() => {
    initStore();

    // Request Android notification permissions on startup
    Notifications.requestPermissionsAsync().catch(() => {});

    // App State lifecycle listener: save cap on background, refresh on active
    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        pauseStoryViewingSession();
        saveStoryCapUsage();
      } else if (nextAppState === 'active') {
        tickStoryTime();
        resumeStoryViewingSession();
      }
    });

    // Live screen-time tracker ticker: ticks every 10 seconds
    const screenInterval = setInterval(() => {
      tickScreenTime(10);
    }, 10000);

    // Live story time ticker: ticks every second
    const storyInterval = setInterval(() => {
      tickStoryTime();
    }, 1000);

    return () => {
      subscription.remove();
      clearInterval(screenInterval);
      clearInterval(storyInterval);
    };
  }, []);

  if (!isInitialized || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0095F6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider themeMode={themeMode} onThemeModeChange={setThemeMode}>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
import { useAppStore } from './src/store/useAppStore';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DailyLimitReachedModal } from './src/components/focus/DailyLimitReachedModal';
import { SessionTimerReminderModal } from './src/components/focus/SessionTimerReminderModal';
import { focusWindowService } from './src/services/focusWindowService';

export const navigationRef = createNavigationContainerRef<any>();

const AppContent: React.FC = () => {
  const { isDark, colors } = useTheme();
  const isDailyLimitReached = useAppStore((state) => state.isDailyLimitReached);
  const isSessionTimerAlertVisible = useAppStore((state) => state.isSessionTimerAlertVisible);
  const dismissDailyLimit = useAppStore((state) => state.dismissDailyLimit);
  const dismissSessionTimerAlert = useAppStore((state) => state.dismissSessionTimerAlert);
  const dailyFocusWindow = useAppStore((state) => state.dailyFocusWindow);

  // Gracefully return to Messages when window closes
  useEffect(() => {
    if (!dailyFocusWindow) return;
    const now = Date.now();
    const status = focusWindowService.getWindowStatus(dailyFocusWindow, now);
    if (status === 'passed' && navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute === 'Stories' || currentRoute === 'Saved') {
        navigationRef.navigate('MainTabs' as any, { screen: 'Messages' });
      }
    }
  }, [dailyFocusWindow]);

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
  const initStore = useAppStore((state) => state.initStore);
  const isInitialized = useAppStore((state) => state.isInitialized);
  const themeMode = useAppStore((state) => state.focusSettings.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const tickScreenTime = useAppStore((state) => state.tickScreenTime);
  const tickFocusWindow = useAppStore((state) => state.tickFocusWindow);
  const checkAndRefreshFocusWindow = useAppStore((state) => state.checkAndRefreshFocusWindow);
  const pauseStoryViewingSession = useAppStore((state) => state.pauseStoryViewingSession);
  const resumeStoryViewingSession = useAppStore((state) => state.resumeStoryViewingSession);
  const saveStoryCapUsage = useAppStore((state) => state.saveStoryCapUsage);

  useEffect(() => {
    initStore();

    // App State lifecycle listener: save cap on background, refresh on active
    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        pauseStoryViewingSession();
        saveStoryCapUsage();
      } else if (nextAppState === 'active') {
        checkAndRefreshFocusWindow();
        resumeStoryViewingSession();
      }
    });

    // Live screen-time tracker ticker: ticks every 10 seconds
    const screenInterval = setInterval(() => {
      tickScreenTime(10);
    }, 10000);

    // Live focus window & story cap ticker: ticks every second
    const focusInterval = setInterval(() => {
      tickFocusWindow();
    }, 1000);

    return () => {
      subscription.remove();
      clearInterval(screenInterval);
      clearInterval(focusInterval);
    };
  }, []);

  if (!isInitialized) {
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

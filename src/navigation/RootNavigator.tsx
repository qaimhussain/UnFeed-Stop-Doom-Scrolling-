import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { NewMessageModal } from '../screens/NewMessageModal';
import { CollectionDetailScreen } from '../screens/CollectionDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { InstagramLoginScreen } from '../screens/InstagramLoginScreen';
import { useTheme } from '../theme/ThemeContext';
import { useAppStore } from '../store/useAppStore';

export type RootStackParamList = {
  InstagramLogin: undefined;
  MainTabs: undefined;
  ChatDetail: { conversationId: string };
  NewMessage: undefined;
  CollectionDetail: { collectionId: string };
  Settings: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { colors } = useTheme();
  const isInstagramLoggedIn = useAppStore((state) => state.isInstagramLoggedIn);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const isAuthenticated = isInstagramLoggedIn || isDemoMode;

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'MainTabs' : 'InstagramLogin'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'default',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="InstagramLogin" component={InstagramLoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen
            name="ChatDetail"
            component={ChatDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="NewMessage"
            component={NewMessageModal}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="CollectionDetail"
            component={CollectionDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

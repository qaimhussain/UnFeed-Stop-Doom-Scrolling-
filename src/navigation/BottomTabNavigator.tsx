import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessagesScreen } from '../screens/MessagesScreen';
import { StoriesScreen } from '../screens/StoriesScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { FloatingGlassTabBar } from '../components/navigation/FloatingGlassTabBar';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Messages"
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Stories" component={StoriesScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
    </Tab.Navigator>
  );
};

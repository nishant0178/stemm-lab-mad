import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Leaderboard: { active: 'trophy', inactive: 'trophy-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4fc3f7',
        tabBarInactiveTintColor: '#546e7a',
        tabBarStyle: {
          backgroundColor: '#1c2e3f',
          borderTopColor: '#263d54',
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: '#0d1b2a' },
        headerTintColor: '#4fc3f7',
        headerTitleStyle: { fontWeight: '800' as const },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Activities' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}

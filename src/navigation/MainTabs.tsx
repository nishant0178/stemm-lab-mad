import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MapScreen from '../screens/MapScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Home:        { active: 'home',      inactive: 'home-outline' },
  Leaderboard: { active: 'trophy',    inactive: 'trophy-outline' },
  Map:         { active: 'map',       inactive: 'map-outline' },
  Settings:    { active: 'settings',  inactive: 'settings-outline' },
};

export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '800' as const },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Activities' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Team Map' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TeamSetupScreen from '../screens/TeamSetupScreen';
import HomeScreen from '../screens/HomeScreen';

const Placeholder = (label: string) => () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
    <Text style={{ color: '#4fc3f7', fontSize: 20 }}>{label}</Text>
  </View>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  isAuthenticated: boolean;
  hasTeam: boolean;
};

export default function RootNavigator({ isAuthenticated, hasTeam }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // ── Unauthenticated ──────────────────────────────────────────────────
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !hasTeam ? (
        // ── Authenticated, no team yet ───────────────────────────────────────
        <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
      ) : (
        // ── Authenticated + team ready ───────────────────────────────────────
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ReactionBoard" component={Placeholder('Reaction Board')} />
          <Stack.Screen name="Vibration" component={Placeholder('Vibration')} />
          <Stack.Screen name="Leaderboard" component={Placeholder('Leaderboard')} />
          <Stack.Screen name="Map" component={Placeholder('Map')} />
          <Stack.Screen name="Settings" component={Placeholder('Settings')} />
          <Stack.Screen name="Results" component={Placeholder('Results')} />
        </>
      )}
    </Stack.Navigator>
  );
}

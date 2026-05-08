import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TeamSetupScreen from '../screens/TeamSetupScreen';
import MainTabs from './MainTabs';
import ReactionBoardScreen from '../screens/activities/ReactionBoardScreen';
import VibrationScreen from '../screens/activities/VibrationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  isAuthenticated: boolean;
  hasTeam: boolean;
};

export default function RootNavigator({ isAuthenticated, hasTeam }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !hasTeam ? (
        <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="ReactionBoard"
            component={ReactionBoardScreen}
            options={{ headerShown: true, headerTitle: 'Reaction Board', headerStyle: { backgroundColor: '#0d1b2a' }, headerTintColor: '#4fc3f7' }}
          />
          <Stack.Screen
            name="Vibration"
            component={VibrationScreen}
            options={{ headerShown: true, headerTitle: 'Vibration Meter', headerStyle: { backgroundColor: '#0d1b2a' }, headerTintColor: '#a5d6a7' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

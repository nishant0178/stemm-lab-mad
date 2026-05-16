import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TeamSetupScreen from '../screens/TeamSetupScreen';
import MainTabs from './MainTabs';
import ReactionBoardScreen from '../screens/activities/ReactionBoardScreen';
import VibrationScreen from '../screens/activities/VibrationScreen';
import ParachuteScreen from '../screens/activities/ParachuteScreen';
import SoundScreen from '../screens/activities/SoundScreen';
import HandFanScreen from '../screens/activities/HandFanScreen';
import EarthquakeScreen from '../screens/activities/EarthquakeScreen';
import HumanPerformanceScreen from '../screens/activities/HumanPerformanceScreen';
import BreathingScreen from '../screens/activities/BreathingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const HEADER_OPTS = { headerStyle: { backgroundColor: '#0d1b2a' }, headerTintColor: '#4fc3f7' };

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
          <Stack.Screen name="ReactionBoard" component={ReactionBoardScreen}
            options={{ headerShown: true, headerTitle: 'Reaction Board', ...HEADER_OPTS }} />
          <Stack.Screen name="Vibration" component={VibrationScreen}
            options={{ headerShown: true, headerTitle: 'Vibration Meter', ...HEADER_OPTS, headerTintColor: '#a5d6a7' }} />
          <Stack.Screen name="ParachuteScreen" component={ParachuteScreen}
            options={{ headerShown: true, headerTitle: 'Parachute Drop', ...HEADER_OPTS }} />
          <Stack.Screen name="SoundScreen" component={SoundScreen}
            options={{ headerShown: true, headerTitle: 'Sound Pollution Hunter', ...HEADER_OPTS }} />
          <Stack.Screen name="HandFanScreen" component={HandFanScreen}
            options={{ headerShown: true, headerTitle: 'Hand Fan Challenge', ...HEADER_OPTS }} />
          <Stack.Screen name="EarthquakeScreen" component={EarthquakeScreen}
            options={{ headerShown: true, headerTitle: 'Earthquake Structure', ...HEADER_OPTS }} />
          <Stack.Screen name="HumanPerformanceScreen" component={HumanPerformanceScreen}
            options={{ headerShown: true, headerTitle: 'Human Performance', ...HEADER_OPTS }} />
          <Stack.Screen name="BreathingScreen" component={BreathingScreen}
            options={{ headerShown: true, headerTitle: 'Breathing Pace', ...HEADER_OPTS }} />
        </>
      )}
    </Stack.Navigator>
  );
}

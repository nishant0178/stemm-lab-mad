import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Placeholder screens — will be implemented in later sprints
import { View, Text } from 'react-native';
const Placeholder = (label: string) => () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
    <Text style={{ color: '#4fc3f7', fontSize: 20 }}>{label}</Text>
  </View>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

type Props = {
  isAuthenticated: boolean;
};

export default function RootNavigator({ isAuthenticated }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={Placeholder('Home')} />
          <Stack.Screen name="TeamSetup" component={Placeholder('Team Setup')} />
          <Stack.Screen name="ReactionBoard" component={Placeholder('Reaction Board')} />
          <Stack.Screen name="Vibration" component={Placeholder('Vibration')} />
          <Stack.Screen name="Leaderboard" component={Placeholder('Leaderboard')} />
          <Stack.Screen name="Map" component={Placeholder('Map')} />
          <Stack.Screen name="Settings" component={Placeholder('Settings')} />
          <Stack.Screen name="Results" component={Placeholder('Results')} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

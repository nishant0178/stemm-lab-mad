import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ISOLATION: NativeStack + plain screen — no firebase, no Login/Register
// Tests if react-native-screens crashes on its own
const Stack = createNativeStackNavigator();

const PlainScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#0d1b2a', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: '#4fc3f7', fontSize: 20 }}>NativeStack — plain screen</Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Plain" component={PlainScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

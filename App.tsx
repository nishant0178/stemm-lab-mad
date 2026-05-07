import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ISOLATION STEP 5 — NativeStackNavigator with a plain View screen (no LoginScreen)
// If error appears here → bug is in react-native-screens / NativeStack itself
// If no error → bug is inside LoginScreen.tsx content
const Stack = createNativeStackNavigator();

const PlainScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#0d1b2a', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: '#4fc3f7', fontSize: 20 }}>Step 5 — NativeStack plain screen</Text>
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

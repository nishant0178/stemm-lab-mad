import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

// ISOLATION STEP 3 — NavigationContainer wrapper only
export default function App() {
  return (
    <NavigationContainer>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
        <Text style={{ color: '#4fc3f7', fontSize: 22 }}>Step 3 — NavigationContainer</Text>
      </View>
    </NavigationContainer>
  );
}

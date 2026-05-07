import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from './src/config/firebase';

// ISOLATION STEP 2 — Firebase init + ActivityIndicator size="large"
// If error appears here → culprit is ActivityIndicator size prop or Firebase init
void auth; // ensure firebase is initialized

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color="#4fc3f7" />
    </View>
  );
}

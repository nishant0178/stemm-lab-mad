import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// ISOLATION: ActivityIndicator size="large" only — no firebase, no navigation
// Tests if the loading spinner itself is the JSI crash source
export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
      <ActivityIndicator size="large" color="#4fc3f7" />
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';

// ISOLATION TEST — strip everything to bare minimum
// If no JSI error here → bug is in Firebase / Navigation / ActivityIndicator size prop
export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
      <Text style={{ color: '#4fc3f7', fontSize: 22 }}>STEMM Lab — isolation test</Text>
    </View>
  );
}

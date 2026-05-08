import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VibrationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vibration Meter</Text>
      <Text style={styles.sub}>Coming in US-06</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#a5d6a7', marginBottom: 8 },
  sub: { fontSize: 15, color: '#546e7a' },
});

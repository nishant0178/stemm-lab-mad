import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EarthquakeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earthquake Structure</Text>
      <Text style={styles.subtitle}>From the STEMM Lab specification</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Overview</Text>
        <Text style={styles.body}>
          Design and build the tallest freestanding structure that can survive a simulated
          earthquake. The phone's accelerometer is used as the shake table — teams place their
          structure on the phone and record peak vibration magnitude at failure.
        </Text>
        <Text style={styles.body}>
          Explore how cross-bracing, base isolation, and material choice affect structural
          resilience. The winning team builds the tallest structure that survives the highest
          recorded shake intensity.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Equipment needed</Text>
        {['Marshmallows or gumdrops', 'Toothpicks or dried spaghetti', 'Ruler (to measure height)', 'Timer', 'Flat surface for build phase'].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Ionicons name="ellipse" size={6} color="#2E75B6" style={styles.bullet} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.disabledBtn} disabled>
        <Text style={styles.disabledBtnText}>Coming soon</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#2E75B6', marginBottom: 24 },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionHeading: { fontSize: 16, fontWeight: '600', color: '#2E75B6', marginBottom: 10 },
  body: { fontSize: 14, color: '#444', lineHeight: 21, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bullet: { marginRight: 10, marginTop: 1 },
  bulletText: { fontSize: 14, color: '#444', flex: 1 },
  disabledBtn: { backgroundColor: '#ccc', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  disabledBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

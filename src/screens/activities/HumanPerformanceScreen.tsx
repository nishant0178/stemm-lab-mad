import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HumanPerformanceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Human Performance</Text>
      <Text style={styles.subtitle}>From the STEMM Lab specification</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Overview</Text>
        <Text style={styles.body}>
          Investigate the effect of exercise on heart rate, breathing rate, and reaction time.
          Teams collect baseline measurements at rest, then repeat measurements immediately
          after physical activity to quantify performance changes.
        </Text>
        <Text style={styles.body}>
          Analyse how recovery time varies between team members and explore the link between
          cardiovascular fitness and cognitive performance. Use the Reaction Board module to
          capture pre- and post-exercise reaction time data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Equipment needed</Text>
        {['Stopwatch or timer', 'Heart rate monitor (optional)', 'STEMM Lab Reaction Board', 'Data recording sheet', 'Space for light exercise'].map((item) => (
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

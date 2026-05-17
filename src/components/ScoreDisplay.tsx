import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  value: string | number;
  unit?: string;
  label?: string;
};

export default function ScoreDisplay({ value, unit, label }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.value}>{value}</Text>
        {unit != null && unit !== '' && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {label != null && label !== '' && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  value: { fontSize: 72, fontWeight: 'bold', color: '#ffffff' },
  unit: { fontSize: 20, color: '#90a4ae', marginBottom: 12, marginLeft: 4 },
  label: { fontSize: 14, color: '#666666', marginTop: 4, textAlign: 'center' },
});

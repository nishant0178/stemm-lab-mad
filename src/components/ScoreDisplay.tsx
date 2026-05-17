import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/spacing';

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
  container: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  value: {
    ...typography.scoreLarge,
    color: colors.accent,
  },
  unit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 14,
    marginLeft: spacing.xs,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

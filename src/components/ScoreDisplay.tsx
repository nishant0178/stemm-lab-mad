import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  value: string | number;
  unit?: string;
  label?: string;
};

export default function ScoreDisplay({ value, unit, label }: Props) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: { alignItems: 'center', marginVertical: spacing.lg },
    row: { flexDirection: 'row', alignItems: 'flex-end' },
    value: { ...typography.scoreLarge, color: colors.accent },
    unit: {
      fontSize: 18, fontWeight: '500' as const, color: colors.textSecondary,
      marginBottom: 14, marginLeft: spacing.xs,
    },
    label: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  });

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

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/spacing';

const SEVERITY_COLORS: Record<string, string> = {
  excellent: colors.success,
  safe: colors.success,
  graceful: colors.success,
  normal: colors.success,
  good: colors.info,
  smooth: colors.info,
  fair: colors.warning,
  rough: colors.warning,
  caution: colors.warning,
  elevated: colors.warning,
  some: colors.warning,
  poor: colors.danger,
  jerky: colors.danger,
  warning: colors.danger,
  danger: colors.danger,
  high: colors.danger,
  none: colors.danger,
  low: colors.lightBlue,
};

type Props = { label: string; severity: string };

export default function ResultBadge({ label, severity }: Props) {
  const bg = SEVERITY_COLORS[severity] ?? colors.info;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

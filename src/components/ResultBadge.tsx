import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../theme/spacing';

type BadgeConfig = {
  outer: string;
  inner: string;
  border: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const SEVERITY_CONFIG: Record<string, BadgeConfig> = {
  excellent: { outer: '#14532d', inner: '#22c55e', border: '#16a34a', icon: 'checkmark-circle-outline' },
  safe:      { outer: '#14532d', inner: '#22c55e', border: '#16a34a', icon: 'checkmark-circle-outline' },
  graceful:  { outer: '#14532d', inner: '#22c55e', border: '#16a34a', icon: 'checkmark-circle-outline' },
  normal:    { outer: '#14532d', inner: '#22c55e', border: '#16a34a', icon: 'checkmark-circle-outline' },
  good:      { outer: '#1e3a8a', inner: '#3b82f6', border: '#2563eb', icon: 'checkmark-circle-outline' },
  smooth:    { outer: '#1e3a8a', inner: '#3b82f6', border: '#2563eb', icon: 'checkmark-circle-outline' },
  fair:      { outer: '#78350f', inner: '#f59e0b', border: '#d97706', icon: 'warning-outline' },
  rough:     { outer: '#78350f', inner: '#f59e0b', border: '#d97706', icon: 'warning-outline' },
  caution:   { outer: '#78350f', inner: '#f59e0b', border: '#d97706', icon: 'warning-outline' },
  elevated:  { outer: '#78350f', inner: '#f59e0b', border: '#d97706', icon: 'warning-outline' },
  some:      { outer: '#78350f', inner: '#f59e0b', border: '#d97706', icon: 'warning-outline' },
  poor:      { outer: '#7f1d1d', inner: '#ef4444', border: '#dc2626', icon: 'alert-circle-outline' },
  jerky:     { outer: '#7f1d1d', inner: '#ef4444', border: '#dc2626', icon: 'alert-circle-outline' },
  warning:   { outer: '#7f1d1d', inner: '#ef4444', border: '#dc2626', icon: 'alert-circle-outline' },
  danger:    { outer: '#7f1d1d', inner: '#ef4444', border: '#dc2626', icon: 'alert-circle-outline' },
  high:      { outer: '#7f1d1d', inner: '#ef4444', border: '#dc2626', icon: 'alert-circle-outline' },
  none:      { outer: '#7f1d1d', inner: '#ef4444', border: '#dc2626', icon: 'alert-circle-outline' },
  low:       { outer: '#0c4a6e', inner: '#03A9F4', border: '#0284c7', icon: 'information-circle-outline' },
};

const FALLBACK: BadgeConfig = {
  outer: '#1e3a8a', inner: '#3b82f6', border: '#2563eb', icon: 'information-circle-outline',
};

type Props = { label: string; severity: string };

export default function ResultBadge({ label, severity }: Props) {
  const cfg = SEVERITY_CONFIG[severity] ?? FALLBACK;
  return (
    <View style={[styles.outer, { backgroundColor: cfg.outer, borderColor: cfg.border }]}>
      <View style={[styles.inner, { backgroundColor: cfg.inner }]}>
        <Ionicons name={cfg.icon} size={16} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 2,
    alignSelf: 'stretch',
    marginVertical: spacing.sm,
  },
  inner: {
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: spacing.sm },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

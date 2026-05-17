import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/spacing';

type Props = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  subtitle?: string;
};

export default function ActivityHeader({ title, icon, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(79, 195, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/spacing';

type Props = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  subtitle?: string;
};

export default function ActivityHeader({ title, icon, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center', lineHeight: 20 },
});

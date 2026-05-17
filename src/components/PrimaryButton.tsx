import React from 'react';
import {
  ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle,
} from 'react-native';
import { radius, shadow } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function PrimaryButton({
  title, onPress, disabled = false, loading = false, style,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const styles = StyleSheet.create({
    btn: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.md,
      alignItems: 'center',
      alignSelf: 'stretch',
      shadowColor: shadow.button.shadowColor,
      shadowOpacity: shadow.button.shadowOpacity,
      shadowRadius: shadow.button.shadowRadius,
      shadowOffset: shadow.button.shadowOffset,
      elevation: shadow.button.elevation,
    },
    disabled: { backgroundColor: colors.textMuted, shadowOpacity: 0, elevation: 0 },
    text: { color: '#fff', fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.2 },
  });

  return (
    <TouchableOpacity
      style={[styles.btn, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

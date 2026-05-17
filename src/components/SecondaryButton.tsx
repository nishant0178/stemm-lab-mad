import React from 'react';
import {
  ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle,
} from 'react-native';
import { colors } from '../theme/spacing';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function SecondaryButton({
  title, onPress, disabled = false, loading = false, style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.btn, isDisabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={colors.primary} size="small" />
        : <Text style={[styles.text, isDisabled && styles.textDisabled]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  btnDisabled: { borderColor: '#ccc' },
  text: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  textDisabled: { color: '#ccc' },
});

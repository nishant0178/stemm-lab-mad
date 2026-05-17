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

export default function PrimaryButton({
  title, onPress, disabled = false, loading = false, style,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.btn, isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  disabled: { backgroundColor: '#ccc' },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

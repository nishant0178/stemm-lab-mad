import React from 'react';
import {
  ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle,
} from 'react-native';
import { colors, radius, shadow } from '../theme/spacing';

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
      activeOpacity={0.85}
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
  disabled: {
    backgroundColor: '#37474f',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

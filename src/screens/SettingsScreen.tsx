import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Battery from 'expo-battery';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import {
  getBatteryLevel,
  getBatteryState,
  subscribeBatteryUpdates,
  batteryStateLabel,
  batteryStateIcon,
} from '../services/battery';
import { scheduleLeaderboardNotification } from '../services/notifications';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/spacing';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { team, setTeam } = useTeamStore();

  const [batteryLevel, setBatteryLevel] = useState<number>(-1);
  const [batteryState, setBatteryState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [level, state] = await Promise.all([getBatteryLevel(), getBatteryState()]);
      if (!cancelled) {
        setBatteryLevel(level);
        setBatteryState(state);
      }
    })();
    const unsubscribe = subscribeBatteryUpdates(({ level, state }) => {
      if (level !== undefined) setBatteryLevel(level);
      if (state !== undefined) setBatteryState(state);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setTeam(null);
    await signOut(auth);
  };

  const batteryPercent = batteryLevel >= 0 ? Math.round(batteryLevel * 100) : null;
  const isLow = batteryPercent !== null && batteryPercent < 20;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.xl, paddingTop: spacing.lg },
    card: {
      backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
      marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    label: {
      fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' as const,
      letterSpacing: 0.8, marginBottom: 4,
    },
    value: { fontSize: 16, color: colors.text, fontWeight: '600' as const },
    member: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
    batteryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    batteryIcon: { marginRight: 6 },
    batteryValue: { fontSize: 16, color: colors.accent, fontWeight: '600' as const },
    batteryLow: { color: colors.danger },
    batteryState: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    lowWarning: { fontSize: 13, color: colors.danger, fontWeight: '600' as const, marginTop: 6 },
    unavailable: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    testBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md,
      paddingVertical: 14, borderWidth: 1, borderColor: colors.success,
    },
    testBtnIcon: { marginRight: 8 },
    testBtnText: { color: colors.success, fontWeight: '700' as const, fontSize: 15 },
    signOutBtn: { backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
    signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Team</Text>
        <Text style={styles.value}>{team?.name ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Year Level</Text>
        <Text style={styles.value}>{team?.yearLevel ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Members</Text>
        {team?.members.map((m, i) => (
          <Text key={i} style={styles.member}>· {m}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Device Status</Text>
        {batteryPercent === null ? (
          <Text style={styles.unavailable}>Battery info unavailable on this platform</Text>
        ) : (
          <>
            <View style={styles.batteryRow}>
              <Ionicons
                name={batteryStateIcon(batteryState) as any}
                size={18}
                color={isLow ? colors.danger : colors.accent}
                style={styles.batteryIcon}
              />
              <Text style={[styles.batteryValue, isLow && styles.batteryLow]}>
                Battery: {batteryPercent}%
              </Text>
            </View>
            <Text style={styles.batteryState}>{batteryStateLabel(batteryState)}</Text>
            {isLow && <Text style={styles.lowWarning}>Low battery — plug in soon</Text>}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.testBtn}
        onPress={() => scheduleLeaderboardNotification('Team Avengers', 234)}
      >
        <Ionicons name="notifications-outline" size={16} color={colors.success} style={styles.testBtnIcon} />
        <Text style={styles.testBtnText}>Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

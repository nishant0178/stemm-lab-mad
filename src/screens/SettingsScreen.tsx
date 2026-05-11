import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

export default function SettingsScreen() {
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

  return (
    <View style={styles.container}>
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
                color={isLow ? '#ef5350' : '#4fc3f7'}
                style={styles.batteryIcon}
              />
              <Text style={[styles.batteryValue, isLow && styles.batteryLow]}>
                Battery: {batteryPercent}%
              </Text>
            </View>
            <Text style={styles.batteryState}>{batteryStateLabel(batteryState)}</Text>
            {isLow && (
              <Text style={styles.lowWarning}>Low battery — plug in soon</Text>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    padding: 24,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#1c2e3f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#263d54',
  },
  label: {
    fontSize: 11,
    color: '#546e7a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  member: {
    fontSize: 15,
    color: '#90a4ae',
    marginTop: 2,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  batteryIcon: {
    marginRight: 6,
  },
  batteryValue: {
    fontSize: 16,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  batteryLow: {
    color: '#ef5350',
  },
  batteryState: {
    fontSize: 13,
    color: '#90a4ae',
    marginTop: 4,
  },
  lowWarning: {
    fontSize: 13,
    color: '#ef5350',
    fontWeight: '600',
    marginTop: 6,
  },
  unavailable: {
    fontSize: 14,
    color: '#546e7a',
    marginTop: 4,
  },
  signOutBtn: {
    marginTop: 12,
    backgroundColor: '#e57373',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

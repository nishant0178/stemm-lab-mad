import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const { team, setTeam } = useTeamStore();

  const handleSignOut = async () => {
    setTeam(null);
    await signOut(auth);
  };

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

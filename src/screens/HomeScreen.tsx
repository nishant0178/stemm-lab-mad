import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { team, setTeam } = useTeamStore();

  const handleSignOut = async () => {
    setTeam(null);
    await signOut(auth);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>STEMM Lab</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.teamCard}>
        <Text style={styles.teamLabel}>Your Team</Text>
        <Text style={styles.teamName}>{team?.name ?? '—'}</Text>
        <Text style={styles.teamMeta}>{team?.yearLevel}</Text>
        <Text style={styles.teamMembers}>
          {team?.members.join(' · ') ?? ''}
        </Text>
      </View>

      <Text style={styles.coming}>Activities coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4fc3f7',
  },
  signOut: {
    color: '#e57373',
    fontSize: 14,
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#1c2e3f',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#263d54',
    marginBottom: 32,
  },
  teamLabel: {
    fontSize: 11,
    color: '#546e7a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  teamName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  teamMeta: {
    fontSize: 13,
    color: '#4fc3f7',
    marginBottom: 8,
  },
  teamMembers: {
    fontSize: 13,
    color: '#90a4ae',
  },
  coming: {
    color: '#546e7a',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});

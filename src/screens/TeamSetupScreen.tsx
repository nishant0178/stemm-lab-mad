import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createTeam } from '../services/firestore';
import { useAuthStore } from '../store/authStore';
import { useTeamStore } from '../store/teamStore';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamSetup'>;

const YEAR_LEVELS = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];
const MAX_MEMBERS = 4;

export default function TeamSetupScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { setTeam } = useTeamStore();

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [yearLevel, setYearLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    if (members.length < MAX_MEMBERS) setMembers([...members, '']);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (text: string, index: number) => {
    const updated = [...members];
    updated[index] = text;
    setMembers(updated);
  };

  const handleSubmit = async () => {
    const trimmedName = teamName.trim();
    const validMembers = members.map((m) => m.trim()).filter(Boolean);

    if (!trimmedName) {
      Alert.alert('Validation', 'Team name is required.');
      return;
    }
    if (trimmedName.length > 40) {
      Alert.alert('Validation', 'Team name must be 40 characters or fewer.');
      return;
    }
    if (validMembers.length === 0) {
      Alert.alert('Validation', 'Add at least one team member.');
      return;
    }
    if (!yearLevel) {
      Alert.alert('Validation', 'Please select a year level.');
      return;
    }

    setLoading(true);
    try {
      const team = await createTeam({
        name: trimmedName,
        members: validMembers,
        yearLevel,
        createdBy: user!.uid,
      });
      setTeam(team); // triggers conditional re-render in RootNavigator → Home
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Team Setup</Text>
      <Text style={styles.subtitle}>Set up your team before you start</Text>

      {/* Team Name */}
      <Text style={styles.label}>Team Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. The Rocket Scientists"
        placeholderTextColor="#888"
        maxLength={40}
        value={teamName}
        onChangeText={setTeamName}
      />
      <Text style={styles.charCount}>{teamName.length}/40</Text>

      {/* Year Level */}
      <Text style={styles.label}>Year Level</Text>
      <View style={styles.yearGrid}>
        {YEAR_LEVELS.map((yr) => (
          <TouchableOpacity
            key={yr}
            style={[styles.yearChip, yearLevel === yr && styles.yearChipSelected]}
            onPress={() => setYearLevel(yr)}
          >
            <Text style={[styles.yearChipText, yearLevel === yr && styles.yearChipTextSelected]}>
              {yr}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Members */}
      <Text style={styles.label}>Team Members (max {MAX_MEMBERS})</Text>
      {members.map((name, index) => (
        <View key={index} style={styles.memberRow}>
          <TextInput
            style={[styles.input, styles.memberInput]}
            placeholder={`Member ${index + 1} first name`}
            placeholderTextColor="#888"
            value={name}
            onChangeText={(text) => updateMember(text, index)}
          />
          {members.length > 1 && (
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeMember(index)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {members.length < MAX_MEMBERS && (
        <TouchableOpacity style={styles.addBtn} onPress={addMember}>
          <Text style={styles.addBtnText}>+ Add Member</Text>
        </TouchableOpacity>
      )}

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0d1b2a" />
        ) : (
          <Text style={styles.submitBtnText}>Create Team</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#4fc3f7',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#90a4ae',
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#90a4ae',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1c2e3f',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#263d54',
  },
  charCount: {
    color: '#546e7a',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1c2e3f',
    borderWidth: 1,
    borderColor: '#263d54',
  },
  yearChipSelected: {
    backgroundColor: '#4fc3f7',
    borderColor: '#4fc3f7',
  },
  yearChipText: {
    color: '#90a4ae',
    fontSize: 14,
    fontWeight: '600',
  },
  yearChipTextSelected: {
    color: '#0d1b2a',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  memberInput: {
    flex: 1,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1c2e3f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e57373',
  },
  removeBtnText: {
    color: '#e57373',
    fontSize: 14,
    fontWeight: '700',
  },
  addBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4fc3f7',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: '#4fc3f7',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: '#4fc3f7',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0d1b2a',
    fontSize: 16,
    fontWeight: '700',
  },
});

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
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamSetup'>;

const YEAR_LEVELS = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];
const MAX_MEMBERS = 4;

export default function TeamSetupScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
      setTeam(team);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    title: { fontSize: 30, fontWeight: '800' as const, color: colors.accent, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 28 },
    label: {
      fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary,
      textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8, marginTop: 20,
    },
    input: {
      backgroundColor: colors.inputBg,
      color: colors.text,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    charCount: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 4 },
    yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    yearChip: {
      paddingHorizontal: spacing.lg, paddingVertical: 10,
      borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    yearChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    yearChipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' as const },
    yearChipTextSelected: { color: '#fff' },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    memberInput: { flex: 1 },
    removeBtn: {
      width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.danger,
    },
    removeBtnText: { color: colors.danger, fontSize: 14, fontWeight: '700' as const },
    addBtn: {
      paddingVertical: 12, borderRadius: radius.md, borderWidth: 1,
      borderColor: colors.primary, borderStyle: 'dashed', alignItems: 'center', marginTop: 4,
    },
    addBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' as const },
    submitBtn: {
      marginTop: 32, backgroundColor: colors.primary, borderRadius: radius.md,
      paddingVertical: 15, alignItems: 'center',
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Team Setup</Text>
      <Text style={styles.subtitle}>Set up your team before you start</Text>

      <Text style={styles.label}>Team Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. The Rocket Scientists"
        placeholderTextColor={colors.textMuted}
        maxLength={40}
        value={teamName}
        onChangeText={setTeamName}
      />
      <Text style={styles.charCount}>{teamName.length}/40</Text>

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

      <Text style={styles.label}>Team Members (max {MAX_MEMBERS})</Text>
      {members.map((name, index) => (
        <View key={index} style={styles.memberRow}>
          <TextInput
            style={[styles.input, styles.memberInput]}
            placeholder={`Member ${index + 1} first name`}
            placeholderTextColor={colors.textMuted}
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

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Create Team</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

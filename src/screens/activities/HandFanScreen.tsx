import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveHandFanScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import {
  FanMaterial,
  degreesToRadians,
  getStiffnessCoefficient,
  calculateForce,
  compareTrials,
} from '../../lib/handFan';
import { HandFanTrial } from '../../types';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/spacing';

type MaterialOption = { key: FanMaterial; label: string };

const MATERIALS: MaterialOption[] = [
  { key: 'printer', label: 'Thin paper' },
  { key: 'cardstock', label: 'Card stock' },
  { key: 'thinCardboard', label: 'Thin cardboard' },
  { key: 'corrugated', label: 'Corrugated cardboard' },
];

const QUICK_DISTANCES = ['15', '30', '45'];

function isValidPositive(s: string): boolean {
  const n = parseFloat(s);
  return !isNaN(n) && isFinite(n) && n > 0;
}

export default function HandFanScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [material, setMaterial] = useState<FanMaterial | null>(null);
  const [designName, setDesignName] = useState('');
  const [distance, setDistance] = useState('');
  const [angle, setAngle] = useState('');
  const [trials, setTrials] = useState<HandFanTrial[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const canLogTrial =
    material !== null &&
    designName.trim().length > 0 &&
    isValidPositive(distance) &&
    isValidPositive(angle);

  function logTrial() {
    if (!material || !canLogTrial) return;
    const dist = parseFloat(distance);
    const deg = parseFloat(angle);
    const k = getStiffnessCoefficient(material);
    const rad = degreesToRadians(deg);
    const force = calculateForce(k, rad);
    setTrials((prev) => [
      ...prev,
      { designName: designName.trim(), distanceCm: dist, angleDegrees: deg, force },
    ]);
    setDesignName('');
    setDistance('');
    setAngle('');
  }

  async function handleSave() {
    if (!user || !team || !material || trials.length === 0) return;
    setSaving(true);
    try {
      await saveHandFanScore({
        teamId: team.id,
        userId: user.uid,
        activity: 'handFan',
        material,
        trials,
      });
      await saveScoreLocally('handFan', trials.length);
      try { await captureAndSaveTeamLocation(team.id); } catch {}
      setSaved(true);
    } catch (err) {
      console.error('[HandFanScreen] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setMaterial(null);
    setDesignName('');
    setDistance('');
    setAngle('');
    setTrials([]);
    setSaved(false);
  }

  const summary = compareTrials(trials);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
    section: {
      backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
      marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
    },
    sectionTitle: { ...typography.bodySemi, color: colors.accent, marginBottom: spacing.lg },
    sectionTitleRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: spacing.lg,
    },
    clearText: { ...typography.caption, color: colors.danger },
    chipRow: { gap: spacing.sm, paddingBottom: spacing.xs },
    chip: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.background,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' as const },
    chipTextSelected: { color: '#fff', fontWeight: '700' as const },
    kLabel: { ...typography.caption, color: colors.accent, marginTop: spacing.md },
    inputLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
      borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11,
      color: colors.text, fontSize: 15, marginBottom: spacing.lg,
    },
    inputFocused: { borderWidth: 1.5, borderColor: colors.primary },
    quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    quickBtn: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
      paddingVertical: 5, paddingHorizontal: spacing.lg, backgroundColor: colors.background,
    },
    quickBtnText: { ...typography.caption, color: colors.textSecondary },
    quickBtnTextActive: { color: colors.accent, fontWeight: '700' as const },
    trialCard: {
      backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md,
      marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    trialHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    trialName: { ...typography.bodySemi, color: colors.text, flex: 1 },
    trialForce: { ...typography.bodySemi, color: colors.accent },
    trialMeta: { ...typography.caption, color: colors.textSecondary },
    summaryBox: {
      backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md,
      marginTop: spacing.xs, alignItems: 'center',
    },
    summaryText: { ...typography.caption, color: colors.textSecondary },
    summaryValue: { color: colors.primary, fontWeight: '700' as const },
    savedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    savedText: { color: colors.success, fontWeight: '700' as const, fontSize: 16, flex: 1 },
    newActivityBtn: { alignSelf: 'auto', flex: 0, paddingHorizontal: spacing.lg },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      <ActivityHeader title="Hand Fan Challenge" icon="leaf-outline" />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select your test material</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {MATERIALS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.chip, material === m.key && styles.chipSelected]}
              onPress={() => { setMaterial(m.key); setSaved(false); }}
            >
              <Text style={[styles.chipText, material === m.key && styles.chipTextSelected]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {material && (
          <Text style={styles.kLabel}>
            Stiffness coefficient: k = {getStiffnessCoefficient(material).toFixed(2)} N/rad
          </Text>
        )}
      </View>

      {material && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log a Trial</Text>

          <Text style={styles.inputLabel}>Design name</Text>
          <TextInput
            style={[styles.input, focusedField === 'designName' && styles.inputFocused]}
            placeholder="e.g. 1cm folds"
            placeholderTextColor={colors.textMuted}
            value={designName}
            onChangeText={setDesignName}
            onFocus={() => setFocusedField('designName')}
            onBlur={() => setFocusedField(null)}
            returnKeyType="next"
          />

          <Text style={styles.inputLabel}>Fan distance (cm)</Text>
          <View style={styles.quickRow}>
            {QUICK_DISTANCES.map((d) => (
              <TouchableOpacity key={d} style={styles.quickBtn} onPress={() => setDistance(d)}>
                <Text style={[styles.quickBtnText, distance === d && styles.quickBtnTextActive]}>
                  {d} cm
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, focusedField === 'distance' && styles.inputFocused]}
            placeholder="or type a value"
            placeholderTextColor={colors.textMuted}
            value={distance}
            onChangeText={setDistance}
            onFocus={() => setFocusedField('distance')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
          />

          <Text style={styles.inputLabel}>Observed bend angle (°)</Text>
          <TextInput
            style={[styles.input, focusedField === 'angle' && styles.inputFocused]}
            placeholder="e.g. 30"
            placeholderTextColor={colors.textMuted}
            value={angle}
            onChangeText={setAngle}
            onFocus={() => setFocusedField('angle')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
          />

          <PrimaryButton title="Log Trial" onPress={logTrial} disabled={!canLogTrial} />
        </View>
      )}

      {trials.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Trials Logged ({trials.length})</Text>
            <TouchableOpacity onPress={() => { setTrials([]); setSaved(false); }}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          {trials.map((t, i) => (
            <View key={i} style={styles.trialCard}>
              <View style={styles.trialHeader}>
                <Text style={styles.trialName}>{t.designName}</Text>
                <Text style={styles.trialForce}>{t.force.toFixed(4)} N</Text>
              </View>
              <Text style={styles.trialMeta}>
                {t.distanceCm} cm · {t.angleDegrees}°
              </Text>
            </View>
          ))}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Max: <Text style={styles.summaryValue}>{summary.maxForce.toFixed(4)} N</Text>
              {'  |  '}
              Min: <Text style={styles.summaryValue}>{summary.minForce.toFixed(4)} N</Text>
              {'  |  '}
              Avg: <Text style={styles.summaryValue}>{summary.averageForce.toFixed(4)} N</Text>
            </Text>
          </View>
        </View>
      )}

      {saved ? (
        <View style={styles.savedRow}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={styles.savedText}>Saved!</Text>
          <SecondaryButton title="Start New Activity" onPress={reset} style={styles.newActivityBtn} />
        </View>
      ) : (
        <PrimaryButton
          title={saving ? 'Saving…' : 'Save Activity'}
          onPress={handleSave}
          loading={saving}
          disabled={trials.length === 0 || !user || !team}
        />
      )}
    </ScrollView>
  );
}

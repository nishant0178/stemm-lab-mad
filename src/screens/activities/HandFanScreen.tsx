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
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [material, setMaterial] = useState<FanMaterial | null>(null);
  const [designName, setDesignName] = useState('');
  const [distance, setDistance] = useState('');
  const [angle, setAngle] = useState('');
  const [trials, setTrials] = useState<HandFanTrial[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
  const selectedMaterialOpt = MATERIALS.find((m) => m.key === material);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      <ActivityHeader title="Hand Fan Challenge" icon="leaf-outline" />

      {/* Material selector */}
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

      {/* Trial input — only once material is selected */}
      {material && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log a Trial</Text>

          <Text style={styles.inputLabel}>Design name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1cm folds"
            placeholderTextColor="#546e7a"
            value={designName}
            onChangeText={setDesignName}
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
            style={styles.input}
            placeholder="or type a value"
            placeholderTextColor="#546e7a"
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
          />

          <Text style={styles.inputLabel}>Observed bend angle (°)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 30"
            placeholderTextColor="#546e7a"
            value={angle}
            onChangeText={setAngle}
            keyboardType="decimal-pad"
          />

          <PrimaryButton title="Log Trial" onPress={logTrial} disabled={!canLogTrial} />
        </View>
      )}

      {/* Trials logged */}
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

      {/* Save activity */}
      {saved ? (
        <View style={styles.savedRow}>
          <Ionicons name="checkmark-circle" size={22} color="#388e3c" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  content: { padding: 20, paddingBottom: 48 },
  section: {
    backgroundColor: '#1c2e3f', borderRadius: 14, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#263d54',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#4fc3f7', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  clearText: { fontSize: 13, color: '#ef5350' },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    borderWidth: 1, borderColor: '#263d54', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#0d1b2a',
  },
  chipSelected: { backgroundColor: '#2E75B6', borderColor: '#2E75B6' },
  chipText: { color: '#90a4ae', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  kLabel: { fontSize: 13, color: '#4fc3f7', marginTop: 10 },
  inputLabel: {
    fontSize: 12, fontWeight: '600', color: '#546e7a', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#0d1b2a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff', fontSize: 15, marginBottom: 14,
  },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quickBtn: {
    borderWidth: 1, borderColor: '#263d54', borderRadius: 16,
    paddingVertical: 5, paddingHorizontal: 14, backgroundColor: '#0d1b2a',
  },
  quickBtnText: { color: '#546e7a', fontSize: 13 },
  quickBtnTextActive: { color: '#4fc3f7', fontWeight: '700' },
  trialCard: {
    backgroundColor: '#0d1b2a', borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#263d54',
  },
  trialHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  trialName: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1 },
  trialForce: { fontSize: 14, fontWeight: '700', color: '#4fc3f7' },
  trialMeta: { fontSize: 12, color: '#546e7a' },
  summaryBox: {
    backgroundColor: '#0d1b2a', borderRadius: 10, padding: 12,
    marginTop: 4, alignItems: 'center',
  },
  summaryText: { fontSize: 13, color: '#90a4ae' },
  summaryValue: { color: '#2E75B6', fontWeight: '700' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savedText: { color: '#388e3c', fontWeight: '700', fontSize: 16, flex: 1 },
  newActivityBtn: { alignSelf: 'auto', flex: 0, paddingHorizontal: 16 },
});

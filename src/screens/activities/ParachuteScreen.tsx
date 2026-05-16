import React, { useRef, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveParachuteScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import {
  calculateFinalVelocity,
  calculateAcceleration,
  calculateWeight,
  calculateNetForce,
  calculateDragForce,
  calculateGForce,
  categoriseParachute,
} from '../../lib/parachute';

const SEVERITY_COLORS: Record<string, string> = {
  excellent: '#2e7d32',
  good: '#1565c0',
  some: '#e65100',
  none: '#b71c1c',
};

function isValidPositive(s: string): boolean {
  const n = parseFloat(s);
  return !isNaN(n) && isFinite(n) && n > 0;
}

type Results = {
  finalVelocity: number;
  acceleration: number;
  weight: number;
  netForce: number;
  dragForce: number;
  gForce?: number;
};

export default function ParachuteScreen() {
  const { user } = useAuthStore();
  const { team } = useTeamStore();
  const scrollRef = useRef<ScrollView>(null);
  const resultsRef = useRef<View>(null);

  const [designName, setDesignName] = useState('');
  const [height, setHeight] = useState('');
  const [fallTime, setFallTime] = useState('');
  const [mass, setMass] = useState('0.20');
  const [contactTime, setContactTime] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const allRequiredValid =
    designName.trim().length > 0 &&
    isValidPositive(height) &&
    isValidPositive(fallTime) &&
    isValidPositive(mass);

  const contactTimeValid = contactTime === '' || isValidPositive(contactTime);

  const canCalculate = allRequiredValid && contactTimeValid;

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function calculate() {
    const h = parseFloat(height);
    const t = parseFloat(fallTime);
    const m = parseFloat(mass);
    const ct = contactTime !== '' ? parseFloat(contactTime) : null;

    const v = calculateFinalVelocity(h, t);
    const a = calculateAcceleration(v, t);
    const w = calculateWeight(m);
    const nf = calculateNetForce(m, a);
    const df = calculateDragForce(w, nf);
    const gf = ct != null && ct > 0 ? calculateGForce(v, ct) : undefined;

    setResults({ finalVelocity: v, acceleration: a, weight: w, netForce: nf, dragForce: df, gForce: gf });
    setSaved(false);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  async function handleSave() {
    if (!user || !team || !results) return;
    setSaving(true);
    try {
      await saveParachuteScore({
        teamId: team.id,
        userId: user.uid,
        activity: 'parachute',
        designName: designName.trim(),
        height: parseFloat(height),
        fallTime: parseFloat(fallTime),
        mass: parseFloat(mass),
        finalVelocity: results.finalVelocity,
        acceleration: results.acceleration,
        dragForce: results.dragForce,
        ...(results.gForce != null ? { gForce: results.gForce } : {}),
      });
      await saveScoreLocally('parachute', Math.round(results.finalVelocity * 1000));
      try { await captureAndSaveTeamLocation(team.id); } catch {}
      setSaved(true);
    } catch (err) {
      console.error('[ParachuteScreen] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDesignName('');
    setHeight('');
    setFallTime('');
    setMass('0.20');
    setContactTime('');
    setTouched({});
    setResults(null);
    setSaved(false);
  }

  const category = results ? categoriseParachute(results.weight, results.dragForce) : null;

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="airplane-outline" size={32} color="#2E75B6" />
        <Text style={styles.headerTitle}>Parachute Drop Challenge</Text>
      </View>

      {/* Inputs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Drop Test</Text>

        <Field label="Design name *" error={touched.designName && !designName.trim() ? 'Required' : ''}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Plastic 4-corner parachute"
            placeholderTextColor="#94a3b8"
            value={designName}
            onChangeText={setDesignName}
            onBlur={() => touch('designName')}
            returnKeyType="next"
          />
        </Field>

        <Field label="Drop height (m) *"
          error={touched.height && !isValidPositive(height) ? 'Must be a positive number' : ''}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2.0"
            placeholderTextColor="#94a3b8"
            value={height}
            onChangeText={setHeight}
            onBlur={() => touch('height')}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Fall time (s) *"
          error={touched.fallTime && !isValidPositive(fallTime) ? 'Must be a positive number' : ''}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1.2"
            placeholderTextColor="#94a3b8"
            value={fallTime}
            onChangeText={setFallTime}
            onBlur={() => touch('fallTime')}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Toy mass (kg) *"
          error={touched.mass && !isValidPositive(mass) ? 'Must be a positive number' : ''}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0.20"
            placeholderTextColor="#94a3b8"
            value={mass}
            onChangeText={setMass}
            onBlur={() => touch('mass')}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field label="Contact time (s) — optional"
          error={touched.contactTime && contactTime !== '' && !isValidPositive(contactTime)
            ? 'Must be a positive number' : ''}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0.05"
            placeholderTextColor="#94a3b8"
            value={contactTime}
            onChangeText={setContactTime}
            onBlur={() => touch('contactTime')}
            keyboardType="decimal-pad"
          />
        </Field>

        <TouchableOpacity
          style={[styles.calcBtn, !canCalculate && styles.calcBtnDisabled]}
          onPress={calculate}
          disabled={!canCalculate}
        >
          <Text style={styles.calcBtnText}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {results && category && (
        <View ref={resultsRef} style={styles.section}>
          <Text style={styles.sectionTitle}>Results — "{designName.trim()}"</Text>

          {[
            { label: 'Final velocity', value: results.finalVelocity, unit: 'm/s' },
            { label: 'Acceleration', value: results.acceleration, unit: 'm/s²' },
            { label: 'Weight', value: results.weight, unit: 'N' },
            { label: 'Net force', value: results.netForce, unit: 'N' },
            { label: 'Drag force', value: results.dragForce, unit: 'N' },
            ...(results.gForce != null
              ? [{ label: 'G-force', value: results.gForce, unit: 'g' }]
              : []),
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.resultRow, i < arr.length - 1 && styles.resultDivider]}>
              <Text style={styles.resultLabel}>{row.label}</Text>
              <Text style={styles.resultValue}>
                {row.value.toFixed(2)}{' '}
                <Text style={styles.resultUnit}>{row.unit}</Text>
              </Text>
            </View>
          ))}

          <View style={[styles.badge, { backgroundColor: SEVERITY_COLORS[category.severity] }]}>
            <Text style={styles.badgeText}>{category.label}</Text>
          </View>

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={20} color="#388e3c" />
              <Text style={styles.savedText}>Saved!</Text>
              <TouchableOpacity style={styles.newTestBtn} onPress={reset}>
                <Text style={styles.newTestBtnText}>New Test</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving || !user || !team}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Result'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Field({
  label, error, children,
}: {
  label: string; error: string; children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 },
  error: { fontSize: 12, color: '#dc2626', marginTop: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  content: { padding: 20, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1 },
  section: {
    backgroundColor: '#1c2e3f', borderRadius: 14, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: '#263d54',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#4fc3f7',
    marginBottom: 16, letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#0d1b2a', borderWidth: 1, borderColor: '#334155',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff', fontSize: 15,
  },
  calcBtn: {
    backgroundColor: '#2E75B6', borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 6,
  },
  calcBtnDisabled: { backgroundColor: '#37474f' },
  calcBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  resultDivider: { borderBottomWidth: 1, borderBottomColor: '#263d54' },
  resultLabel: { fontSize: 14, color: '#90a4ae' },
  resultValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  resultUnit: { fontSize: 13, fontWeight: '400', color: '#546e7a' },
  badge: {
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16,
    marginTop: 16, alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  saveBtn: {
    backgroundColor: '#2E75B6', borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  savedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  savedText: { color: '#388e3c', fontWeight: '700', fontSize: 15, flex: 1 },
  newTestBtn: {
    borderWidth: 1, borderColor: '#2E75B6', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  newTestBtnText: { color: '#2E75B6', fontWeight: '700', fontSize: 14 },
});

import React, { useRef, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
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
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ResultBadge from '../../components/ResultBadge';
import { colors, spacing, radius, typography } from '../../theme/spacing';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

      <ActivityHeader title="Parachute Drop Challenge" icon="airplane-outline" />

      {/* Inputs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Drop Test</Text>

        <Field
          label="Design name *"
          error={touched.designName && !designName.trim() ? 'Required' : ''}
        >
          <TextInput
            style={[styles.input, focusedField === 'designName' && styles.inputFocused]}
            placeholder="e.g. Plastic 4-corner parachute"
            placeholderTextColor={colors.textMuted}
            value={designName}
            onChangeText={setDesignName}
            onFocus={() => setFocusedField('designName')}
            onBlur={() => { touch('designName'); setFocusedField(null); }}
            returnKeyType="next"
          />
        </Field>

        <Field
          label="Drop height (m) *"
          error={touched.height && !isValidPositive(height) ? 'Must be a positive number' : ''}
        >
          <TextInput
            style={[styles.input, focusedField === 'height' && styles.inputFocused]}
            placeholder="e.g. 2.0"
            placeholderTextColor={colors.textMuted}
            value={height}
            onChangeText={setHeight}
            onFocus={() => setFocusedField('height')}
            onBlur={() => { touch('height'); setFocusedField(null); }}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field
          label="Fall time (s) *"
          error={touched.fallTime && !isValidPositive(fallTime) ? 'Must be a positive number' : ''}
        >
          <TextInput
            style={[styles.input, focusedField === 'fallTime' && styles.inputFocused]}
            placeholder="e.g. 1.2"
            placeholderTextColor={colors.textMuted}
            value={fallTime}
            onChangeText={setFallTime}
            onFocus={() => setFocusedField('fallTime')}
            onBlur={() => { touch('fallTime'); setFocusedField(null); }}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field
          label="Toy mass (kg) *"
          error={touched.mass && !isValidPositive(mass) ? 'Must be a positive number' : ''}
        >
          <TextInput
            style={[styles.input, focusedField === 'mass' && styles.inputFocused]}
            placeholder="e.g. 0.20"
            placeholderTextColor={colors.textMuted}
            value={mass}
            onChangeText={setMass}
            onFocus={() => setFocusedField('mass')}
            onBlur={() => { touch('mass'); setFocusedField(null); }}
            keyboardType="decimal-pad"
          />
        </Field>

        <Field
          label="Contact time (s) — optional"
          error={touched.contactTime && contactTime !== '' && !isValidPositive(contactTime)
            ? 'Must be a positive number' : ''}
        >
          <TextInput
            style={[styles.input, focusedField === 'contactTime' && styles.inputFocused]}
            placeholder="e.g. 0.05"
            placeholderTextColor={colors.textMuted}
            value={contactTime}
            onChangeText={setContactTime}
            onFocus={() => setFocusedField('contactTime')}
            onBlur={() => { touch('contactTime'); setFocusedField(null); }}
            keyboardType="decimal-pad"
          />
        </Field>

        <PrimaryButton title="Calculate" onPress={calculate} disabled={!canCalculate} />
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

          <View style={styles.badgeWrap}>
            <ResultBadge label={category.label} severity={category.severity} />
          </View>

          {saved ? (
            <View style={styles.savedRow}>
              <Text style={styles.savedText}>Saved!</Text>
              <SecondaryButton title="New Test" onPress={reset} style={styles.newTestBtn} />
            </View>
          ) : (
            <PrimaryButton
              title={saving ? 'Saving…' : 'Save Result'}
              onPress={handleSave}
              loading={saving}
              disabled={!user || !team}
              style={styles.saveBtn}
            />
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
  wrap: { marginBottom: spacing.lg },
  label: { ...typography.caption, marginBottom: spacing.xs },
  error: { fontSize: 12, color: colors.danger, marginTop: spacing.xs },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.bodySemi,
    color: colors.accent,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 11,
    color: colors.text, fontSize: 15,
  },
  inputFocused: { borderWidth: 1.5, borderColor: colors.primary },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: spacing.md,
  },
  resultDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resultLabel: { ...typography.caption },
  resultValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  resultUnit: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  badgeWrap: { marginTop: spacing.md },
  saveBtn: { marginTop: spacing.lg },
  savedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm },
  savedText: { color: colors.success, fontWeight: '700', fontSize: 15, flex: 1 },
  newTestBtn: { alignSelf: 'auto', flex: 0, paddingHorizontal: 20 },
});

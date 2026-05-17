import React, { useEffect, useRef, useState } from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveEarthquakeScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import { calculateStabilityScore, categoriseStability } from '../../lib/earthquake';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ResultBadge from '../../components/ResultBadge';
import ScoreDisplay from '../../components/ScoreDisplay';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/spacing';

const DURATION_S = 5;
const SAMPLE_INTERVAL_MS = 50;

type Sample = { x: number; y: number; z: number };
type Phase = 'idle' | 'recording' | 'result';

export default function EarthquakeScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [designName, setDesignName] = useState('');
  const [countdown, setCountdown] = useState(DURATION_S);
  const [liveMag, setLiveMag] = useState(0);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const samplesRef = useRef<Sample[]>([]);
  const subRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const designRef = useRef(designName);
  designRef.current = designName;

  useEffect(() => () => cleanup(), []);

  function cleanup() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    subRef.current?.remove();
    subRef.current = null;
  }

  function startRecording() {
    samplesRef.current = [];
    setCountdown(DURATION_S);
    setSaved(false);
    setPhase('recording');

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    subRef.current = Accelerometer.addListener(({ x, y, z }) => {
      samplesRef.current.push({ x, y, z });
      const mag = Math.sqrt(x * x + y * y + (z - 1) * (z - 1));
      setLiveMag(parseFloat(mag.toFixed(3)));
    });

    let elapsed = 0;
    countdownRef.current = setInterval(() => {
      elapsed += 1;
      setCountdown(DURATION_S - elapsed);
      if (elapsed >= DURATION_S) finishRecording();
    }, 1000);
  }

  function finishRecording() {
    cleanup();
    const result = calculateStabilityScore(samplesRef.current);
    setScore(result);
    setPhase('result');
  }

  async function handleSave() {
    if (!user || !team) return;
    setSaving(true);
    try {
      await saveEarthquakeScore({
        teamId: team.id,
        userId: user.uid,
        activity: 'earthquake',
        stabilityScore: score,
        designName: designRef.current,
      });
      await saveScoreLocally('earthquake', score);
      try { await captureAndSaveTeamLocation(team.id); } catch {}
      setSaved(true);
    } catch (err) {
      console.error('[EarthquakeScreen] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    cleanup();
    setPhase('idle');
    setDesignName('');
    setCountdown(DURATION_S);
    setLiveMag(0);
    setScore(0);
    setSaved(false);
  }

  const styles = StyleSheet.create({
    center: {
      flex: 1, backgroundColor: colors.background, alignItems: 'center',
      justifyContent: 'center', padding: spacing.xxl,
    },
    fallbackTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
    fallbackSub: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    idleContent: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl, alignItems: 'center' },
    inputLabel: { ...typography.label, color: colors.textMuted, alignSelf: 'flex-start', marginBottom: spacing.sm },
    input: {
      backgroundColor: colors.inputBg, borderRadius: radius.md, borderWidth: 1,
      borderColor: colors.border, color: colors.text, fontSize: 15,
      paddingHorizontal: spacing.lg, paddingVertical: 12, alignSelf: 'stretch', marginBottom: spacing.xl,
    },
    inputFocused: { borderWidth: 1.5, borderColor: colors.primary },
    countdown: { fontSize: 64, fontWeight: '800' as const, color: colors.accent, marginTop: spacing.md, lineHeight: 72 },
    recordingLabel: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
    magValue: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'], marginBottom: spacing.xxl },
    stopBtn: { alignSelf: 'center', paddingHorizontal: 28 },
    resultContent: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl, alignItems: 'center' },
    resultHeading: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
    designLabel: { ...typography.caption, color: colors.accent, marginBottom: spacing.sm, fontStyle: 'italic' },
    scaleBox: {
      backgroundColor: colors.surfaceLight, borderRadius: radius.lg, padding: spacing.lg,
      alignSelf: 'stretch', marginTop: spacing.lg, marginBottom: spacing.xxl,
      borderWidth: 1, borderColor: colors.border,
    },
    scaleHeading: { ...typography.label, color: colors.textMuted, marginBottom: spacing.md },
    scaleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.md },
    scaleText: { ...typography.caption, color: colors.textSecondary },
    btnRow: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
    btnFlex: { flex: 1 },
  });

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Ionicons name="phone-portrait-outline" size={64} color={colors.textMuted} />
        <Text style={styles.fallbackTitle}>Mobile only</Text>
        <Text style={styles.fallbackSub}>
          Accelerometer required.{'\n'}Open the app on your phone.
        </Text>
      </View>
    );
  }

  if (phase === 'idle') {
    return (
      <ScrollView contentContainerStyle={styles.idleContent}>
        <ActivityHeader
          title="Earthquake Structure Test"
          icon="business-outline"
          subtitle="Build a structure, place the phone on top, and test how well it absorbs vibrations."
        />

        <Text style={styles.inputLabel}>Design name</Text>
        <TextInput
          style={[styles.input, focusedField === 'designName' && styles.inputFocused]}
          placeholder="e.g. 4 folds + 4 pillars"
          placeholderTextColor={colors.textMuted}
          value={designName}
          onChangeText={setDesignName}
          onFocus={() => setFocusedField('designName')}
          onBlur={() => setFocusedField(null)}
          returnKeyType="done"
        />

        <PrimaryButton title="Start Test" onPress={startRecording} disabled={!designName.trim()} />
      </ScrollView>
    );
  }

  if (phase === 'recording') {
    return (
      <View style={styles.center}>
        <Ionicons name="pulse-outline" size={56} color={colors.accent} />
        <Text style={styles.countdown}>{countdown}s</Text>
        <Text style={styles.recordingLabel}>Recording vibrations...</Text>
        <Text style={styles.magValue}>Magnitude {liveMag.toFixed(3)}g</Text>
        <SecondaryButton title="Stop Early" onPress={finishRecording} style={styles.stopBtn} />
      </View>
    );
  }

  const category = categoriseStability(score);

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Test complete</Text>
      <Text style={styles.designLabel}>"{designName}"</Text>

      <ScoreDisplay value={score} label="stability score / 100" />

      <ResultBadge label={category.label} severity={category.severity} />

      <View style={styles.scaleBox}>
        <Text style={styles.scaleHeading}>Score scale</Text>
        {[
          { range: '80–100', label: 'Excellent — minimal motion', color: '#22c55e' },
          { range: '60–79', label: 'Good — small movement', color: '#3b82f6' },
          { range: '40–59', label: 'Fair — noticeable movement', color: '#f59e0b' },
          { range: '0–39', label: 'Poor — significant movement', color: '#ef4444' },
        ].map((r) => (
          <View key={r.range} style={styles.scaleRow}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={styles.scaleText}>{r.range} — {r.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.btnRow}>
        <SecondaryButton title="Try Another Design" onPress={reset} style={styles.btnFlex} />
        <PrimaryButton
          title={saved ? 'Saved ✓' : 'Save Result'}
          onPress={handleSave}
          loading={saving}
          disabled={saved}
          style={styles.btnFlex}
        />
      </View>
    </ScrollView>
  );
}

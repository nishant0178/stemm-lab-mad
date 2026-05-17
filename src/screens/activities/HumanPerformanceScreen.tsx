import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveHumanPerformanceScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import { calculateSmoothnessScore, categoriseSmoothness } from '../../lib/humanPerformance';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ResultBadge from '../../components/ResultBadge';
import ScoreDisplay from '../../components/ScoreDisplay';
import { colors, spacing, radius, typography } from '../../theme/spacing';

const DURATION_S = 8;
const SAMPLE_INTERVAL_MS = 50;

const MOVEMENTS = ['Arm Stretch', 'Reach Up', 'Side to Side'] as const;
type Movement = typeof MOVEMENTS[number];

type Sample = { x: number; y: number; z: number };
type Phase = 'idle' | 'recording' | 'result';

export default function HumanPerformanceScreen() {
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [movement, setMovement] = useState<Movement | null>(null);
  const [countdown, setCountdown] = useState(DURATION_S);
  const [liveMag, setLiveMag] = useState(0);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const samplesRef = useRef<Sample[]>([]);
  const subRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barAnim = useRef(new Animated.Value(0)).current;

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
      const mag = Math.sqrt(x * x + y * y + z * z);
      setLiveMag(mag);
      Animated.spring(barAnim, {
        toValue: Math.min(1, mag / 3),
        useNativeDriver: false,
        speed: 60,
        bounciness: 0,
      }).start();
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
    const result = calculateSmoothnessScore(samplesRef.current);
    setScore(result);
    setPhase('result');
  }

  async function handleSave() {
    if (!user || !team || !movement) return;
    setSaving(true);
    try {
      await saveHumanPerformanceScore({
        teamId: team.id,
        userId: user.uid,
        activity: 'humanPerformance',
        smoothnessScore: score,
        movementType: movement,
      });
      await saveScoreLocally('humanPerformance', score);
      try { await captureAndSaveTeamLocation(team.id); } catch {}
      setSaved(true);
    } catch (err) {
      console.error('[HumanPerformanceScreen] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    cleanup();
    setPhase('idle');
    setCountdown(DURATION_S);
    setLiveMag(0);
    setScore(0);
    setSaved(false);
    barAnim.setValue(0);
    // keep movement selection
  }

  // ── Web fallback ──────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Ionicons name="phone-portrait-outline" size={64} color={colors.textMuted} />
        <Text style={styles.fallbackTitle}>Mobile only</Text>
        <Text style={styles.fallbackSub}>
          Accelerometer required for this activity.{'\n'}
          Open the app on your phone to use Human Performance Lab.
        </Text>
      </View>
    );
  }

  // ── Idle ──────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <ScrollView contentContainerStyle={styles.idleContent}>
        <ActivityHeader
          title="Human Performance Lab"
          icon="body-outline"
          subtitle="Measure the smoothness and control of your movement."
        />

        <Text style={styles.selectorLabel}>Select movement</Text>
        <View style={styles.chipRow}>
          {MOVEMENTS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, movement === m && styles.chipSelected]}
              onPress={() => setMovement(m)}
            >
              <Text style={[styles.chipText, movement === m && styles.chipTextSelected]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.instruction}>
          Hold the phone firmly in your dominant hand.{'\n'}Move slowly and smoothly.
        </Text>

        <PrimaryButton
          title="Start Recording"
          onPress={startRecording}
          disabled={!movement}
        />
      </ScrollView>
    );
  }

  // ── Recording ─────────────────────────────────────────────────────────────────
  if (phase === 'recording') {
    const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <View style={styles.center}>
        <Text style={styles.countdown}>{countdown}s</Text>
        <Text style={styles.recordingLabel}>Move slowly and smoothly...</Text>

        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.magValue}>{liveMag.toFixed(3)}g</Text>

        <SecondaryButton title="Stop Early" onPress={finishRecording} style={styles.stopBtn} />
      </View>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  const category = categoriseSmoothness(score);

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Movement complete</Text>
      <Text style={styles.movementLabel}>{movement}</Text>

      <ScoreDisplay value={score} label="smoothness score / 100" />

      <ResultBadge label={category.label} severity={category.severity} />

      <View style={styles.scaleBox}>
        <Text style={styles.scaleHeading}>Score scale</Text>
        {[
          { range: '80–100', label: 'Graceful — excellent control', color: '#22c55e' },
          { range: '60–79', label: 'Smooth — good control', color: '#3b82f6' },
          { range: '40–59', label: 'Rough — uneven motion', color: '#f59e0b' },
          { range: '0–39', label: 'Jerky — try slower next time', color: '#ef4444' },
        ].map((r) => (
          <View key={r.range} style={styles.scaleRow}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={styles.scaleText}>{r.range} — {r.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.btnRow}>
        <SecondaryButton title="Try Again" onPress={reset} style={styles.btnFlex} />
        <PrimaryButton
          title={saved ? 'Saved ✓' : 'Save Score'}
          onPress={handleSave}
          loading={saving}
          disabled={saved}
          style={styles.btnFlex}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: colors.background, alignItems: 'center',
    justifyContent: 'center', padding: spacing.xxl,
  },
  fallbackTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  fallbackSub: { ...typography.caption, textAlign: 'center', lineHeight: 22 },
  idleContent: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl, alignItems: 'center' },
  selectorLabel: { ...typography.label, alignSelf: 'flex-start', marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl, alignSelf: 'stretch' },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.full,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: colors.text, fontWeight: '700' },
  instruction: { ...typography.caption, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xxl },
  countdown: { fontSize: 64, fontWeight: '800', color: colors.accent, lineHeight: 72 },
  recordingLabel: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xl },
  barTrack: {
    width: '100%', height: 12, backgroundColor: colors.surface,
    borderRadius: radius.sm, overflow: 'hidden', marginBottom: spacing.sm,
  },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.sm },
  magValue: { ...typography.caption, marginBottom: spacing.xxl },
  stopBtn: { alignSelf: 'center', paddingHorizontal: 28 },
  resultContent: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xl, alignItems: 'center' },
  resultHeading: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
  movementLabel: { ...typography.caption, color: colors.accent, marginBottom: spacing.sm, fontStyle: 'italic' },
  scaleBox: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.lg, padding: spacing.lg,
    alignSelf: 'stretch', marginTop: spacing.lg, marginBottom: spacing.xxl,
    borderWidth: 1, borderColor: colors.border,
  },
  scaleHeading: { ...typography.label, marginBottom: spacing.md },
  scaleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.md },
  scaleText: { ...typography.caption },
  btnRow: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  btnFlex: { flex: 1 },
});

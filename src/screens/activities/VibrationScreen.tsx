import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { calculateMagnitude, calculateMotionScore, describeScore } from '../../lib/vibration';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveVibrationScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ScoreDisplay from '../../components/ScoreDisplay';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/spacing';

type Phase = 'idle' | 'recording' | 'result';

const RECORD_DURATION = 10;

export default function VibrationScreen() {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(RECORD_DURATION);
  const [liveReading, setLiveReading] = useState({ x: 0, y: 0, z: 0 });
  const [motionScore, setMotionScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { bestVibrationScore, setBestVibrationScore } = useGameStore();
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const samplesRef = useRef<number[]>([]);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopRecording(), [stopRecording]);

  const startRecording = () => {
    samplesRef.current = [];
    setCountdown(RECORD_DURATION);
    setLiveReading({ x: 0, y: 0, z: 0 });
    setPhase('recording');

    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      setLiveReading({ x, y, z });
      samplesRef.current.push(calculateMagnitude(x, y, z));
    });

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    stopTimerRef.current = setTimeout(() => {
      stopRecording();
      const score = calculateMotionScore(samplesRef.current);
      setMotionScore(score);
      setBestVibrationScore(score);
      setPhase('result');
    }, RECORD_DURATION * 1000);
  };

  const reset = () => {
    setPhase('idle');
    setMotionScore(null);
    setSaved(false);
    setCountdown(RECORD_DURATION);
  };

  async function handleSave() {
    if (!user || !team || motionScore === null) return;
    setSaving(true);
    try {
      await saveVibrationScore({
        teamId: team.id,
        userId: user.uid,
        activity: 'vibration',
        motionScore,
      });
      saveScoreLocally('vibration', motionScore).catch(
        (e) => console.warn('[VibrationScreen] local cache save failed:', e),
      );
      try {
        await captureAndSaveTeamLocation(team.id);
      } catch (err) {
        console.warn('[location] failed:', err);
      }
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Could not save score. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const bgColor = phase === 'recording' ? '#0a2e0a' : colors.background;

  const styles = StyleSheet.create({
    screen: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
    best: { ...typography.caption, color: '#a5d6a7', marginBottom: spacing.xl, textAlign: 'center' },
    countdownLabel: { fontSize: 20, fontWeight: '600' as const, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.sm },
    countdown: { fontSize: 96, fontWeight: '900' as const, color: '#a5d6a7', lineHeight: 104 },
    countdownSub: { ...typography.caption, color: 'rgba(255,255,255,0.5)', marginBottom: spacing.xxl },
    readingsBox: {
      backgroundColor: colors.surfaceLight, borderRadius: radius.lg,
      paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,
      alignItems: 'center', minWidth: 180, borderWidth: 1, borderColor: colors.border,
    },
    readingsTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.md },
    readingRow: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginBottom: spacing.xs, width: 120 },
    readingVal: { color: '#a5d6a7', fontWeight: '700' as const },
    resultDesc: { fontSize: 22, fontWeight: '700' as const, color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
    btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, alignSelf: 'stretch' },
    btnFlex: { flex: 1 },
  });

  return (
    <View style={[styles.screen, { backgroundColor: bgColor }]}>
      {phase === 'idle' && (
        <View style={styles.center}>
          <ActivityHeader
            title="Steadiness Challenge"
            icon="phone-portrait-outline"
            subtitle="Hold the phone perfectly still for 10 seconds. Lower score = steadier."
          />
          {bestVibrationScore !== null && (
            <Text style={styles.best}>Session best: {bestVibrationScore}</Text>
          )}
          <PrimaryButton title="Tap to Start" onPress={startRecording} />
        </View>
      )}

      {phase === 'recording' && (
        <View style={styles.center}>
          <Text style={styles.countdownLabel}>Hold steady…</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={styles.countdownSub}>seconds remaining</Text>
          <View style={styles.readingsBox}>
            <Text style={styles.readingsTitle}>Live accelerometer</Text>
            <Text style={styles.readingRow}>x  <Text style={styles.readingVal}>{liveReading.x.toFixed(3)}</Text></Text>
            <Text style={styles.readingRow}>y  <Text style={styles.readingVal}>{liveReading.y.toFixed(3)}</Text></Text>
            <Text style={styles.readingRow}>z  <Text style={styles.readingVal}>{liveReading.z.toFixed(3)}</Text></Text>
          </View>
        </View>
      )}

      {phase === 'result' && motionScore !== null && (
        <View style={styles.center}>
          <ScoreDisplay value={motionScore} label="Motion Score" />
          <Text style={styles.resultDesc}>{describeScore(motionScore)}</Text>
          {bestVibrationScore !== null && (
            <Text style={styles.best}>Session best: {bestVibrationScore}</Text>
          )}
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
        </View>
      )}
    </View>
  );
}

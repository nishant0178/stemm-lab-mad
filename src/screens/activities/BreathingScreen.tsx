import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveBreathingScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import { detectPeaks, calculateBreathsPerMinute, categoriseBreathingRate } from '../../lib/breathing';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ResultBadge from '../../components/ResultBadge';
import ScoreDisplay from '../../components/ScoreDisplay';

const DURATION_S = 30;
const SAMPLE_INTERVAL_MS = 50;

type Phase = 'idle' | 'recording' | 'result';

export default function BreathingScreen() {
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(DURATION_S);
  const [liveZ, setLiveZ] = useState(0);
  const [bpm, setBpm] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const samplesRef = useRef<number[]>([]);
  const subRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => cleanup();
  }, []);

  function cleanup() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    subRef.current?.remove();
    subRef.current = null;
  }

  function triggerPulse() {
    Animated.sequence([
      Animated.spring(pulseAnim, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  }

  function startRecording() {
    samplesRef.current = [];
    setCountdown(DURATION_S);
    setSaved(false);
    setPhase('recording');

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    subRef.current = Accelerometer.addListener(({ z }) => {
      samplesRef.current.push(z);
      setLiveZ(parseFloat(z.toFixed(3)));
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
    const zSamples = samplesRef.current;
    const peaks = detectPeaks(zSamples, 0.1);
    const result = calculateBreathsPerMinute(peaks, DURATION_S);
    setBpm(result);
    setPhase('result');
  }

  async function handleSave() {
    if (!user || !team) return;
    setSaving(true);
    try {
      await saveBreathingScore({ teamId: team.id, userId: user.uid, activity: 'breathing', breathsPerMinute: bpm });
      await saveScoreLocally('breathing', bpm);
      try { await captureAndSaveTeamLocation(team.id); } catch {}
      setSaved(true);
    } catch (err) {
      console.error('[BreathingScreen] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    cleanup();
    setPhase('idle');
    setLiveZ(0);
    setCountdown(DURATION_S);
    setBpm(0);
    setSaved(false);
  }

  // ── Web fallback ──────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Ionicons name="phone-portrait-outline" size={64} color="#546e7a" />
        <Text style={styles.fallbackTitle}>Mobile only</Text>
        <Text style={styles.fallbackSub}>
          Accelerometer required.{'\n'}Open the app on your phone.
        </Text>
      </View>
    );
  }

  // ── Idle ──────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <View style={styles.center}>
        <ActivityHeader
          title="Breathing Pace Trainer"
          icon="heart-outline"
          subtitle={`Lie flat, place the phone on your chest.\nBreathe normally for ${DURATION_S} seconds.`}
        />
        <PrimaryButton title="Start Recording" onPress={startRecording} />
      </View>
    );
  }

  // ── Recording ─────────────────────────────────────────────────────────────────
  if (phase === 'recording') {
    return (
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons name="heart" size={80} color="#ef5350" />
        </Animated.View>
        <Text style={styles.countdown}>{countdown}s</Text>
        <Text style={styles.breatheText}>Breathe normally...</Text>
        <Text style={styles.zValue}>Z {liveZ.toFixed(3)}g</Text>
        <SecondaryButton title="Stop Early" onPress={finishRecording} style={styles.stopBtn} />
      </View>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  const category = categoriseBreathingRate(bpm);

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Recording complete</Text>

      <ScoreDisplay value={bpm} label="breaths per minute" />

      <ResultBadge label={category.label} severity={category.severity} />

      <View style={styles.referenceBox}>
        <Text style={styles.referenceHeading}>Reference ranges</Text>
        {[
          { range: '< 12 bpm', label: 'Slow / resting', color: '#1565c0' },
          { range: '12–20 bpm', label: 'Normal', color: '#2e7d32' },
          { range: '20–30 bpm', label: 'Elevated', color: '#e65100' },
          { range: '> 30 bpm', label: 'High', color: '#b71c1c' },
        ].map((r) => (
          <View key={r.range} style={styles.referenceRow}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={styles.referenceText}>{r.range} — {r.label}</Text>
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
    flex: 1,
    backgroundColor: '#0d1b2a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackSub: {
    fontSize: 14,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 22,
  },
  countdown: {
    fontSize: 56,
    fontWeight: '800',
    color: '#4fc3f7',
    marginTop: 16,
    lineHeight: 64,
  },
  breatheText: {
    fontSize: 16,
    color: '#546e7a',
    marginTop: 8,
    marginBottom: 4,
  },
  zValue: {
    fontSize: 13,
    color: '#37474f',
    fontVariant: ['tabular-nums'],
    marginBottom: 32,
  },
  stopBtn: { alignSelf: 'center', paddingHorizontal: 28 },
  resultContent: {
    flexGrow: 1,
    backgroundColor: '#0d1b2a',
    padding: 24,
    alignItems: 'center',
  },
  resultHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  referenceBox: {
    backgroundColor: '#1c2e3f',
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    marginTop: 16,
    marginBottom: 28,
  },
  referenceHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546e7a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  referenceText: {
    fontSize: 13,
    color: '#90a4ae',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  btnFlex: { flex: 1 },
});

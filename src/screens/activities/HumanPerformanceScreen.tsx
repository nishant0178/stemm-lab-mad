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

const DURATION_S = 8;
const SAMPLE_INTERVAL_MS = 50;

const MOVEMENTS = ['Arm Stretch', 'Reach Up', 'Side to Side'] as const;
type Movement = typeof MOVEMENTS[number];

const SEVERITY_COLORS: Record<string, string> = {
  graceful: '#2e7d32',
  smooth: '#1565c0',
  rough: '#e65100',
  jerky: '#b71c1c',
};

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
        <Ionicons name="phone-portrait-outline" size={64} color="#546e7a" />
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
        <Ionicons name="body-outline" size={60} color="#2E75B6" style={styles.headerIcon} />
        <Text style={styles.idleTitle}>Human Performance Lab</Text>
        <Text style={styles.idleSub}>
          Measure the smoothness and control of your movement.
        </Text>

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

        <TouchableOpacity
          style={[styles.primaryBtn, !movement && styles.disabledBtn]}
          onPress={startRecording}
          disabled={!movement}
        >
          <Text style={styles.primaryBtnText}>Start Recording</Text>
        </TouchableOpacity>
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

        <TouchableOpacity style={styles.stopBtn} onPress={finishRecording}>
          <Text style={styles.stopBtnText}>Stop Early</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  const category = categoriseSmoothness(score);
  const badgeColor = SEVERITY_COLORS[category.severity];

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Movement complete</Text>
      <Text style={styles.movementLabel}>{movement}</Text>

      <Text style={styles.scoreNumber}>{score}</Text>
      <Text style={styles.scoreUnit}>smoothness score / 100</Text>

      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{category.label}</Text>
      </View>

      <View style={styles.scaleBox}>
        <Text style={styles.scaleHeading}>Score scale</Text>
        {[
          { range: '80–100', label: 'Graceful — excellent control', color: '#2e7d32' },
          { range: '60–79', label: 'Smooth — good control', color: '#1565c0' },
          { range: '40–59', label: 'Rough — uneven motion', color: '#e65100' },
          { range: '0–39', label: 'Jerky — try slower next time', color: '#b71c1c' },
        ].map((r) => (
          <View key={r.range} style={styles.scaleRow}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={styles.scaleText}>{r.range} — {r.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
          <Text style={styles.secondaryBtnText}>Try Again</Text>
        </TouchableOpacity>
        {saved ? (
          <View style={[styles.primaryBtn, styles.savedBtn]}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={[styles.primaryBtnText, { marginLeft: 6 }]}>Saved!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving || !user || !team}
          >
            <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Score'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, backgroundColor: '#0d1b2a', alignItems: 'center',
    justifyContent: 'center', padding: 32,
  },
  fallbackTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  fallbackSub: { fontSize: 14, color: '#546e7a', textAlign: 'center', lineHeight: 22 },
  idleContent: { flexGrow: 1, backgroundColor: '#0d1b2a', padding: 24, alignItems: 'center' },
  headerIcon: { marginBottom: 10 },
  idleTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  idleSub: { fontSize: 14, color: '#546e7a', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  selectorLabel: {
    fontSize: 12, fontWeight: '700', color: '#546e7a', textTransform: 'uppercase',
    letterSpacing: 0.6, alignSelf: 'flex-start', marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignSelf: 'stretch' },
  chip: {
    borderWidth: 1, borderColor: '#263d54', borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1c2e3f',
  },
  chipSelected: { backgroundColor: '#2E75B6', borderColor: '#2E75B6' },
  chipText: { color: '#90a4ae', fontSize: 14, fontWeight: '500' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  instruction: {
    fontSize: 14, color: '#546e7a', textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: '#2E75B6', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabledBtn: { backgroundColor: '#37474f' },
  savedBtn: { backgroundColor: '#388e3c' },
  countdown: { fontSize: 64, fontWeight: '800', color: '#4fc3f7', lineHeight: 72 },
  recordingLabel: { fontSize: 16, color: '#546e7a', marginTop: 8, marginBottom: 20 },
  barTrack: {
    width: '100%', height: 12, backgroundColor: '#1c2e3f',
    borderRadius: 6, overflow: 'hidden', marginBottom: 8,
  },
  barFill: { height: '100%', backgroundColor: '#4fc3f7', borderRadius: 6 },
  magValue: { fontSize: 13, color: '#37474f', marginBottom: 32 },
  stopBtn: {
    borderWidth: 1, borderColor: '#546e7a', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 28,
  },
  stopBtnText: { color: '#90a4ae', fontWeight: '600', fontSize: 15 },
  resultContent: { flexGrow: 1, backgroundColor: '#0d1b2a', padding: 24, alignItems: 'center' },
  resultHeading: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4, marginTop: 8 },
  movementLabel: { fontSize: 14, color: '#4fc3f7', marginBottom: 16, fontStyle: 'italic' },
  scoreNumber: { fontSize: 88, fontWeight: '800', color: '#fff', lineHeight: 96 },
  scoreUnit: { fontSize: 15, color: '#546e7a', marginBottom: 20 },
  badge: {
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24,
    marginBottom: 24, alignSelf: 'stretch', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scaleBox: {
    backgroundColor: '#1c2e3f', borderRadius: 12, padding: 16,
    alignSelf: 'stretch', marginBottom: 28,
  },
  scaleHeading: {
    fontSize: 13, fontWeight: '700', color: '#546e7a',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  scaleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  scaleText: { fontSize: 13, color: '#90a4ae' },
  btnRow: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#2E75B6', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  secondaryBtnText: { color: '#2E75B6', fontWeight: '700', fontSize: 16 },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveBreathingScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import { detectPeaks, calculateBreathsPerMinute, categoriseBreathingRate } from '../../lib/breathing';

const DURATION_S = 30;
const SAMPLE_INTERVAL_MS = 50;

const SEVERITY_COLORS: Record<string, string> = {
  low: '#1565c0',
  normal: '#2e7d32',
  elevated: '#e65100',
  high: '#b71c1c',
};

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
        <Ionicons name="heart-outline" size={72} color="#2E75B6" />
        <Text style={styles.idleTitle}>Breathing Pace Trainer</Text>
        <Text style={styles.idleSub}>
          Lie flat. Place the phone gently on your chest.{'\n'}
          Tap Start and breathe normally for {DURATION_S} seconds.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={startRecording}>
          <Text style={styles.primaryBtnText}>Start Recording</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.stopBtn} onPress={finishRecording}>
          <Text style={styles.stopBtnText}>Stop Early</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  const category = categoriseBreathingRate(bpm);
  const badgeColor = SEVERITY_COLORS[category.severity];

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Recording complete</Text>

      <Text style={styles.bpmNumber}>{bpm}</Text>
      <Text style={styles.bpmUnit}>breaths per minute</Text>

      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{category.label}</Text>
      </View>

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
  idleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  idleSub: {
    fontSize: 14,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
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
  primaryBtn: {
    backgroundColor: '#2E75B6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  savedBtn: { backgroundColor: '#388e3c' },
  stopBtn: {
    borderWidth: 1,
    borderColor: '#546e7a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  stopBtnText: {
    color: '#90a4ae',
    fontWeight: '600',
    fontSize: 15,
  },
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
  bpmNumber: {
    fontSize: 88,
    fontWeight: '800',
    color: '#4fc3f7',
    lineHeight: 96,
  },
  bpmUnit: {
    fontSize: 16,
    color: '#546e7a',
    marginBottom: 20,
  },
  badge: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  referenceBox: {
    backgroundColor: '#1c2e3f',
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
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
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#2E75B6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  secondaryBtnText: {
    color: '#2E75B6',
    fontWeight: '700',
    fontSize: 16,
  },
});

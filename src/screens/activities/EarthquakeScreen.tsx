import React, { useEffect, useRef, useState } from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveEarthquakeScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import { calculateStabilityScore, categoriseStability } from '../../lib/earthquake';

const DURATION_S = 5;
const SAMPLE_INTERVAL_MS = 50;

const SEVERITY_COLORS: Record<string, string> = {
  excellent: '#2e7d32',
  good: '#1565c0',
  fair: '#e65100',
  poor: '#b71c1c',
};

type Sample = { x: number; y: number; z: number };
type Phase = 'idle' | 'recording' | 'result';

export default function EarthquakeScreen() {
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [designName, setDesignName] = useState('');
  const [countdown, setCountdown] = useState(DURATION_S);
  const [liveMag, setLiveMag] = useState(0);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      <ScrollView contentContainerStyle={styles.idleContent}>
        <Ionicons name="business-outline" size={64} color="#2E75B6" style={styles.headerIcon} />
        <Text style={styles.idleTitle}>Earthquake Structure Test</Text>
        <Text style={styles.idleSub}>
          Build a structure to support the phone, then test how well it absorbs vibrations.
          Place the phone on top of your structure and tap Start Test.
        </Text>

        <Text style={styles.inputLabel}>Design name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4 folds + 4 pillars"
          placeholderTextColor="#546e7a"
          value={designName}
          onChangeText={setDesignName}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, !designName.trim() && styles.disabledBtn]}
          onPress={startRecording}
          disabled={!designName.trim()}
        >
          <Text style={styles.primaryBtnText}>Start Test</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Recording ─────────────────────────────────────────────────────────────────
  if (phase === 'recording') {
    return (
      <View style={styles.center}>
        <Ionicons name="pulse-outline" size={56} color="#4fc3f7" />
        <Text style={styles.countdown}>{countdown}s</Text>
        <Text style={styles.recordingLabel}>Recording vibrations...</Text>
        <Text style={styles.magValue}>Magnitude {liveMag.toFixed(3)}g</Text>
        <TouchableOpacity style={styles.stopBtn} onPress={finishRecording}>
          <Text style={styles.stopBtnText}>Stop Early</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  const category = categoriseStability(score);
  const badgeColor = SEVERITY_COLORS[category.severity];

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Test complete</Text>
      <Text style={styles.designLabel}>"{designName}"</Text>

      <Text style={styles.scoreNumber}>{score}</Text>
      <Text style={styles.scoreUnit}>stability score / 100</Text>

      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{category.label}</Text>
      </View>

      <View style={styles.scaleBox}>
        <Text style={styles.scaleHeading}>Score scale</Text>
        {[
          { range: '80–100', label: 'Excellent — minimal motion', color: '#2e7d32' },
          { range: '60–79', label: 'Good — small movement', color: '#1565c0' },
          { range: '40–59', label: 'Fair — noticeable movement', color: '#e65100' },
          { range: '0–39', label: 'Poor — significant movement', color: '#b71c1c' },
        ].map((r) => (
          <View key={r.range} style={styles.scaleRow}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={styles.scaleText}>{r.range} — {r.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
          <Text style={styles.secondaryBtnText}>Try Another Design</Text>
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
            <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Result'}</Text>
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
    fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8,
  },
  fallbackSub: {
    fontSize: 14, color: '#546e7a', textAlign: 'center', lineHeight: 22,
  },
  idleContent: {
    flexGrow: 1,
    backgroundColor: '#0d1b2a',
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: { marginBottom: 12 },
  idleTitle: {
    fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 10, textAlign: 'center',
  },
  idleSub: {
    fontSize: 14, color: '#546e7a', textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: '#90a4ae', alignSelf: 'flex-start', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1c2e3f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#263d54',
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#2E75B6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabledBtn: { backgroundColor: '#37474f' },
  savedBtn: { backgroundColor: '#388e3c' },
  countdown: {
    fontSize: 64, fontWeight: '800', color: '#4fc3f7', marginTop: 12, lineHeight: 72,
  },
  recordingLabel: { fontSize: 16, color: '#546e7a', marginTop: 8, marginBottom: 4 },
  magValue: {
    fontSize: 13, color: '#37474f', fontVariant: ['tabular-nums'], marginBottom: 32,
  },
  stopBtn: {
    borderWidth: 1, borderColor: '#546e7a', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 28,
  },
  stopBtnText: { color: '#90a4ae', fontWeight: '600', fontSize: 15 },
  resultContent: {
    flexGrow: 1, backgroundColor: '#0d1b2a', padding: 24, alignItems: 'center',
  },
  resultHeading: {
    fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4, marginTop: 8,
  },
  designLabel: {
    fontSize: 14, color: '#4fc3f7', marginBottom: 16, fontStyle: 'italic',
  },
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
    paddingVertical: 14, paddingHorizontal: 20,
  },
  secondaryBtnText: { color: '#2E75B6', fontWeight: '700', fontSize: 15 },
});

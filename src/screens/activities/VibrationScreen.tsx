import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { calculateMagnitude, calculateMotionScore, describeScore } from '../../lib/vibration';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveVibrationScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';

type Phase = 'idle' | 'recording' | 'result';

const RECORD_DURATION = 10;

export default function VibrationScreen() {
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

  const bgColor = phase === 'recording' ? '#0a2e0a' : '#0d1b2a';

  return (
    <View style={[styles.screen, { backgroundColor: bgColor }]}>
      {phase === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.heading}>Steadiness Challenge</Text>
          <Text style={styles.instruction}>Hold the phone perfectly still for 10 seconds</Text>
          <Text style={styles.hint}>Lower score = steadier = better</Text>
          {bestVibrationScore !== null && (
            <Text style={styles.best}>Session best: {bestVibrationScore}</Text>
          )}
          <Pressable style={styles.startBtn} onPress={startRecording}>
            <Text style={styles.startBtnText}>Tap to Start</Text>
          </Pressable>
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
          <Text style={styles.resultLabel}>Motion Score</Text>
          <Text style={styles.resultScore}>{motionScore}</Text>
          <Text style={styles.resultDesc}>{describeScore(motionScore)}</Text>
          {bestVibrationScore !== null && (
            <Text style={styles.best}>Session best: {bestVibrationScore}</Text>
          )}
          <View style={styles.btnRow}>
            <Pressable style={styles.btnSecondary} onPress={reset}>
              <Text style={styles.btnSecondaryText}>Try Again</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, (saving || saved) && styles.btnDisabled]}
              disabled={saving || saved}
              onPress={async () => {
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
                  setSaved(true);
                } catch {
                  Alert.alert('Error', 'Could not save score. Please try again.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Text style={styles.btnPrimaryText}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Score'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 17,
    fontWeight: '600',
    color: '#a5d6a7',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 16,
  },
  best: {
    fontSize: 14,
    color: '#a5d6a7',
    marginBottom: 24,
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: '#a5d6a7',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 14,
  },
  startBtnText: {
    color: '#0d1b2a',
    fontSize: 17,
    fontWeight: '800',
  },
  countdownLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  countdown: {
    fontSize: 96,
    fontWeight: '900',
    color: '#a5d6a7',
    lineHeight: 104,
  },
  countdownSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 32,
  },
  readingsBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 180,
  },
  readingsTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  readingRow: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'monospace',
    marginBottom: 4,
    width: 120,
  },
  readingVal: {
    color: '#a5d6a7',
    fontWeight: '700',
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 72,
    fontWeight: '900',
    color: '#a5d6a7',
    marginBottom: 8,
  },
  resultDesc: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnPrimary: {
    backgroundColor: '#a5d6a7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: '#0d1b2a',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: '#1c2e3f',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#263d54',
  },
  btnSecondaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveSoundScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import { calculateAverageDb, calculatePeakDb, categoriseSoundLevel } from '../../lib/sound';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ResultBadge from '../../components/ResultBadge';

// expo-av is a native module — not available on web
let Audio: any = null;
try {
  if (Platform.OS !== 'web') {
    Audio = require('expo-av').Audio;
  }
} catch {
  // Web or missing module — fallback rendered below
}

const DURATION_S = 10;
const SAMPLE_INTERVAL_MS = 100;

type Phase = 'idle' | 'recording' | 'result';

export default function SoundScreen() {
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const [phase, setPhase] = useState<Phase>('idle');
  const [liveDb, setLiveDb] = useState(0);
  const [countdown, setCountdown] = useState(DURATION_S);
  const [samples, setSamples] = useState<number[]>([]);
  const [avgDb, setAvgDb] = useState(0);
  const [peakDb, setPeakDb] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [permError, setPermError] = useState('');

  const recordingRef = useRef<any>(null);
  const samplesRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopCleanup();
    };
  }, []);

  function stopCleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
  }

  async function startRecording() {
    if (!Audio) return;
    setPermError('');
    setSaved(false);

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermError('Microphone permission denied. Enable in device settings to use this activity.');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        (status: any) => {
          if (status.metering != null) {
            const db = Math.max(0, 100 + status.metering);
            setLiveDb(Math.round(db));
            samplesRef.current.push(db);
          }
        },
        SAMPLE_INTERVAL_MS,
      );
      recordingRef.current = recording;
    } catch (err) {
      setPermError('Could not start microphone. Check permissions in device settings.');
      return;
    }

    samplesRef.current = [];
    setSamples([]);
    setCountdown(DURATION_S);
    setPhase('recording');

    let elapsed = 0;
    countdownRef.current = setInterval(() => {
      elapsed += 1;
      setCountdown(DURATION_S - elapsed);
      if (elapsed >= DURATION_S) {
        finishRecording();
      }
    }, 1000);
  }

  async function finishRecording() {
    if (countdownRef.current) clearInterval(countdownRef.current);

    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {}

    const captured = [...samplesRef.current];
    const avg = calculateAverageDb(captured);
    const peak = calculatePeakDb(captured);
    setSamples(captured);
    setAvgDb(avg);
    setPeakDb(peak);
    setPhase('result');
  }

  async function handleSave() {
    if (!user || !team) return;
    setSaving(true);
    try {
      await saveSoundScore({ teamId: team.id, userId: user.uid, activity: 'soundPollution', averageDb: avgDb, peakDb });
      await saveScoreLocally('soundPollution', Math.round(avgDb));
      try { await captureAndSaveTeamLocation(team.id); } catch {}
      setSaved(true);
    } catch (err) {
      console.error('[SoundScreen] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    stopCleanup();
    setPhase('idle');
    setLiveDb(0);
    setCountdown(DURATION_S);
    setSamples([]);
    setAvgDb(0);
    setPeakDb(0);
    setSaved(false);
    setPermError('');
  }

  // ── Web fallback ─────────────────────────────────────────────────────────────
  if (Platform.OS === 'web' || !Audio) {
    return (
      <View style={styles.center}>
        <Ionicons name="mic-off-outline" size={64} color="#546e7a" />
        <Text style={styles.fallbackTitle}>Mobile only</Text>
        <Text style={styles.fallbackSub}>
          Sound recording requires a mobile device.{'\n'}Open the app on your phone to use this activity.
        </Text>
      </View>
    );
  }

  // ── Idle ─────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <View style={styles.center}>
        <ActivityHeader
          title="Sound Pollution Hunter"
          icon="mic-outline"
          subtitle={`Measure ambient noise in your environment.\nRecording runs for ${DURATION_S} seconds.`}
        />
        {!!permError && <Text style={styles.error}>{permError}</Text>}
        <PrimaryButton title="Start Recording" onPress={startRecording} />
      </View>
    );
  }

  // ── Recording ────────────────────────────────────────────────────────────────
  if (phase === 'recording') {
    return (
      <View style={styles.center}>
        <Text style={styles.liveDb}>{liveDb}</Text>
        <Text style={styles.liveDbUnit}>dB</Text>
        <Text style={styles.countdown}>{countdown}s remaining</Text>
        <SecondaryButton title="Stop Early" onPress={finishRecording} style={styles.stopBtn} />
      </View>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────────────
  const category = categoriseSoundLevel(avgDb);

  return (
    <ScrollView contentContainerStyle={styles.resultContent}>
      <Text style={styles.resultHeading}>Recording complete</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{avgDb}</Text>
          <Text style={styles.statLabel}>Avg dB</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{peakDb}</Text>
          <Text style={styles.statLabel}>Peak dB</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{samples.length}</Text>
          <Text style={styles.statLabel}>Samples</Text>
        </View>
      </View>

      <ResultBadge label={category.label} severity={category.severity} />

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
  error: {
    color: '#ef5350',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  liveDb: {
    fontSize: 96,
    fontWeight: '800',
    color: '#4fc3f7',
    lineHeight: 100,
  },
  liveDbUnit: {
    fontSize: 24,
    color: '#546e7a',
    marginBottom: 12,
  },
  countdown: {
    fontSize: 18,
    color: '#546e7a',
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
    marginBottom: 24,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: '#1c2e3f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4fc3f7',
  },
  statLabel: {
    fontSize: 12,
    color: '#546e7a',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  btnFlex: { flex: 1 },
});

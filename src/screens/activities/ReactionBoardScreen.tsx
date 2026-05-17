import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRandomDelay, calculateReactionTime } from '../../lib/reactionBoard';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveReactionBoardScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';
import { captureAndSaveTeamLocation } from '../../services/location';
import ActivityHeader from '../../components/ActivityHeader';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import ScoreDisplay from '../../components/ScoreDisplay';
import { colors, spacing, radius, typography } from '../../theme/spacing';

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'tooSoon' | 'tooSlow';

const PHASE_BG: Record<Phase, string> = {
  idle:    colors.background,
  waiting: '#b71c1c',
  ready:   '#1b5e20',
  result:  colors.background,
  tooSoon: '#e65100',
  tooSlow: '#263d54',
};

export default function ReactionBoardScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { bestReactionTime, setBestReactionTime } = useGameStore();
  const { user } = useAuthStore();
  const { team } = useTeamStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyAtRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  async function handleSave() {
    if (!user || !team || reactionTime === null) return;
    setSaving(true);
    try {
      await saveReactionBoardScore({
        teamId: team.id,
        userId: user.uid,
        activity: 'reactionBoard',
        reactionTimeMs: reactionTime,
        bestEverMs: bestReactionTime ?? reactionTime,
      });
      console.log('[ReactionBoard] Firestore save done, calling saveScoreLocally', reactionTime);
      saveScoreLocally('reactionBoard', reactionTime).catch(
        (e) => console.warn('[ReactionBoard] Local cache save failed:', e),
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

  const handlePress = () => {
    switch (phase) {
      case 'idle':
        setPhase('waiting');
        timerRef.current = setTimeout(() => {
          readyAtRef.current = Date.now();
          setPhase('ready');
          timerRef.current = setTimeout(() => setPhase('tooSlow'), 10_000);
        }, getRandomDelay());
        break;

      case 'waiting':
        clearTimer();
        setPhase('tooSoon');
        break;

      case 'ready':
        clearTimer();
        const rt = calculateReactionTime(readyAtRef.current, Date.now());
        setReactionTime(rt);
        setBestReactionTime(rt);
        setPhase('result');
        break;

      default:
        setPhase('idle');
        setReactionTime(null);
        setSaved(false);
        break;
    }
  };

  return (
    <Pressable style={[styles.screen, { backgroundColor: PHASE_BG[phase] }]} onPress={handlePress}>
      {phase === 'idle' && (
        <View style={styles.center}>
          <ActivityHeader title="Reaction Board" icon="flash-outline" subtitle="Tap when the screen turns green!" />
          <Text style={styles.instruction}>Tap to Start</Text>
          {bestReactionTime !== null && (
            <Text style={styles.best}>Session best: {bestReactionTime}ms</Text>
          )}
        </View>
      )}

      {phase === 'waiting' && (
        <View style={styles.center}>
          <Text style={styles.waitText}>Wait for green...</Text>
          <Text style={styles.hint}>Don't tap yet!</Text>
        </View>
      )}

      {phase === 'ready' && (
        <View style={styles.center}>
          <Text style={styles.tapNow}>TAP NOW!</Text>
        </View>
      )}

      {phase === 'tooSoon' && (
        <View style={styles.center}>
          <Text style={styles.phaseHeading}>Too soon!</Text>
          <Text style={styles.instruction}>Wait for green.</Text>
          <Text style={styles.hint}>Tap to retry</Text>
        </View>
      )}

      {phase === 'tooSlow' && (
        <View style={styles.center}>
          <Text style={styles.phaseHeading}>Too slow!</Text>
          <Text style={styles.hint}>Tap to retry</Text>
        </View>
      )}

      {phase === 'result' && reactionTime !== null && (
        <View style={styles.center}>
          <ScoreDisplay value={reactionTime} unit="ms" label="Your reaction time" />
          {bestReactionTime !== null && (
            <Text style={styles.best}>Session best: {bestReactionTime}ms</Text>
          )}
          <View style={styles.btnRow}>
            <SecondaryButton
              title="Try Again"
              onPress={() => { setPhase('idle'); setReactionTime(null); setSaved(false); }}
              style={styles.btnFlex}
            />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  phaseHeading: {
    ...typography.display,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  hint: {
    ...typography.body,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  best: {
    ...typography.caption,
    color: colors.accent,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  waitText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  tapNow: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
  btnFlex: { flex: 1 },
});

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { getRandomDelay, calculateReactionTime } from '../../lib/reactionBoard';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { useTeamStore } from '../../store/teamStore';
import { saveReactionBoardScore } from '../../services/firestore';
import { saveScoreLocally } from '../../services/localCache';

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'tooSoon' | 'tooSlow';

const PHASE_BG: Record<Phase, string> = {
  idle:    '#0d1b2a',
  waiting: '#b71c1c',
  ready:   '#1b5e20',
  result:  '#0d1b2a',
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

  // Clear timer on unmount
  useEffect(() => clearTimer, []);

  const handlePress = () => {
    switch (phase) {
      case 'idle':
        setPhase('waiting');
        timerRef.current = setTimeout(() => {
          readyAtRef.current = Date.now();
          setPhase('ready');
          // Auto-fail if player doesn't tap within 10 seconds
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

      // tooSoon, tooSlow, result → reset
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
          <Text style={styles.heading}>Reaction Board</Text>
          <Text style={styles.instruction}>Tap to Start</Text>
          <Text style={styles.hint}>Be ready to react!</Text>
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
          <Text style={styles.heading}>Too soon!</Text>
          <Text style={styles.instruction}>Wait for green.</Text>
          <Text style={styles.hint}>Tap to retry</Text>
        </View>
      )}

      {phase === 'tooSlow' && (
        <View style={styles.center}>
          <Text style={styles.heading}>Too slow!</Text>
          <Text style={styles.hint}>Tap to retry</Text>
        </View>
      )}

      {phase === 'result' && reactionTime !== null && (
        <View style={styles.center}>
          <Text style={styles.resultLabel}>Your reaction time</Text>
          <Text style={styles.resultTime}>{reactionTime}ms</Text>
          {bestReactionTime !== null && (
            <Text style={styles.best}>Session best: {bestReactionTime}ms</Text>
          )}
          <View style={styles.btnRow}>
            <Pressable style={styles.btnSecondary} onPress={() => { setPhase('idle'); setReactionTime(null); setSaved(false); }}>
              <Text style={styles.btnSecondaryText}>Try Again</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, (saving || saved) && styles.btnDisabled]}
              disabled={saving || saved}
              onPress={async () => {
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
                  saveScoreLocally('reactionBoard', reactionTime).catch(
                    (e) => console.warn('Local cache save failed:', e),
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
    </Pressable>
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
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  best: {
    fontSize: 14,
    color: '#4fc3f7',
    marginTop: 16,
    textAlign: 'center',
  },
  waitText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  tapNow: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  resultLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultTime: {
    fontSize: 64,
    fontWeight: '900',
    color: '#4fc3f7',
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  btnPrimary: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: '#0d1b2a',
    fontWeight: '700',
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
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
});

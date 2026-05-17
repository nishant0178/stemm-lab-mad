import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getLeaderboard } from '../services/firestore';
import { useTeamStore } from '../store/teamStore';
import { ACTIVITY_CONFIGS } from '../lib/leaderboard';
import { LeaderboardEntry } from '../types';
import { colors, spacing, typography, radius, shadow } from '../theme/spacing';

const MEDALS = ['🥇', '🥈', '🥉'];

const ACTIVITY_ORDER = [
  'reactionBoard',
  'vibration',
  'soundPollution',
  'breathing',
  'earthquake',
  'humanPerformance',
  'parachute',
  'handFan',
] as const;

export default function LeaderboardScreen() {
  const { team } = useTeamStore();
  const [selectedActivity, setSelectedActivity] = useState<string>('reactionBoard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (activity: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLeaderboard(activity, 10);
      setEntries(data);
    } catch {
      // Non-fatal — show whatever we have
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard(selectedActivity);
    }, [fetchLeaderboard, selectedActivity]),
  );

  useEffect(() => {
    setEntries([]);
    fetchLeaderboard(selectedActivity);
  }, [selectedActivity, fetchLeaderboard]);

  const config = ACTIVITY_CONFIGS[selectedActivity];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchLeaderboard(selectedActivity, true)}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={styles.heading}>Leaderboard</Text>

      {/* Activity selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {ACTIVITY_ORDER.map((key) => {
          const cfg = ACTIVITY_CONFIGS[key];
          const active = key === selectedActivity;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedActivity(key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={cfg.icon as any}
                size={13}
                color={active ? '#fff' : colors.textMuted}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cfg.shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sub}>{config?.label ?? selectedActivity}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.spinner} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No teams have played yet.</Text>
          <Text style={styles.emptyText}>Be the first!</Text>
        </View>
      ) : (
        entries.map((entry) => {
          const isMyTeam = entry.teamId === team?.id;
          const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;
          return (
            <View
              key={entry.teamId}
              style={[styles.row, isMyTeam && styles.rowHighlight]}
            >
              <Text style={[styles.rank, isMyTeam && styles.rankHighlight]}>
                {medal ?? `#${entry.rank}`}
              </Text>
              <View style={styles.teamInfo}>
                <Text style={[styles.teamName, isMyTeam && styles.teamNameHighlight]}>
                  {entry.teamName}
                  {isMyTeam ? '  (you)' : ''}
                </Text>
              </View>
              <Text style={[styles.score, isMyTeam && styles.scoreHighlight]}>
                {entry.scoreLabel}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  heading: {
    ...typography.h1,
    color: colors.accent,
    marginBottom: spacing.lg,
  },
  chipScroll: {
    marginBottom: spacing.xs,
  },
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: shadow.button.shadowColor,
    shadowOpacity: shadow.button.shadowOpacity,
    shadowRadius: shadow.button.shadowRadius,
    shadowOffset: shadow.button.shadowOffset,
    elevation: shadow.button.elevation,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sub: {
    ...typography.caption,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginTop: spacing.xxxl,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHighlight: {
    backgroundColor: 'rgba(79, 195, 247, 0.08)',
    borderColor: colors.accent,
  },
  rank: {
    width: 40,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMuted,
    textAlign: 'center',
  },
  rankHighlight: {
    color: colors.accent,
  },
  teamInfo: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  teamName: {
    ...typography.bodySemi,
    color: colors.text,
  },
  teamNameHighlight: {
    color: colors.accent,
  },
  score: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  scoreHighlight: {
    color: colors.accent,
  },
});

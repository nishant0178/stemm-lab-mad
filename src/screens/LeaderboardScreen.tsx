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
          tintColor="#4fc3f7"
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
            >
              <Ionicons
                name={cfg.icon as any}
                size={14}
                color={active ? '#fff' : '#546e7a'}
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
        <ActivityIndicator size="large" color="#4fc3f7" style={styles.spinner} />
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
    backgroundColor: '#0d1b2a',
  },
  content: {
    padding: 24,
    paddingTop: 16,
    flexGrow: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4fc3f7',
    marginBottom: 12,
  },
  chipScroll: {
    marginBottom: 4,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263d54',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#0d1b2a',
  },
  chipActive: {
    backgroundColor: '#2E75B6',
    borderColor: '#2E75B6',
  },
  chipText: {
    color: '#546e7a',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sub: {
    fontSize: 13,
    color: '#546e7a',
    marginTop: 10,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 48,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 15,
    color: '#546e7a',
    textAlign: 'center',
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c2e3f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#263d54',
  },
  rowHighlight: {
    backgroundColor: '#0d3349',
    borderColor: '#4fc3f7',
  },
  rank: {
    width: 40,
    fontSize: 18,
    fontWeight: '800',
    color: '#546e7a',
    textAlign: 'center',
  },
  rankHighlight: {
    color: '#4fc3f7',
  },
  teamInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  teamNameHighlight: {
    color: '#4fc3f7',
  },
  score: {
    fontSize: 14,
    fontWeight: '800',
    color: '#90a4ae',
  },
  scoreHighlight: {
    color: '#4fc3f7',
  },
});

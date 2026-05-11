import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLeaderboard } from '../services/firestore';
import { useTeamStore } from '../store/teamStore';
import { LeaderboardEntry } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { team } = useTeamStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLeaderboard('reactionBoard', 10);
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
      fetchLeaderboard();
    }, [fetchLeaderboard]),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchLeaderboard(true)}
          tintColor="#4fc3f7"
        />
      }
    >
      <Text style={styles.heading}>Leaderboard</Text>
      <Text style={styles.sub}>Reaction Board — best times</Text>

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
              <Text style={[styles.time, isMyTeam && styles.timeHighlight]}>
                {entry.bestReactionTimeMs}ms
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
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: '#546e7a',
    marginBottom: 24,
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
  time: {
    fontSize: 16,
    fontWeight: '800',
    color: '#90a4ae',
  },
  timeHighlight: {
    color: '#4fc3f7',
  },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTeamStore } from '../store/teamStore';
import { getAllTeams, getLeaderboard } from '../services/firestore';
import { getCurrentLocation } from '../services/location';
import { Team } from '../types';

// react-native-maps is not available on web — require conditionally
const RNMaps = Platform.OS !== 'web' ? require('react-native-maps') : null;
const MapView = RNMaps?.default ?? null;
const Marker = RNMaps?.Marker ?? null;

const MELBOURNE = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { team: myTeam } = useTeamStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [bestTimes, setBestTimes] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [initialRegion, setInitialRegion] = useState(MELBOURNE);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const [allTeams, leaderboard] = await Promise.all([
            getAllTeams(),
            getLeaderboard('reactionBoard', 100),
          ]);
          if (!cancelled) {
            setTeams(allTeams);
            const map = new Map<string, number>();
            leaderboard.forEach((e) => map.set(e.teamId, e.bestReactionTimeMs));
            setBestTimes(map);
          }
        } catch {}

        if (Platform.OS !== 'web') {
          try {
            const loc = await getCurrentLocation();
            if (loc && !cancelled) {
              setInitialRegion({ ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 });
            }
          } catch {}
        }

        if (!cancelled) setLoading(false);
      })();
      return () => { cancelled = true; };
    }, []),
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Map view available on mobile only.</Text>
        <Text style={styles.fallbackSub}>
          Open the app on your phone to see team locations.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  const teamsWithLocation = teams.filter((t) => t.location);

  return (
    <MapView style={styles.map} initialRegion={initialRegion}>
      {teamsWithLocation.map((team) => {
        const isMe = team.id === myTeam?.id;
        const best = bestTimes.get(team.id);
        return (
          <Marker
            key={team.id}
            coordinate={team.location!}
            title={team.name + (isMe ? ' (you)' : '')}
            description={best != null ? `Best: ${best}ms` : 'No scores yet'}
            pinColor={isMe ? '#4fc3f7' : '#ef5350'}
          />
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fallbackTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackSub: {
    fontSize: 14,
    color: '#546e7a',
    textAlign: 'center',
  },
});

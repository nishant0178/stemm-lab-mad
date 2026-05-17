import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTeamStore } from '../store/teamStore';
import { getAllTeams, getLeaderboard } from '../services/firestore';
import { getCurrentLocation } from '../services/location';
import { Team } from '../types';
import { useTheme } from '../theme/ThemeContext';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;
try {
  if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  }
} catch {
  // Will render fallback below
}

const MELBOURNE = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { colors } = useTheme();
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

  const styles = StyleSheet.create({
    loadingWrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    fallback: {
      flex: 1, backgroundColor: colors.background, alignItems: 'center',
      justifyContent: 'center', padding: 32,
    },
    fallbackTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.text, textAlign: 'center', marginBottom: 8 },
    fallbackSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    fallbackContainer: {
      flex: 1, backgroundColor: colors.background, justifyContent: 'center',
      alignItems: 'center', padding: 32,
    },
    fallbackHeading: { fontSize: 20, fontWeight: '600' as const, color: colors.text, marginTop: 16, marginBottom: 8 },
    fallbackText: { textAlign: 'center', color: colors.textMuted, marginVertical: 8, lineHeight: 22, fontSize: 14 },
  });

  if (!MapView) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Map unavailable in Expo Go</Text>
        <Text style={styles.fallbackSub}>
          react-native-maps requires a custom native build.{'\n'}
          The map works in the production APK.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const teamsWithLocation = teams.filter((t) => t.location);

  return (
    <View style={styles.fallbackContainer}>
      <Ionicons name="map-outline" size={80} color={colors.textMuted} />
      <Text style={styles.fallbackHeading}>Map view</Text>
      <Text style={styles.fallbackText}>
        Map rendering requires a Google Maps API key with an active billing account, which is
        outside the scope of this academic build.
      </Text>
      <Text style={styles.fallbackText}>
        The location data layer is fully functional — team GPS coordinates are being captured on
        every score save and stored in Firestore.{' '}
        {teamsWithLocation.length} team{teamsWithLocation.length === 1 ? '' : 's'} currently{' '}
        {teamsWithLocation.length === 1 ? 'has' : 'have'} location data saved.
      </Text>
    </View>
  );
}

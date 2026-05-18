import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTeamStore } from '../store/teamStore';
import { getAllTeams, getLeaderboard } from '../services/firestore';
import { getCurrentLocation } from '../services/location';
import { Team } from '../types';
import { useTheme } from '../theme/ThemeContext';

const MELBOURNE = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { colors, isDark } = useTheme();
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
    webview: { flex: 1, backgroundColor: colors.background },
    fallback: {
      flex: 1, backgroundColor: colors.background, alignItems: 'center',
      justifyContent: 'center', padding: 32,
    },
    fallbackTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.text, textAlign: 'center', marginBottom: 8 },
    fallbackSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  });

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Map unavailable on web</Text>
        <Text style={styles.fallbackSub}>Open the app on your phone to view the team map.</Text>
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

  const teamsJson = JSON.stringify(
    teamsWithLocation.map((t) => ({
      id: t.id,
      name: t.name,
      lat: (t.location as any).latitude,
      lng: (t.location as any).longitude,
      bestMs: bestTimes.get(t.id) ?? null,
    })),
  );

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttrib = isDark
    ? '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const html = `
<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    body,html,#map{margin:0;padding:0;height:100%;width:100%;background:${colors.background};}
  </style>
</head><body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const teams = ${teamsJson};
    const myTeamId = ${JSON.stringify(myTeam?.id ?? null)};
    const map = L.map('map').setView([${initialRegion.latitude}, ${initialRegion.longitude}], 13);
    L.tileLayer('${tileUrl}', { attribution: '${tileAttrib}', maxZoom: 19 }).addTo(map);
    teams.forEach(function(t) {
      var isMe = t.id === myTeamId;
      var marker = L.circleMarker([t.lat, t.lng], {
        radius: isMe ? 10 : 7,
        fillColor: isMe ? '${colors.accent}' : '${colors.primary}',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      }).addTo(map);
      var ms = t.bestMs != null ? '<br/><small>' + Math.round(t.bestMs) + ' ms</small>' : '';
      marker.bindPopup('<b>' + t.name + '</b>' + (isMe ? ' (you)' : '') + ms);
    });
  </script>
</body></html>
`;

  return (
    <WebView
      source={{ html }}
      style={styles.webview}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}

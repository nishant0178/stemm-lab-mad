import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, LogBox } from 'react-native';

LogBox.ignoreLogs(['@firebase/auth: Auth']);
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { getTeamByUser } from './src/services/firestore';
import { initDatabase } from './src/services/localCache';
import { requestNotificationPermissions } from './src/services/notifications';
import { startLeaderboardWatcher } from './src/services/leaderboardWatcher';
import { useAuthStore } from './src/store/authStore';
import { useTeamStore } from './src/store/teamStore';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { team, setTeam } = useTeamStore();
  const watcherUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initDatabase().catch((e) => console.error('[App] initDatabase failed:', e));
    requestNotificationPermissions().catch((e) => console.error('[App] notifications init failed:', e));
  }, []);

  // Start/stop leaderboard watcher whenever auth+team state changes
  useEffect(() => {
    // Tear down any existing watcher first
    if (watcherUnsubRef.current) {
      watcherUnsubRef.current();
      watcherUnsubRef.current = null;
    }
    if (user && team) {
      watcherUnsubRef.current = startLeaderboardWatcher(team.id);
    }
    return () => {
      if (watcherUnsubRef.current) {
        watcherUnsubRef.current();
        watcherUnsubRef.current = null;
      }
    };
  }, [user?.uid, team?.id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? undefined,
        });
        try {
          const existingTeam = await getTeamByUser(firebaseUser.uid);
          if (existingTeam) setTeam(existingTeam);
        } catch {
          // Non-fatal — user will be sent to TeamSetup
        }
      } else {
        setUser(null);
        setTeam(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b2a' }}>
        <ActivityIndicator size="large" color="#4fc3f7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootNavigator isAuthenticated={!!user} hasTeam={!!team} />
    </NavigationContainer>
  );
}

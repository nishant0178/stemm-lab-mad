import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import { getTeamByUser } from './src/services/firestore';
import { useAuthStore } from './src/store/authStore';
import { useTeamStore } from './src/store/teamStore';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { team, setTeam } = useTeamStore();

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

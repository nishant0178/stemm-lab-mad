import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTeamStore } from '../store/teamStore';
import { RootStackParamList } from '../types';
import { getRecentScores, LocalScore } from '../services/localCache';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type Activity = {
  id: keyof RootStackParamList;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const ENGINEERING: Activity[] = [
  { id: 'ParachuteScreen', title: 'Parachute Drop', description: 'Measure parachute landing forces', icon: 'airplane-outline' },
  { id: 'SoundScreen', title: 'Sound Pollution Hunter', description: 'Track ambient noise levels', icon: 'volume-high-outline' },
  { id: 'HandFanScreen', title: 'Hand Fan Challenge', description: 'Compare fan designs for airflow', icon: 'leaf-outline' },
  { id: 'EarthquakeScreen', title: 'Earthquake Structure', description: 'Build the tallest quake-proof structure', icon: 'pulse-outline' },
];

const HEALTH: Activity[] = [
  { id: 'HumanPerformanceScreen', title: 'Human Performance', description: 'Measure exercise impact on reaction time', icon: 'body-outline' },
  { id: 'ReactionBoard', title: 'Reaction Board', description: 'Test team reaction speed', icon: 'flash-outline' },
  { id: 'BreathingScreen', title: 'Breathing Pace', description: 'Analyse breathing rate at rest and exercise', icon: 'heart-outline' },
];

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}

function activityLabel(activity: string): string {
  if (activity === 'reactionBoard') return 'Reaction Board';
  return activity;
}

function ActivityCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrap}>
        <Ionicons name={activity.icon} size={32} color="#2E75B6" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{activity.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{activity.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { team } = useTeamStore();
  const [recentScores, setRecentScores] = useState<LocalScore[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecentScores(5)
        .then(setRecentScores)
        .catch(() => setRecentScores([]));
    }, []),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hey, {team?.name ?? 'Team'} 👋</Text>
      <Text style={styles.sub}>Choose an activity to get started</Text>

      <Text style={styles.sectionHeading}>Engineering Challenges</Text>
      {ENGINEERING.map((a) => (
        <ActivityCard key={a.id} activity={a} onPress={() => navigation.navigate(a.id as any)} />
      ))}

      <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Health &amp; Medical Sciences</Text>
      {HEALTH.map((a) => (
        <ActivityCard key={a.id} activity={a} onPress={() => navigation.navigate(a.id as any)} />
      ))}

      <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Your Recent Scores</Text>
      {recentScores.length === 0 ? (
        <Text style={styles.emptyText}>No scores yet. Play to record one!</Text>
      ) : (
        recentScores.map((score) => (
          <View key={score.id} style={styles.scoreRow}>
            <Ionicons name="flash" size={14} color="#4fc3f7" style={styles.scoreIcon} />
            <Text style={styles.scoreText}>
              {activityLabel(score.activity)} —{' '}
              <Text style={styles.scoreMs}>{score.reactionTimeMs}ms</Text>
              {' '}— {timeAgo(score.attemptedAt)}
            </Text>
          </View>
        ))
      )}

      {/*
        AdMob banner deferred — react-native-google-mobile-ads has a known issue
        with Fabric architecture in Expo SDK 54 that crashes the app on banner render
        (IndexOutOfBoundsException in ReactNativeGoogleMobileAdsBannerAdViewManager).
        The integration code is preserved in src/components/BannerAd.tsx and the
        package is installed and configured — for production launch this would
        require either disabling Fabric for AdMob or waiting for an SDK update.
      */}
      {/* <BannerAdComponent /> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    color: '#546e7a',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E75B6',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#e8f0fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#546e7a',
    textAlign: 'center',
    paddingVertical: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c2e3f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#263d54',
  },
  scoreIcon: {
    marginRight: 8,
  },
  scoreText: {
    fontSize: 14,
    color: '#90a4ae',
    flex: 1,
  },
  scoreMs: {
    color: '#4fc3f7',
    fontWeight: '700',
  },
});

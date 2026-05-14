import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTeamStore } from '../store/teamStore';
import { RootStackParamList } from '../types';
import { getRecentScores, LocalScore } from '../services/localCache';
import BannerAdComponent from '../components/BannerAd';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ACTIVITIES = [
  {
    id: 'ReactionBoard' as const,
    title: 'Reaction Board',
    description: 'Test your team\'s reaction time — tap when you see the signal!',
    icon: 'flash' as const,
    color: '#4fc3f7',
  },
  {
    id: 'Vibration' as const,
    title: 'Vibration Meter',
    description: 'Measure vibrations around you using the phone\'s accelerometer.',
    icon: 'pulse' as const,
    color: '#a5d6a7',
  },
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
      <Text style={styles.sub}>Pick an activity to get started</Text>

      {ACTIVITIES.map((activity) => (
        <View key={activity.id} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: activity.color + '22' }]}>
            <Ionicons name={activity.icon} size={32} color={activity.color} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{activity.title}</Text>
            <Text style={styles.cardDesc}>{activity.description}</Text>
          </View>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: activity.color }]}
            onPress={() => navigation.navigate(activity.id)}
          >
            <Text style={styles.playBtnText}>Play</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Your Recent Scores</Text>
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

      <BannerAdComponent />
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
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1c2e3f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#263d54',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#90a4ae',
    lineHeight: 16,
  },
  playBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playBtnText: {
    color: '#0d1b2a',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546e7a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 12,
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

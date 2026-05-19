import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTeamStore } from '../store/teamStore';
import { RootStackParamList } from '../types';
import { getRecentScores, LocalScore } from '../services/localCache';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography, radius, shadow } from '../theme/spacing';
import BannerAdComponent from '../components/BannerAd';

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
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: `${colors.primary}1F`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardBody: { flex: 1 },
    cardTitle: { ...typography.h3, color: colors.text, marginBottom: 2 },
    cardDesc: { ...typography.caption, color: colors.textSecondary },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconWrap}>
        <Ionicons name={activity.icon} size={26} color={colors.accent} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{activity.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{activity.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    greeting: { ...typography.display, color: colors.text, marginBottom: spacing.xs },
    sub: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xl },
    sectionHeading: {
      ...typography.label, color: colors.accent, marginBottom: spacing.md,
    },
    emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
    scoreRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
    },
    scoreIcon: { marginRight: spacing.sm },
    scoreText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    scoreMs: { color: colors.accent, fontWeight: '700' as const },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hey, {team?.name ?? 'Team'} 👋</Text>
      <Text style={styles.sub}>Choose an activity to get started</Text>

      <Text style={styles.sectionHeading}>Engineering Challenges</Text>
      {ENGINEERING.map((a) => (
        <ActivityCard key={a.id} activity={a} onPress={() => navigation.navigate(a.id as any)} />
      ))}

      <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Health &amp; Medical Sciences</Text>
      {HEALTH.map((a) => (
        <ActivityCard key={a.id} activity={a} onPress={() => navigation.navigate(a.id as any)} />
      ))}

      <Text style={[styles.sectionHeading, { marginTop: spacing.xl }]}>Your Recent Scores</Text>
      {recentScores.length === 0 ? (
        <Text style={styles.emptyText}>No scores yet. Play to record one!</Text>
      ) : (
        recentScores.map((score) => (
          <View key={score.id} style={styles.scoreRow}>
            <Ionicons name="flash" size={14} color={colors.accent} style={styles.scoreIcon} />
            <Text style={styles.scoreText}>
              {activityLabel(score.activity)} —{' '}
              <Text style={styles.scoreMs}>{score.reactionTimeMs}ms</Text>
              {' '}— {timeAgo(score.attemptedAt)}
            </Text>
          </View>
        ))
      )}

      {/*
        AdMob banner deferred — react-native-google-mobile-ads@16.3.3 has an unresolved
        runtime crash (IndexOutOfBoundsException in BannerAdViewManager.requestAd)
        on Expo SDK 54 regardless of architecture mode. Downgrading to v14.x fails to
        compile against the new RN 0.81 Maven artifacts. The integration code remains
        in src/components/BannerAd.tsx, the package is installed, the eas.json profile
        is configured, and the AdMob plugin is in app.json — only the runtime mount is
        deferred. Documented in report Section 6 (Limitations).
      */}
      {/* <BannerAdComponent /> */}
    </ScrollView>
  );
}

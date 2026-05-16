import { NavigatorScreenParams } from '@react-navigation/native';
import type { Timestamp } from 'firebase/firestore';

export type AppUser = {
  uid: string;
  email: string;
  displayName?: string;
};

export type Team = {
  id: string;
  name: string;
  members: string[];
  yearLevel: string;
  createdBy: string;
  location?: { latitude: number; longitude: number; lastUpdated: number };
};

export type MainTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Map: undefined;
  Settings: undefined;
};

export type ReactionBoardScore = {
  teamId: string;
  userId: string;
  activity: 'reactionBoard';
  reactionTimeMs: number;
  bestEverMs: number;
  attemptedAt: Timestamp;
};

export type VibrationScore = {
  teamId: string;
  userId: string;
  activity: 'vibration';
  motionScore: number;
  attemptedAt: Timestamp;
};

export type SoundScore = {
  teamId: string;
  userId: string;
  activity: 'soundPollution';
  averageDb: number;
  peakDb: number;
  attemptedAt: Timestamp;
};

export type BreathingScore = {
  teamId: string;
  userId: string;
  activity: 'breathing';
  breathsPerMinute: number;
  attemptedAt: Timestamp;
};

export type LeaderboardEntry = {
  rank: number;
  teamId: string;
  teamName: string;
  bestReactionTimeMs: number;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  TeamSetup: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ReactionBoard: undefined;
  Vibration: undefined;
  Map: undefined;
  Results: { activityId: string };
  ParachuteScreen: undefined;
  SoundScreen: undefined;
  HandFanScreen: undefined;
  EarthquakeScreen: undefined;
  HumanPerformanceScreen: undefined;
  BreathingScreen: undefined;
};

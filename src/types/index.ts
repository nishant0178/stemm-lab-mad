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
};

export type MainTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Settings: undefined;
};

export type ReactionBoardScore = {
  teamId: string;
  reactionTimeMs: number;
  attemptedAt: Timestamp;
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
};

export type AppUser = {
  uid: string;
  email: string;
  displayName?: string;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  TeamSetup: undefined;
  ReactionBoard: undefined;
  Vibration: undefined;
  Leaderboard: undefined;
  Map: undefined;
  Settings: undefined;
  Results: { activityId: string };
};

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleLeaderboardNotification(
  beatingTeamName: string,
  theirTimeMs: number,
): Promise<void> {
  if (Platform.OS === 'web') {
    console.log(
      `[notifications] ${beatingTeamName} scored ${theirTimeMs}ms — faster than your best!`,
    );
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your record was beaten! 🏆',
      body: `${beatingTeamName} just scored ${theirTimeMs}ms — faster than your best!`,
    },
    trigger: null, // fire immediately
  });
}

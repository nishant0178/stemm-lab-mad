import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const BACKGROUND_LOCATION_TASK = 'background-team-location-refresh';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async () => {
  try {
    const stored = (globalThis as any).__teamIdForBackground;
    if (!stored) return BackgroundFetch.BackgroundFetchResult.NoData;

    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') return BackgroundFetch.BackgroundFetchResult.NoData;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await updateDoc(doc(db, 'teams', stored), {
      location: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        lastUpdated: Date.now(),
      },
    });
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.warn('[BackgroundTask] failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundLocationTask(teamId: string) {
  (globalThis as any).__teamIdForBackground = teamId;
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) return;
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (!registered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_LOCATION_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (err) {
    console.warn('[BackgroundTask] register failed:', err);
  }
}

export async function unregisterBackgroundLocationTask() {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (registered) await BackgroundFetch.unregisterTaskAsync(BACKGROUND_LOCATION_TASK);
  } catch {}
}

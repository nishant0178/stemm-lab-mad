import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { updateTeamLocation } from './firestore';

export type GPSLocation = {
  latitude: number;
  longitude: number;
};

export async function getCurrentLocation(): Promise<GPSLocation | null> {
  if (Platform.OS === 'web') return null;

  console.log('[location] requesting permission');
  const { status } = await Location.requestForegroundPermissionsAsync();
  console.log('[location] permission status:', status);
  if (status !== 'granted') return null;

  console.log('[location] getting current position');
  try {
    const pos = await Promise.race<Location.LocationObject>([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('GPS timeout')), 5000),
      ),
    ]);
    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    console.log('[location] got coords:', coords.latitude, coords.longitude);
    return coords;
  } catch {
    console.log('[location] getCurrentPosition timed out, trying last known');
    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      const coords = { latitude: last.coords.latitude, longitude: last.coords.longitude };
      console.log('[location] got last known coords:', coords.latitude, coords.longitude);
      return coords;
    }
    console.warn('[location] no position available');
    return null;
  }
}

export async function captureAndSaveTeamLocation(teamId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  console.log('[location] attempting to capture team location');
  const loc = await getCurrentLocation();
  if (!loc) return;
  console.log('[location] writing to team doc');
  await updateTeamLocation(teamId, loc);
  console.log('[location] captured and saved');
}

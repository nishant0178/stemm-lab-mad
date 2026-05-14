import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type GPSLocation = {
  latitude: number;
  longitude: number;
};

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<GPSLocation | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus !== 'granted') {
        console.warn('[location] permission denied — score saved without location');
        return null;
      }
    }
    // Try current position with 5s timeout, fall back to last known
    try {
      const pos = await Promise.race<Location.LocationObject>([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('GPS timeout')), 5000),
        ),
      ]);
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
      return null;
    }
  } catch {
    return null;
  }
}

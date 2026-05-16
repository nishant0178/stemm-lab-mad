import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// NOTE: Using getAuth (in-memory persistence) instead of initializeAuth +
// AsyncStorage because @react-native-async-storage/async-storage v2.2.0 has
// a JSI TurboModule type mismatch with RN 0.81.5 New Arch in Expo Go.
// Switch to initializeAuth + getReactNativePersistence when using a dev client build.

const firebaseConfig = Constants.expoConfig?.extra?.firebase;

if (!firebaseConfig?.apiKey) {
  throw new Error('Firebase config missing in app.json extra field');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

# EAS Build Notes

## Prerequisites
- Expo account: nishant0178
- EAS CLI: `npx eas-cli` (no global install needed)

## First-time setup
```bash
npx eas-cli login          # sign in as nishant0178
npx eas-cli project:init   # links project to your Expo account (creates projectId in app.json)
```

## Build profiles (eas.json)

| Profile | Purpose | Output |
|---|---|---|
| `development` | Dev client with all native modules (AdMob, Maps, Notifications) | APK |
| `preview` | Submission-ready APK for marking | APK |
| `production` | Store release (future) | AAB |

## Building

### Dev client (use during development — replaces Expo Go)
```bash
npx eas-cli build --platform android --profile development
```
- Takes 15–25 min on Expo's servers
- Download APK link printed in terminal
- Install on phone: `adb install <downloaded.apk>` or scan QR from EAS dashboard
- Start dev server: `npx expo start --dev-client`

### Preview APK (for submission)
```bash
npx eas-cli build --platform android --profile preview
```
- Same as development but without dev menu
- This is the APK to submit / demo to markers

## After installing the dev build APK

The dev client replaces Expo Go. Everything that was working in Expo Go still works,
plus these features that were blocked in Expo Go now work:
- **AdMob banner ads** (react-native-google-mobile-ads)
- **react-native-maps** (Map tab shows real map)
- **expo-notifications** (push notifications fully functional)
- **Firebase Auth persistence** (re-enable AsyncStorage persistence in firebase.ts)

## Re-enabling Firebase Auth persistence (after dev build)
In `src/config/firebase.ts`, replace `getAuth(app)` with:
```typescript
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
```

## AdMob note
Test ad IDs are used in app.json (Google's official test IDs).
Replace with real ad unit IDs from AdMob console before production release.
Never use real ad IDs during development — violates AdMob policy.

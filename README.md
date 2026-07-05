# Stratum

Android network monitor with a persistent notification dot (red for LTE/LTE+/4G, green for 5G/5G+), live upload/download speeds, and an AMOLED-black UI.

## Requirements

- Node.js 20+
- Android device with cellular data (emulator is not sufficient for 4G/5G testing)
- [Android SDK](https://docs.expo.dev/workflow/android-studio-emulator/) for local builds

## Setup

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

This app uses native modules (`expo-stratum-core`, `react-native-notify-kit`) and **does not run in Expo Go**. Use a development build.

## EAS build (optional)

```bash
npx eas build --profile development --platform android
```

## Usage

1. Open Stratum and grant **Phone state**, **Notifications**, and **Battery exempt** permissions.
2. Toggle **Monitoring** on.
3. A persistent notification appears with a colored dot in the status area.
4. Expand the notification to see speeds and tap **✕** to stop.
5. Re-enable monitoring from the in-app toggle anytime.

## Stack

- Expo SDK 57 + TypeScript
- `expo-stratum-core` — cellular labels (LTE/LTE+/5G/5G+) + mobile traffic stats
- `react-native-notify-kit` — Android foreground service notification
- `@react-native-community/netinfo` — fallback generation detection

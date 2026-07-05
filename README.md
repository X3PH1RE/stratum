# Stratum

Android network monitor with a persistent notification dot (red for LTE/LTE+/4G, green for 5G/5G+), live upload/download speeds, and an AMOLED-black UI.

## Requirements

- Node.js 20+
- Android device with cellular data (emulator is not sufficient for 4G/5G testing)
- [Android SDK](https://docs.expo.dev/workflow/android-studio-emulator/) for local builds

## Preview in Expo Go

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android phone (same Wi‑Fi as your PC). Do not press **w** (web) — this app is Android-only.

This project uses **Expo SDK 54**, which is compatible with the **Play Store** version of Expo Go.

Expo Go preview includes the full UI and network type (4G/5G via NetInfo). These features require a **dev build** (`npx expo run:android` or EAS):

- Persistent notification dot in the status bar
- Live upload/download speeds
- Background monitoring on battery saver

## Full build (dev client)

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

Native modules (`expo-stratum-core`, `react-native-notify-kit`) are used automatically in dev builds.

### EAS build (optional)

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

- Expo SDK 54 + TypeScript
- `expo-stratum-core` — cellular labels (LTE/LTE+/5G/5G+) + mobile traffic stats
- `react-native-notify-kit` — Android foreground service notification
- `@react-native-community/netinfo` — fallback generation detection

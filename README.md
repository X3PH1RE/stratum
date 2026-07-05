# Stratum

Android network monitor with a persistent notification dot (red for LTE/LTE+/4G, green for 5G/5G+), live upload/download speeds, and an AMOLED-black UI.

## Install on your phone (recommended)

Build a standalone APK in the cloud with EAS, then install it on your Android device:

```bash
npm install
npx eas login
npm run build:android
```

When the build finishes, open the link in the terminal (or [expo.dev](https://expo.dev) → your project → Builds), download the **APK**, and install it on your phone. You may need to allow **Install from unknown sources** for your browser or file manager.

This **preview** build includes all native features (notification dot, live speeds, background monitoring). It does not require Expo Go or a dev server.

For a production-labelled build:

```bash
npm run build:android:prod
```

## Preview in Expo Go

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android phone (same Wi‑Fi as your PC). Do not press **w** (web) — this app is Android-only.

Expo Go preview includes the UI and network type (4G/5G via NetInfo). Notification dot, live speeds, and background monitoring require the installable build above.

## Local dev build (optional)

Requires Android SDK, JDK 17+, and a connected device or emulator:

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
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

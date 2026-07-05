import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Stratum',
  slug: 'stratum',
  version: '1.0.0',
  platforms: ['android'],
  orientation: 'portrait',
  scheme: 'stratum',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
  android: {
    package: 'com.stratum.monitor',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'READ_PHONE_STATE',
      'POST_NOTIFICATIONS',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_DATA_SYNC',
      'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    ],
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-ignore-battery-optimizations',
    [
      'react-native-notify-kit',
      {
        android: {
          foregroundService: {
            types: ['dataSync'],
          },
        },
      },
    ],
    './plugins/withNotificationDot.js',
    './plugins/withFixHermesBuildGradle.js',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '256d1310-c46d-48f0-9918-b95c0e721c32',
    },
  },
  owner: 'ashwinmenon',
} as ExpoConfig;

export default config;

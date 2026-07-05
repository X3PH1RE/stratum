import Constants from 'expo-constants';

/** True when running inside the Expo Go app. */
export const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

/** True when native Stratum modules (notify-kit, expo-stratum-core) are available. */
export const isNativeBuild = !isExpoGo;

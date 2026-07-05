import * as IntentLauncher from 'expo-intent-launcher';
import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

import { isExpoGo } from '../platform/runtime';
import {
  monitoringController,
  type MonitoringState,
} from '../services/monitoringController';

export function useMonitoring() {
  const [state, setState] = useState<MonitoringState>(
    monitoringController.getState(),
  );

  useEffect(() => {
    return monitoringController.subscribe(setState);
  }, []);

  const start = async () => {
    await monitoringController.start();
  };

  const stop = async () => {
    await monitoringController.stop();
  };

  const toggle = async (enabled: boolean) => {
    if (enabled) {
      await start();
    } else {
      await stop();
    }
  };

  return {
    ...state,
    start,
    stop,
    toggle,
  };
}

export type PermissionStatus = 'granted' | 'denied' | 'unknown' | 'unavailable';

export type PermissionState = {
  phoneState: PermissionStatus;
  notifications: PermissionStatus;
  battery: PermissionStatus;
};

async function getPhoneStateStatus(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'unknown';
  }

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  );
  return granted ? 'granted' : 'denied';
}

async function getNotificationStatus(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'unknown';
  }

  if (Platform.Version < 33) {
    return 'granted';
  }

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return granted ? 'granted' : 'denied';
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    phoneState: 'unknown',
    notifications: 'unknown',
    battery: 'unknown',
  });

  const refresh = async () => {
    const phoneState = await getPhoneStateStatus();
    const notifications = await getNotificationStatus();

    let battery: PermissionStatus = 'unknown';
    if (isExpoGo) {
      battery = 'unavailable';
    } else {
      try {
        const { isIgnoringBatteryOptimizations } = await import(
          'expo-ignore-battery-optimizations'
        );
        battery = isIgnoringBatteryOptimizations() ? 'granted' : 'denied';
      } catch {
        battery = 'unknown';
      }
    }

    setPermissions({ phoneState, notifications, battery });
  };

  useEffect(() => {
    void refresh();
  }, []);

  const requestPhoneState = async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      {
        title: 'Phone state',
        message:
          'Stratum needs phone state access to detect LTE, LTE+, 5G, and 5G+.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    await refresh();
  };

  const requestNotifications = async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notifications',
          message: 'Stratum shows your network status in the notification shade.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
    } else if (!isExpoGo) {
      const notifee = (await import('react-native-notify-kit')).default;
      await notifee.requestPermission();
    }

    await refresh();
  };

  const requestBattery = async () => {
    if (isExpoGo) {
      return;
    }

    try {
      const { requestIgnoreBatteryOptimizations } = await import(
        'expo-ignore-battery-optimizations'
      );
      await requestIgnoreBatteryOptimizations();
    } catch {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
      );
    }
    await refresh();
  };

  const requiredGranted = isExpoGo
    ? true
    : permissions.phoneState === 'granted' &&
      permissions.notifications === 'granted';

  return {
    permissions,
    refresh,
    requestPhoneState,
    requestNotifications,
    requestBattery,
    requiredGranted,
    isExpoGo,
  };
}

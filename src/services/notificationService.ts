import { isExpoGo } from '../platform/runtime';
import { NOTIFICATION } from '../constants/config';
import type { CellularInfo } from '../types/cellular';
import { familyToDotColor } from '../types';

let channelReady = false;

async function getNotifee() {
  if (isExpoGo) {
    return null;
  }

  return import('react-native-notify-kit');
}

export async function ensureNotificationChannel() {
  if (isExpoGo || channelReady) {
    return;
  }

  const notifee = await getNotifee();
  if (!notifee) {
    return;
  }

  await notifee.default.createChannel({
    id: NOTIFICATION.channelId,
    name: NOTIFICATION.channelName,
    importance: notifee.AndroidImportance.LOW,
    vibration: false,
  });

  channelReady = true;
}

export async function updateMonitorNotification(
  cellular: CellularInfo,
  download: string,
  upload: string,
) {
  if (isExpoGo) {
    return;
  }

  const notifee = await getNotifee();
  if (!notifee) {
    return;
  }

  await ensureNotificationChannel();

  const carrier = cellular.carrier ?? 'Cellular';
  const dotColor = familyToDotColor(cellular.family);

  await notifee.default.displayNotification({
    id: NOTIFICATION.id,
    title: 'Stratum',
    body: `● ${cellular.label}  •  ${carrier}\n↓ ${download}     ↑ ${upload}`,
    android: {
      channelId: NOTIFICATION.channelId,
      asForegroundService: true,
      ongoing: true,
      color: dotColor,
      colorized: true,
      smallIcon: 'ic_stat_stratum',
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      actions: [
        {
          title: '✕',
          pressAction: {
            id: NOTIFICATION.stopActionId,
          },
        },
      ],
    },
  });
}

export async function dismissMonitorNotification() {
  if (isExpoGo) {
    return;
  }

  const notifee = await getNotifee();
  if (!notifee) {
    return;
  }

  await notifee.default.stopForegroundService();
  await notifee.default.cancelNotification(NOTIFICATION.id);
}

export async function requestNotificationPermission() {
  if (isExpoGo) {
    return;
  }

  const notifee = await getNotifee();
  if (!notifee) {
    return;
  }

  await notifee.default.requestPermission();
}

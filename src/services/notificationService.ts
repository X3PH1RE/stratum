import notifee, { AndroidImportance } from 'react-native-notify-kit';

import { NOTIFICATION } from '../constants/config';
import type { CellularInfo } from '../types';
import { familyToDotColor } from '../types';

let channelReady = false;

export async function ensureNotificationChannel() {
  if (channelReady) {
    return;
  }

  await notifee.createChannel({
    id: NOTIFICATION.channelId,
    name: NOTIFICATION.channelName,
    importance: AndroidImportance.LOW,
    vibration: false,
  });

  channelReady = true;
}

export async function updateMonitorNotification(
  cellular: CellularInfo,
  download: string,
  upload: string,
) {
  await ensureNotificationChannel();

  const carrier = cellular.carrier ?? 'Cellular';
  const dotColor = familyToDotColor(cellular.family);

  await notifee.displayNotification({
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
  await notifee.stopForegroundService();
  await notifee.cancelNotification(NOTIFICATION.id);
}

export async function requestNotificationPermission() {
  await notifee.requestPermission();
}

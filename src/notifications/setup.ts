import notifee, { EventType } from 'react-native-notify-kit';

import { NOTIFICATION } from '../constants/config';
import { monitoringController } from '../services/monitoringController';

let registered = false;

export function registerNotificationHandlers() {
  if (registered) {
    return;
  }
  registered = true;

  notifee.registerForegroundService(() => {
    return new Promise(() => {
      // Keeps the Android foreground service alive while monitoring runs.
    });
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === NOTIFICATION.stopActionId
    ) {
      await monitoringController.stop();
    }
  });

  notifee.onForegroundEvent(({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === NOTIFICATION.stopActionId
    ) {
      void monitoringController.stop();
    }
  });
}

registerNotificationHandlers();

import { isExpoGo } from '../platform/runtime';
import { NOTIFICATION } from '../constants/config';
import { monitoringController } from '../services/monitoringController';

let registered = false;

export async function registerNotificationHandlers() {
  if (registered || isExpoGo) {
    return;
  }
  registered = true;

  const notifee = await import('react-native-notify-kit');
  const { EventType } = notifee;

  notifee.default.registerForegroundService(() => {
    return new Promise(() => {
      // Keeps the Android foreground service alive while monitoring runs.
    });
  });

  notifee.default.onBackgroundEvent(async ({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === NOTIFICATION.stopActionId
    ) {
      await monitoringController.stop();
    }
  });

  notifee.default.onForegroundEvent(({ type, detail }) => {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === NOTIFICATION.stopActionId
    ) {
      void monitoringController.stop();
    }
  });
}

void registerNotificationHandlers();

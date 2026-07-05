import AsyncStorage from '@react-native-async-storage/async-storage';

import { POLL_INTERVAL_MS, STORAGE_KEYS } from '../constants/config';
import { readCellularInfo, readMobileTrafficStats } from '../platform/nativeApi';
import { isExpoGo } from '../platform/runtime';
import type { CellularInfo } from '../types/cellular';
import {
  dismissMonitorNotification,
  requestNotificationPermission,
  updateMonitorNotification,
} from './notificationService';
import { SpeedTracker } from './speedCalculator';

type MonitoringListener = (state: MonitoringState) => void;

export type MonitoringState = {
  running: boolean;
  cellular: CellularInfo;
  download: string;
  upload: string;
  previewMode: boolean;
};

const defaultCellular: CellularInfo = {
  label: 'Unknown',
  family: 'other',
  carrier: null,
};

class MonitoringController {
  private interval: ReturnType<typeof setInterval> | null = null;
  private speedTracker = new SpeedTracker();
  private listeners = new Set<MonitoringListener>();
  private state: MonitoringState = {
    running: false,
    cellular: defaultCellular,
    download: '—',
    upload: '—',
    previewMode: isExpoGo,
  };

  subscribe(listener: MonitoringListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  isRunning() {
    return this.state.running;
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private setState(patch: Partial<MonitoringState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  async loadPersistedEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.monitoringEnabled);
    return value === 'true';
  }

  async setPersistedEnabled(enabled: boolean) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.monitoringEnabled,
      enabled ? 'true' : 'false',
    );
  }

  async start() {
    if (this.state.running) {
      return;
    }

    if (!isExpoGo) {
      await requestNotificationPermission();
    }

    this.speedTracker.reset();
    this.setState({ running: true });

    await this.tick();
    this.interval = setInterval(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);

    await this.setPersistedEnabled(true);
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.speedTracker.reset();
    await dismissMonitorNotification();

    this.setState({
      running: false,
      download: isExpoGo ? '—' : '—',
      upload: '—',
    });

    await this.setPersistedEnabled(false);
  }

  private async tick() {
    try {
      const cellular = await readCellularInfo();
      const traffic = await readMobileTrafficStats();
      const speeds = this.speedTracker.sample(
        traffic.rxBytes,
        traffic.txBytes,
        traffic.timestamp,
      );

      const download = isExpoGo ? 'Preview' : speeds.download;
      const upload = isExpoGo ? 'Preview' : speeds.upload;

      this.setState({
        cellular,
        download,
        upload,
      });

      if (!isExpoGo) {
        await updateMonitorNotification(cellular, speeds.download, speeds.upload);
      }
    } catch (error) {
      console.warn('Monitoring tick failed', error);
    }
  }
}

export const monitoringController = new MonitoringController();

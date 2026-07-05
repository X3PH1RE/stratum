export const STORAGE_KEYS = {
  monitoringEnabled: '@stratum/monitoring-enabled',
} as const;

export const NOTIFICATION = {
  id: 'stratum-monitor',
  channelId: 'stratum-monitor',
  channelName: 'Network Monitor',
  stopActionId: 'stop',
} as const;

export const POLL_INTERVAL_MS = 1000;

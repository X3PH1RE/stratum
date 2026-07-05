import type { CellularInfo, NetworkSample } from '../types/cellular';
import { getCellularInfoFromNetInfo, mergeCellularInfo } from '../types';
import { isExpoGo } from './runtime';

const unknownCellular: CellularInfo = {
  label: 'Unknown',
  family: 'other',
  carrier: null,
};

export async function readCellularInfo(): Promise<CellularInfo> {
  if (isExpoGo) {
    return getCellularInfoFromNetInfo();
  }

  try {
    const { getCellularInfo } = await import('expo-stratum-core');
    const nativeInfo = getCellularInfo();
    return mergeCellularInfo(nativeInfo);
  } catch {
    return getCellularInfoFromNetInfo();
  }
}

export async function readMobileTrafficStats(): Promise<NetworkSample> {
  if (isExpoGo) {
    return {
      rxBytes: 0,
      txBytes: 0,
      timestamp: Date.now(),
    };
  }

  try {
    const { getMobileTrafficStats } = await import('expo-stratum-core');
    return getMobileTrafficStats();
  } catch {
    return {
      rxBytes: 0,
      txBytes: 0,
      timestamp: Date.now(),
    };
  }
}

export { unknownCellular };

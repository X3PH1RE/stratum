import ExpoStratumCore from './ExpoStratumCoreModule';

export type { CellularFamily, CellularInfo, CellularLabel, NetworkSample } from './ExpoStratumCore.types';

export function getMobileTrafficStats() {
  return ExpoStratumCore.getMobileTrafficStats();
}

export function getCellularInfo() {
  return ExpoStratumCore.getCellularInfo();
}

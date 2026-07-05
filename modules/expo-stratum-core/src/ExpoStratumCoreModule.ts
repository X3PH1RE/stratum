import { NativeModule, requireNativeModule } from 'expo';

import type { CellularInfo, NetworkSample } from './ExpoStratumCore.types';

declare class ExpoStratumCoreModule extends NativeModule {
  getMobileTrafficStats(): NetworkSample;
  getCellularInfo(): CellularInfo;
}

export default requireNativeModule<ExpoStratumCoreModule>('ExpoStratumCore');

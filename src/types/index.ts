import type { CellularFamily, CellularInfo, CellularLabel } from 'expo-stratum-core';
import NetInfo from '@react-native-community/netinfo';

export type { CellularFamily, CellularInfo, CellularLabel };

export function familyToDotColor(family: CellularFamily): string {
  switch (family) {
    case 'fourG':
      return '#FF453A';
    case 'fiveG':
      return '#32D74B';
    default:
      return '#636366';
  }
}

function netInfoToLabel(generation: string | null | undefined): CellularLabel {
  switch (generation) {
    case '5g':
      return '5G';
    case '4g':
      return '4G';
    case '3g':
      return '3G';
    case '2g':
      return '2G';
    default:
      return 'Unknown';
  }
}

function netInfoToFamily(generation: string | null | undefined): CellularFamily {
  switch (generation) {
    case '5g':
      return 'fiveG';
    case '4g':
      return 'fourG';
    default:
      return 'other';
  }
}

export async function getCellularInfoWithFallback(
  nativeInfo: CellularInfo,
): Promise<CellularInfo> {
  if (nativeInfo.label !== 'Unknown' && nativeInfo.family !== 'other') {
    return nativeInfo;
  }

  const state = await NetInfo.fetch();
  if (state.type !== 'cellular') {
    return {
      label: 'Unknown',
      family: 'other',
      carrier: nativeInfo.carrier,
    };
  }

  const generation =
    state.type === 'cellular' ? state.details?.cellularGeneration : null;

  return {
    label: netInfoToLabel(generation),
    family: netInfoToFamily(generation),
    carrier:
      nativeInfo.carrier ??
      (state.type === 'cellular' ? state.details?.carrier ?? null : null),
  };
}

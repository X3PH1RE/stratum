import type { CellularFamily, CellularInfo, CellularLabel } from './cellular';

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

export async function getCellularInfoFromNetInfo(): Promise<CellularInfo> {
  const NetInfo = (await import('@react-native-community/netinfo')).default;
  const state = await NetInfo.fetch();

  if (state.type !== 'cellular') {
    return {
      label: 'Unknown',
      family: 'other',
      carrier: null,
    };
  }

  const generation = state.details?.cellularGeneration ?? null;

  return {
    label: netInfoToLabel(generation),
    family: netInfoToFamily(generation),
    carrier: state.details?.carrier ?? null,
  };
}

export async function mergeCellularInfo(
  nativeInfo: CellularInfo,
): Promise<CellularInfo> {
  if (nativeInfo.label !== 'Unknown' && nativeInfo.family !== 'other') {
    return nativeInfo;
  }

  return getCellularInfoFromNetInfo();
}

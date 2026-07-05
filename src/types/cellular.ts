export type CellularLabel =
  | 'LTE'
  | 'LTE+'
  | '5G'
  | '5G+'
  | '4G'
  | '3G'
  | '2G'
  | 'Unknown';

export type CellularFamily = 'fourG' | 'fiveG' | 'other';

export type CellularInfo = {
  label: CellularLabel;
  family: CellularFamily;
  carrier: string | null;
};

export type NetworkSample = {
  rxBytes: number;
  txBytes: number;
  timestamp: number;
};

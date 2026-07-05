export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return '0 KB/s';
  }

  const bitsPerSecond = bytesPerSecond * 8;
  const mbps = bitsPerSecond / 1_000_000;

  if (mbps >= 1) {
    return `${mbps.toFixed(1)} Mbps`;
  }

  const kbps = bitsPerSecond / 1000;
  return `${Math.round(kbps)} KB/s`;
}

export type SpeedSample = {
  download: string;
  upload: string;
  downloadBps: number;
  uploadBps: number;
};

export class SpeedTracker {
  private lastRx = 0;
  private lastTx = 0;
  private lastTime = 0;

  sample(rxBytes: number, txBytes: number, timestamp: number): SpeedSample {
    if (this.lastTime === 0) {
      this.lastRx = rxBytes;
      this.lastTx = txBytes;
      this.lastTime = timestamp;
      return {
        download: '—',
        upload: '—',
        downloadBps: 0,
        uploadBps: 0,
      };
    }

    const elapsedSeconds = (timestamp - this.lastTime) / 1000;
    if (elapsedSeconds <= 0) {
      return {
        download: '—',
        upload: '—',
        downloadBps: 0,
        uploadBps: 0,
      };
    }

    const downloadBps = Math.max(0, (rxBytes - this.lastRx) / elapsedSeconds);
    const uploadBps = Math.max(0, (txBytes - this.lastTx) / elapsedSeconds);

    this.lastRx = rxBytes;
    this.lastTx = txBytes;
    this.lastTime = timestamp;

    return {
      download: formatSpeed(downloadBps),
      upload: formatSpeed(uploadBps),
      downloadBps,
      uploadBps,
    };
  }

  reset() {
    this.lastRx = 0;
    this.lastTx = 0;
    this.lastTime = 0;
  }
}

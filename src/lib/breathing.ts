export type BreathingCategory = {
  label: string;
  severity: 'low' | 'normal' | 'elevated' | 'high';
};

export function detectPeaks(samples: number[], threshold = 0.1): number {
  if (samples.length < 3) return 0;
  let peaks = 0;
  let lastTrough = samples[0];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    const next = samples[i + 1];
    if (curr > prev && curr > next) {
      if (curr - lastTrough > threshold) {
        peaks++;
        lastTrough = curr;
      }
    } else if (curr < prev && curr < next) {
      lastTrough = curr;
    }
  }
  return peaks;
}

export function calculateBreathsPerMinute(peakCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((peakCount / durationSeconds) * 60);
}

export function categoriseBreathingRate(bpm: number): BreathingCategory {
  if (bpm < 12) return { label: 'Slow / resting', severity: 'low' };
  if (bpm <= 20) return { label: 'Normal', severity: 'normal' };
  if (bpm <= 30) return { label: 'Elevated', severity: 'elevated' };
  return { label: 'High', severity: 'high' };
}

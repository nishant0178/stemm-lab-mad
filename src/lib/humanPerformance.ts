export type SmoothnessCategory = {
  label: string;
  severity: 'graceful' | 'smooth' | 'rough' | 'jerky';
};

export function calculateJerk(
  samples: { x: number; y: number; z: number }[],
): number[] {
  if (samples.length < 2) return [];
  const magnitudes = samples.map((s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z));
  const jerks: number[] = [];
  for (let i = 1; i < magnitudes.length; i++) {
    jerks.push(Math.abs(magnitudes[i] - magnitudes[i - 1]));
  }
  return jerks;
}

export function calculateSmoothnessScore(
  samples: { x: number; y: number; z: number }[],
): number {
  if (samples.length < 2) return 100;
  const jerks = calculateJerk(samples);
  const totalJerk = jerks.reduce((sum, j) => sum + j, 0);
  return Math.max(0, Math.min(100, Math.round(100 - totalJerk * 10)));
}

export function categoriseSmoothness(score: number): SmoothnessCategory {
  if (score >= 80) return { label: 'Graceful — excellent control', severity: 'graceful' };
  if (score >= 60) return { label: 'Smooth — good control', severity: 'smooth' };
  if (score >= 40) return { label: 'Rough — uneven motion', severity: 'rough' };
  return { label: 'Jerky — try slower next time', severity: 'jerky' };
}

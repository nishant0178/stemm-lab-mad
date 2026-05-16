export type StabilityCategory = {
  label: string;
  severity: 'excellent' | 'good' | 'fair' | 'poor';
};

export function calculateStabilityScore(
  samples: { x: number; y: number; z: number }[],
): number {
  if (samples.length === 0) return 100;

  const magnitudes = samples.map(({ x, y, z }) =>
    Math.sqrt(x * x + y * y + (z - 1) * (z - 1)),
  );

  const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const variance =
    magnitudes.reduce((a, b) => a + (b - mean) ** 2, 0) / magnitudes.length;

  return Math.min(100, Math.max(0, Math.round(100 - variance * 50)));
}

export function categoriseStability(score: number): StabilityCategory {
  if (score >= 80) return { label: 'Excellent — minimal motion', severity: 'excellent' };
  if (score >= 60) return { label: 'Good — small movement', severity: 'good' };
  if (score >= 40) return { label: 'Fair — noticeable movement', severity: 'fair' };
  return { label: 'Poor — significant movement', severity: 'poor' };
}

export type SoundCategory = {
  label: string;
  severity: 'safe' | 'caution' | 'warning' | 'danger';
};

export function calculateAverageDb(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sum = samples.reduce((acc, v) => acc + v, 0);
  return parseFloat((sum / samples.length).toFixed(1));
}

export function calculatePeakDb(samples: number[]): number {
  if (samples.length === 0) return 0;
  return parseFloat(Math.max(...samples).toFixed(1));
}

export function categoriseSoundLevel(db: number): SoundCategory {
  if (db < 30) return { label: 'Whisper / Quiet library — Safe', severity: 'safe' };
  if (db < 60) return { label: 'Normal conversation — Safe', severity: 'caution' };
  if (db < 85) return { label: 'Busy traffic — Caution on long exposure', severity: 'warning' };
  return { label: 'Loud — Hearing damage risk', severity: 'danger' };
}

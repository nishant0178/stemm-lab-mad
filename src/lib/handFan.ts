export type FanMaterial = 'printer' | 'cardstock' | 'thinCardboard' | 'corrugated';

export type TrialSummary = {
  maxForce: number;
  minForce: number;
  averageForce: number;
};

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getStiffnessCoefficient(material: FanMaterial): number {
  switch (material) {
    case 'printer': return 0.05;
    case 'cardstock': return 0.2;
    case 'thinCardboard': return 0.5;
    case 'corrugated': return 2.5;
  }
}

export function calculateForce(stiffness: number, angleRadians: number): number {
  return stiffness * angleRadians;
}

export function compareTrials(trials: { force: number }[]): TrialSummary {
  if (trials.length === 0) return { maxForce: 0, minForce: 0, averageForce: 0 };
  const forces = trials.map((t) => t.force);
  const max = Math.max(...forces);
  const min = Math.min(...forces);
  const avg = forces.reduce((sum, f) => sum + f, 0) / forces.length;
  return { maxForce: max, minForce: min, averageForce: avg };
}

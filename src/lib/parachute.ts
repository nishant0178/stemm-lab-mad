export type ParachuteCategory = {
  label: string;
  severity: 'excellent' | 'good' | 'some' | 'none';
};

export function calculateFinalVelocity(heightMeters: number, fallTimeSeconds: number): number {
  if (fallTimeSeconds <= 0) return 0;
  return heightMeters / fallTimeSeconds;
}

export function calculateAcceleration(finalVelocity: number, fallTimeSeconds: number): number {
  if (fallTimeSeconds <= 0) return 0;
  return finalVelocity / fallTimeSeconds;
}

export function calculateWeight(massKg: number, gravity: number = 9.8): number {
  return massKg * gravity;
}

export function calculateNetForce(massKg: number, accelerationMs2: number): number {
  return massKg * accelerationMs2;
}

export function calculateDragForce(weight: number, netForce: number): number {
  return weight - netForce;
}

export function calculateGForce(
  finalVelocity: number,
  contactTimeSeconds: number,
  gravity: number = 9.8,
): number {
  if (contactTimeSeconds <= 0) return 0;
  return (finalVelocity / contactTimeSeconds) / gravity;
}

export function categoriseParachute(
  weight: number,
  dragForce: number,
): ParachuteCategory {
  if (dragForce > weight * 1.5) return { label: 'Excellent parachute — strong drag', severity: 'excellent' };
  if (dragForce > weight * 0.5) return { label: 'Good parachute — moderate drag', severity: 'good' };
  if (dragForce > 0) return { label: 'Some drag — try a larger parachute', severity: 'some' };
  return { label: 'No effective drag — needs redesign', severity: 'none' };
}

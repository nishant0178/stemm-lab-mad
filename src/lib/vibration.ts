/** Magnitude of acceleration with gravity baseline removed. Can be negative during deceleration. */
export const calculateMagnitude = (x: number, y: number, z: number): number =>
  Math.sqrt(x * x + y * y + z * z) - 1;

/** RMS variance of magnitudes over a recording session. Lower = steadier. */
export const calculateMotionScore = (magnitudes: number[]): number => {
  if (magnitudes.length === 0) return 0;
  const variance = magnitudes.reduce((sum, m) => sum + m * m, 0) / magnitudes.length;
  return parseFloat(variance.toFixed(2));
};

export const describeScore = (score: number): string => {
  if (score < 0.05) return 'Rock solid! 🪨';
  if (score < 0.3)  return 'Pretty steady 👍';
  if (score < 1.0)  return 'A bit shaky 🌊';
  return 'Wobbly! 🤪';
};

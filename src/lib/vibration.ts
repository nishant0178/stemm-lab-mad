/** Magnitude of acceleration with gravity baseline removed. Can be negative during deceleration. */
export const calculateMagnitude = (x: number, y: number, z: number): number =>
  Math.sqrt(x * x + y * y + z * z) - 1;

/** Peak absolute magnitude across the recording session. Lower = steadier.
 *  Using peak (not RMS) so a single drop or jerk isn't averaged away. */
export const calculateMotionScore = (magnitudes: number[]): number => {
  if (magnitudes.length === 0) return 0;
  const peak = Math.max(...magnitudes.map((m) => Math.abs(m)));
  return parseFloat(peak.toFixed(2));
};

export const describeScore = (score: number): string => {
  if (score < 0.15) return 'Rock solid! 🪨';
  if (score < 0.5)  return 'Pretty steady 👍';
  if (score < 1.0)  return 'A bit shaky 🌊';
  return 'Wobbly! 🤪';
};

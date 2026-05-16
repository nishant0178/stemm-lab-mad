import { calculateStabilityScore, categoriseStability } from '../src/lib/earthquake';

const REST = { x: 0, y: 0, z: 1 };

describe('calculateStabilityScore', () => {
  it('returns 100 for empty samples (no motion = perfect)', () => {
    expect(calculateStabilityScore([])).toBe(100);
  });

  it('returns 100 for a single zero-motion sample', () => {
    expect(calculateStabilityScore([REST])).toBe(100);
  });

  it('returns 100 for constant gravity samples (perfectly still)', () => {
    const samples = [REST, REST, REST, REST, REST];
    expect(calculateStabilityScore(samples)).toBe(100);
  });

  it('returns a lower score for high-variance samples', () => {
    // Alternate between z=4 (mag=3) and z=1 (mag=0) — variance > 1 → score < 50
    const shaky = [
      { x: 0, y: 0, z: 4 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 4 },
      { x: 0, y: 0, z: 1 },
    ];
    expect(calculateStabilityScore(shaky)).toBeLessThan(50);
  });

  it('score is capped at 100', () => {
    // perfectly still — should not exceed 100
    const still = Array(100).fill(REST);
    expect(calculateStabilityScore(still)).toBeLessThanOrEqual(100);
  });

  it('score is floored at 0', () => {
    // extreme motion — must not go negative
    const extreme = Array(10).fill({ x: 10, y: 10, z: 10 });
    expect(calculateStabilityScore(extreme)).toBeGreaterThanOrEqual(0);
  });

  it('scores a slightly shaky sample lower than a still sample', () => {
    const still = [REST, REST, REST];
    // Alternate z=1.3 (mag=0.3) and z=1 (mag=0) — small but real variance
    const shaky = [
      { x: 0, y: 0, z: 1.3 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 1.3 },
    ];
    expect(calculateStabilityScore(still)).toBeGreaterThan(calculateStabilityScore(shaky));
  });

  it('returns an integer', () => {
    expect(Number.isInteger(calculateStabilityScore([REST, { x: 0.1, y: 0, z: 1 }]))).toBe(true);
  });
});

describe('categoriseStability', () => {
  it('classifies 100 as excellent', () => {
    expect(categoriseStability(100).severity).toBe('excellent');
  });

  it('classifies 80 as excellent (lower boundary)', () => {
    expect(categoriseStability(80).severity).toBe('excellent');
  });

  it('classifies 79 as good', () => {
    expect(categoriseStability(79).severity).toBe('good');
  });

  it('classifies 60 as good (lower boundary)', () => {
    expect(categoriseStability(60).severity).toBe('good');
  });

  it('classifies 59 as fair', () => {
    expect(categoriseStability(59).severity).toBe('fair');
  });

  it('classifies 40 as fair (lower boundary)', () => {
    expect(categoriseStability(40).severity).toBe('fair');
  });

  it('classifies 39 as poor', () => {
    expect(categoriseStability(39).severity).toBe('poor');
  });

  it('classifies 0 as poor', () => {
    expect(categoriseStability(0).severity).toBe('poor');
  });
});

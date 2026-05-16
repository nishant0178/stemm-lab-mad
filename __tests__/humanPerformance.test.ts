import {
  calculateJerk,
  calculateSmoothnessScore,
  categoriseSmoothness,
} from '../src/lib/humanPerformance';

const S = (x: number, y: number, z: number) => ({ x, y, z });

describe('calculateJerk', () => {
  it('returns empty array for empty input', () => {
    expect(calculateJerk([])).toEqual([]);
  });

  it('returns empty array for single sample', () => {
    expect(calculateJerk([S(0, 0, 1)])).toEqual([]);
  });

  it('returns array of length 1 for two samples', () => {
    expect(calculateJerk([S(0, 0, 1), S(0, 0, 1)])).toHaveLength(1);
  });

  it('returns 0 jerk for two identical samples', () => {
    expect(calculateJerk([S(1, 2, 3), S(1, 2, 3)])[0]).toBe(0);
  });

  it('returns correct jerk for two samples with known magnitudes', () => {
    // mag(3,4,0) = 5, mag(0,0,0) = 0 → jerk = 5
    const result = calculateJerk([S(3, 4, 0), S(0, 0, 0)]);
    expect(result[0]).toBeCloseTo(5, 5);
  });
});

describe('calculateSmoothnessScore', () => {
  it('returns 100 for empty samples (no measurable jerk)', () => {
    expect(calculateSmoothnessScore([])).toBe(100);
  });

  it('returns 100 for single sample', () => {
    expect(calculateSmoothnessScore([S(0, 0, 1)])).toBe(100);
  });

  it('returns 100 for two identical samples (zero jerk)', () => {
    expect(calculateSmoothnessScore([S(1, 0, 0), S(1, 0, 0)])).toBe(100);
  });

  it('returns a low score for highly varying samples', () => {
    // mag swings from 0 to ~8.66 → totalJerk = 8.66 → score = 100 - 86.6 ≈ 13
    const samples = [S(0, 0, 0), S(5, 5, 5), S(0, 0, 0), S(5, 5, 5)];
    expect(calculateSmoothnessScore(samples)).toBeLessThan(40);
  });

  it('score is clamped to 0 for extreme jerk', () => {
    // totalJerk >> 10 → score would be negative without clamp
    const extreme = [S(0, 0, 0), S(100, 100, 100)];
    expect(calculateSmoothnessScore(extreme)).toBe(0);
  });

  it('score is clamped to 100 (never exceeds 100)', () => {
    const still = Array(50).fill(S(0, 0, 1));
    expect(calculateSmoothnessScore(still)).toBeLessThanOrEqual(100);
  });

  it('returns an integer', () => {
    expect(Number.isInteger(calculateSmoothnessScore([S(0, 0, 1), S(0.1, 0, 1)]))).toBe(true);
  });
});

describe('categoriseSmoothness', () => {
  it('classifies 100 as graceful', () => {
    expect(categoriseSmoothness(100).severity).toBe('graceful');
  });

  it('classifies 80 as graceful (lower boundary)', () => {
    expect(categoriseSmoothness(80).severity).toBe('graceful');
  });

  it('classifies 79 as smooth', () => {
    expect(categoriseSmoothness(79).severity).toBe('smooth');
  });

  it('classifies 60 as smooth (lower boundary)', () => {
    expect(categoriseSmoothness(60).severity).toBe('smooth');
  });

  it('classifies 59 as rough', () => {
    expect(categoriseSmoothness(59).severity).toBe('rough');
  });

  it('classifies 40 as rough (lower boundary)', () => {
    expect(categoriseSmoothness(40).severity).toBe('rough');
  });

  it('classifies 39 as jerky', () => {
    expect(categoriseSmoothness(39).severity).toBe('jerky');
  });

  it('classifies 0 as jerky', () => {
    expect(categoriseSmoothness(0).severity).toBe('jerky');
  });

  it('returns a non-empty label for all severity levels', () => {
    [100, 70, 50, 20].forEach((score) => {
      expect(categoriseSmoothness(score).label.length).toBeGreaterThan(0);
    });
  });
});

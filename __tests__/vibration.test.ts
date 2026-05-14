import {
  calculateMagnitude,
  calculateMotionScore,
  describeScore,
} from '../src/lib/vibration';

describe('calculateMagnitude', () => {
  test('(0, 0, 1) → 0: gravity baseline fully removed', () => {
    expect(calculateMagnitude(0, 0, 1)).toBeCloseTo(0);
  });

  test('(3, 4, 1) → 5: 3-4-5 triangle with z at rest', () => {
    // sqrt(3² + 4² + (1-1)²) = sqrt(9+16+0) = 5
    expect(calculateMagnitude(3, 4, 1)).toBeCloseTo(5);
  });

  test('(0, 0, 0) → 1: free fall registers as magnitude 1', () => {
    // sqrt(0 + 0 + (0-1)²) = sqrt(1) = 1
    expect(calculateMagnitude(0, 0, 0)).toBeCloseTo(1);
  });
});

describe('calculateMotionScore', () => {
  test('empty array → 0', () => {
    expect(calculateMotionScore([])).toBe(0);
  });

  test('returns peak absolute magnitude', () => {
    // max(|0.5|, |1.0|, |0.3|) = 1.0
    expect(calculateMotionScore([0.5, 1.0, 0.3])).toBeCloseTo(1.0);
  });

  test('handles negative magnitudes via abs', () => {
    // max(|-2.0|, |0.1|, |0.5|) = 2.0
    expect(calculateMotionScore([-2.0, 0.1, 0.5])).toBeCloseTo(2.0);
  });

  test('single sample → that sample', () => {
    expect(calculateMotionScore([0.42])).toBeCloseTo(0.42);
  });
});

describe('describeScore', () => {
  test('0.05 → Rock solid', () => {
    expect(describeScore(0.05)).toBe('Rock solid! 🪨');
  });

  test('0.3 → Pretty steady', () => {
    expect(describeScore(0.3)).toBe('Pretty steady 👍');
  });

  test('0.7 → A bit shaky', () => {
    expect(describeScore(0.7)).toBe('A bit shaky 🌊');
  });

  test('2.0 → Wobbly', () => {
    expect(describeScore(2.0)).toBe('Wobbly! 🤪');
  });

  test('boundary: exactly 0.15 → Pretty steady (not Rock solid)', () => {
    expect(describeScore(0.15)).toBe('Pretty steady 👍');
  });
});

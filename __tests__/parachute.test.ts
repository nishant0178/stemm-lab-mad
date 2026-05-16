import {
  calculateFinalVelocity,
  calculateAcceleration,
  calculateWeight,
  calculateNetForce,
  calculateDragForce,
  calculateGForce,
  categoriseParachute,
} from '../src/lib/parachute';

describe('calculateFinalVelocity', () => {
  it('returns correct velocity for spec example (1.0m / 0.5s = 2.0)', () => {
    expect(calculateFinalVelocity(1.0, 0.5)).toBeCloseTo(2.0);
  });

  it('returns 0 when height is 0', () => {
    expect(calculateFinalVelocity(0, 0.5)).toBe(0);
  });

  it('returns 0 when fallTime is 0 (no division by zero)', () => {
    expect(calculateFinalVelocity(1.0, 0)).toBe(0);
  });

  it('returns 0 when fallTime is negative', () => {
    expect(calculateFinalVelocity(1.0, -1)).toBe(0);
  });
});

describe('calculateAcceleration', () => {
  it('returns correct value for spec example (2.0 / 0.5 = 4.0)', () => {
    expect(calculateAcceleration(2.0, 0.5)).toBeCloseTo(4.0);
  });

  it('returns 0 when fallTime is 0 (no division by zero)', () => {
    expect(calculateAcceleration(2.0, 0)).toBe(0);
  });
});

describe('calculateWeight', () => {
  it('returns 1.96 N for 0.20 kg at default gravity (spec example)', () => {
    expect(calculateWeight(0.20)).toBeCloseTo(1.96);
  });

  it('returns 2.0 N for 0.20 kg at gravity 10', () => {
    expect(calculateWeight(0.20, 10)).toBeCloseTo(2.0);
  });
});

describe('calculateNetForce', () => {
  it('returns 0.8 N for 0.20 kg × 4.0 m/s² (spec example)', () => {
    expect(calculateNetForce(0.20, 4.0)).toBeCloseTo(0.8);
  });

  it('returns 0 for zero mass', () => {
    expect(calculateNetForce(0, 4.0)).toBe(0);
  });
});

describe('calculateDragForce', () => {
  it('returns ~1.16 N for weight=1.96, netForce=0.8 (spec example)', () => {
    expect(calculateDragForce(1.96, 0.8)).toBeCloseTo(1.16, 2);
  });

  it('returns negative when netForce exceeds weight', () => {
    expect(calculateDragForce(1.0, 2.0)).toBeCloseTo(-1.0);
  });
});

describe('calculateGForce', () => {
  it('returns ~4.08 g for velocity=2.0, contactTime=0.05 (spec example)', () => {
    expect(calculateGForce(2.0, 0.05)).toBeCloseTo(4.08, 1);
  });

  it('returns 0 when contactTime is 0 (no division by zero)', () => {
    expect(calculateGForce(2.0, 0)).toBe(0);
  });

  it('returns 0 when contactTime is negative', () => {
    expect(calculateGForce(2.0, -0.1)).toBe(0);
  });
});

describe('categoriseParachute', () => {
  it('returns excellent when drag > 1.5 × weight', () => {
    expect(categoriseParachute(1.96, 3.0).severity).toBe('excellent');
  });

  it('returns good when drag > 0.5 × weight but ≤ 1.5 × weight', () => {
    expect(categoriseParachute(1.96, 1.5).severity).toBe('good');
  });

  it('returns some when drag > 0 but ≤ 0.5 × weight', () => {
    expect(categoriseParachute(1.96, 0.5).severity).toBe('some');
  });

  it('returns none when drag is exactly 0', () => {
    expect(categoriseParachute(1.96, 0).severity).toBe('none');
  });

  it('returns none when drag is negative', () => {
    expect(categoriseParachute(1.96, -0.5).severity).toBe('none');
  });

  it('returns a non-empty label for every severity', () => {
    [
      [1.96, 3.0],
      [1.96, 1.5],
      [1.96, 0.5],
      [1.96, 0],
    ].forEach(([w, d]) => {
      expect(categoriseParachute(w, d).label.length).toBeGreaterThan(0);
    });
  });
});

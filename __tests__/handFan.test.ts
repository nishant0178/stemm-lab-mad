import {
  degreesToRadians,
  getStiffnessCoefficient,
  calculateForce,
  compareTrials,
} from '../src/lib/handFan';

describe('degreesToRadians', () => {
  it('converts 0° to 0', () => {
    expect(degreesToRadians(0)).toBe(0);
  });

  it('converts 180° to Math.PI', () => {
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
  });

  it('converts 90° to Math.PI / 2', () => {
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
  });

  it('converts 30° to ~0.524', () => {
    expect(degreesToRadians(30)).toBeCloseTo(0.5236, 4);
  });
});

describe('getStiffnessCoefficient', () => {
  it('returns 0.05 for printer (thin paper)', () => {
    expect(getStiffnessCoefficient('printer')).toBe(0.05);
  });

  it('returns 0.2 for cardstock', () => {
    expect(getStiffnessCoefficient('cardstock')).toBe(0.2);
  });

  it('returns 0.5 for thinCardboard', () => {
    expect(getStiffnessCoefficient('thinCardboard')).toBe(0.5);
  });

  it('returns 2.5 for corrugated', () => {
    expect(getStiffnessCoefficient('corrugated')).toBe(2.5);
  });
});

describe('calculateForce', () => {
  it('returns ~0.026 N for thin paper at 30° (spec example)', () => {
    const rad = degreesToRadians(30);
    expect(calculateForce(0.05, rad)).toBeCloseTo(0.0262, 3);
  });

  it('returns ~0.262 N for thin cardboard at 30° (spec example)', () => {
    const rad = degreesToRadians(30);
    expect(calculateForce(0.5, rad)).toBeCloseTo(0.2618, 3);
  });

  it('returns 0 when stiffness is 0', () => {
    expect(calculateForce(0, degreesToRadians(45))).toBe(0);
  });

  it('returns 0 when angle is 0 radians', () => {
    expect(calculateForce(0.5, 0)).toBe(0);
  });
});

describe('compareTrials', () => {
  it('returns zeros for empty trials array', () => {
    expect(compareTrials([])).toEqual({ maxForce: 0, minForce: 0, averageForce: 0 });
  });

  it('returns identical max/min/avg for a single trial', () => {
    const result = compareTrials([{ force: 0.15 }]);
    expect(result.maxForce).toBeCloseTo(0.15);
    expect(result.minForce).toBeCloseTo(0.15);
    expect(result.averageForce).toBeCloseTo(0.15);
  });

  it('returns correct max, min, and avg for [0.1, 0.5, 0.3]', () => {
    const result = compareTrials([
      { force: 0.1 },
      { force: 0.5 },
      { force: 0.3 },
    ]);
    expect(result.maxForce).toBeCloseTo(0.5);
    expect(result.minForce).toBeCloseTo(0.1);
    expect(result.averageForce).toBeCloseTo(0.3);
  });

  it('handles floating point values correctly', () => {
    const result = compareTrials([{ force: 0.0262 }, { force: 0.2618 }]);
    expect(result.maxForce).toBeCloseTo(0.2618, 4);
    expect(result.minForce).toBeCloseTo(0.0262, 4);
    expect(result.averageForce).toBeCloseTo(0.144, 3);
  });
});

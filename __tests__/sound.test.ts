import { calculateAverageDb, calculatePeakDb, categoriseSoundLevel } from '../src/lib/sound';

describe('calculateAverageDb', () => {
  it('returns 0 for empty array', () => {
    expect(calculateAverageDb([])).toBe(0);
  });

  it('returns the value itself for a single sample', () => {
    expect(calculateAverageDb([55])).toBe(55);
  });

  it('computes correct mean', () => {
    expect(calculateAverageDb([30, 60, 90])).toBe(60);
  });

  it('rounds to one decimal place', () => {
    expect(calculateAverageDb([10, 20, 30, 40])).toBe(25);
  });
});

describe('calculatePeakDb', () => {
  it('returns 0 for empty array', () => {
    expect(calculatePeakDb([])).toBe(0);
  });

  it('returns the value itself for a single sample', () => {
    expect(calculatePeakDb([42])).toBe(42);
  });

  it('returns the maximum value', () => {
    expect(calculatePeakDb([20, 85, 45, 60])).toBe(85);
  });
});

describe('categoriseSoundLevel', () => {
  it('classifies 0 as safe', () => {
    expect(categoriseSoundLevel(0).severity).toBe('safe');
  });

  it('classifies 29 as safe (boundary)', () => {
    expect(categoriseSoundLevel(29).severity).toBe('safe');
  });

  it('classifies 30 as caution', () => {
    expect(categoriseSoundLevel(30).severity).toBe('caution');
  });

  it('classifies 60 as warning (Busy traffic threshold)', () => {
    expect(categoriseSoundLevel(60).severity).toBe('warning');
  });

  it('classifies 85 as danger', () => {
    expect(categoriseSoundLevel(85).severity).toBe('danger');
  });

  it('classifies 100 as danger', () => {
    expect(categoriseSoundLevel(100).severity).toBe('danger');
  });

  it('returns a non-empty label for every severity', () => {
    [0, 45, 72, 90].forEach((db) => {
      expect(categoriseSoundLevel(db).label.length).toBeGreaterThan(0);
    });
  });
});

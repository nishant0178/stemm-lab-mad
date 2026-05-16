import { detectPeaks, calculateBreathsPerMinute, categoriseBreathingRate } from '../src/lib/breathing';

describe('detectPeaks', () => {
  it('returns 0 for empty array', () => {
    expect(detectPeaks([])).toBe(0);
  });

  it('returns 0 for single sample', () => {
    expect(detectPeaks([1])).toBe(0);
  });

  it('returns 0 for two samples', () => {
    expect(detectPeaks([0, 1])).toBe(0);
  });

  it('detects one peak in a simple rise-fall pattern', () => {
    expect(detectPeaks([0, 1, 0])).toBe(1);
  });

  it('returns 0 for monotonically rising sequence', () => {
    expect(detectPeaks([1, 2, 3, 4, 5])).toBe(0);
  });

  it('returns 0 for plateau (no local maxima)', () => {
    expect(detectPeaks([1, 1, 1, 1])).toBe(0);
  });

  it('filters out peaks below threshold', () => {
    // peak height = 0.05, threshold default = 0.1 → should not count
    expect(detectPeaks([0, 0.05, 0])).toBe(0);
  });

  it('detects multiple peaks in a sinusoidal-like pattern', () => {
    // 3 clear breath-like cycles
    const samples = [0, 0.5, 0, 0.5, 0, 0.5, 0];
    expect(detectPeaks(samples)).toBe(3);
  });

  it('counts only major peaks when noisy data mixes large and small swings', () => {
    // large peak then small noise peak below threshold
    const samples = [0, 0.5, 0, 0.05, 0];
    expect(detectPeaks(samples, 0.1)).toBe(1);
  });

  it('respects a custom threshold', () => {
    // peak of 0.3 — above threshold 0.2 → counted
    expect(detectPeaks([0, 0.3, 0], 0.2)).toBe(1);
    // same peak below threshold 0.5 → not counted
    expect(detectPeaks([0, 0.3, 0], 0.5)).toBe(0);
  });
});

describe('calculateBreathsPerMinute', () => {
  it('returns 0 if durationSeconds is 0', () => {
    expect(calculateBreathsPerMinute(10, 0)).toBe(0);
  });

  it('extrapolates 8 peaks in 30s to 16 bpm', () => {
    expect(calculateBreathsPerMinute(8, 30)).toBe(16);
  });

  it('rounds fractional bpm to nearest integer', () => {
    // 5 peaks in 30s = 10 bpm exactly
    expect(calculateBreathsPerMinute(5, 30)).toBe(10);
  });
});

describe('categoriseBreathingRate', () => {
  it('classifies 8 bpm as low', () => {
    expect(categoriseBreathingRate(8).severity).toBe('low');
  });

  it('classifies 12 bpm as normal (lower boundary)', () => {
    expect(categoriseBreathingRate(12).severity).toBe('normal');
  });

  it('classifies 20 bpm as normal (upper boundary)', () => {
    expect(categoriseBreathingRate(20).severity).toBe('normal');
  });

  it('classifies 25 bpm as elevated', () => {
    expect(categoriseBreathingRate(25).severity).toBe('elevated');
  });

  it('classifies 35 bpm as high', () => {
    expect(categoriseBreathingRate(35).severity).toBe('high');
  });

  it('returns a non-empty label for all severities', () => {
    [8, 15, 25, 35].forEach((bpm) => {
      expect(categoriseBreathingRate(bpm).label.length).toBeGreaterThan(0);
    });
  });
});

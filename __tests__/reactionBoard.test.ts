import {
  calculateReactionTime,
  getReactionGrade,
  isValidReaction,
} from '../src/lib/reactionBoard';

describe('calculateReactionTime', () => {
  test('returns correct delta for normal values', () => {
    expect(calculateReactionTime(1000, 1250)).toBe(250);
  });

  test('returns 0 for identical timestamps', () => {
    expect(calculateReactionTime(5000, 5000)).toBe(0);
  });

  test('returns large delta for slow reaction', () => {
    expect(calculateReactionTime(0, 8000)).toBe(8000);
  });
});

describe('getReactionGrade', () => {
  test('150ms → excellent', () => {
    expect(getReactionGrade(150)).toBe('excellent');
  });

  test('250ms → good', () => {
    expect(getReactionGrade(250)).toBe('good');
  });

  test('400ms → okay', () => {
    expect(getReactionGrade(400)).toBe('okay');
  });

  test('600ms → slow', () => {
    expect(getReactionGrade(600)).toBe('slow');
  });

  test('boundary: 200ms → good (not excellent)', () => {
    expect(getReactionGrade(200)).toBe('good');
  });
});

describe('isValidReaction', () => {
  test('50ms → false (physically impossible)', () => {
    expect(isValidReaction(50)).toBe(false);
  });

  test('99ms → false (below 100ms threshold)', () => {
    expect(isValidReaction(99)).toBe(false);
  });

  test('100ms → true (at threshold)', () => {
    expect(isValidReaction(100)).toBe(true);
  });

  test('250ms → true (normal reaction)', () => {
    expect(isValidReaction(250)).toBe(true);
  });
});

import { aggregateBestTimes, rankTeams, aggregateBestScores, rankByScore, ACTIVITY_CONFIGS } from '../src/lib/leaderboard';

describe('aggregateBestTimes', () => {
  test('3 scores from same team → 1 entry with lowest time', () => {
    const scores = [
      { teamId: 'A', reactionTimeMs: 300 },
      { teamId: 'A', reactionTimeMs: 200 },
      { teamId: 'A', reactionTimeMs: 400 },
    ];
    const result = aggregateBestTimes(scores);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ teamId: 'A', bestTimeMs: 200 });
  });

  test('scores from multiple teams → one entry per team with correct best', () => {
    const scores = [
      { teamId: 'A', reactionTimeMs: 400 },
      { teamId: 'B', reactionTimeMs: 300 },
      { teamId: 'C', reactionTimeMs: 500 },
      { teamId: 'B', reactionTimeMs: 250 },
    ];
    const result = aggregateBestTimes(scores);
    expect(result).toHaveLength(3);
    expect(result.find((r) => r.teamId === 'B')?.bestTimeMs).toBe(250);
    expect(result.find((r) => r.teamId === 'A')?.bestTimeMs).toBe(400);
    expect(result.find((r) => r.teamId === 'C')?.bestTimeMs).toBe(500);
  });

  test('empty scores → empty result', () => {
    expect(aggregateBestTimes([])).toEqual([]);
  });
});

describe('rankTeams', () => {
  test('empty array → empty array', () => {
    expect(rankTeams([])).toEqual([]);
  });

  test('sorts ascending and assigns ranks: B(300) < A(400) < C(500)', () => {
    const input = [
      { teamId: 'A', bestTimeMs: 400 },
      { teamId: 'B', bestTimeMs: 300 },
      { teamId: 'C', bestTimeMs: 500 },
    ];
    const result = rankTeams(input);
    expect(result[0]).toEqual({ teamId: 'B', bestTimeMs: 300, rank: 1 });
    expect(result[1]).toEqual({ teamId: 'A', bestTimeMs: 400, rank: 2 });
    expect(result[2]).toEqual({ teamId: 'C', bestTimeMs: 500, rank: 3 });
  });

  test('single team gets rank 1', () => {
    const result = rankTeams([{ teamId: 'X', bestTimeMs: 350 }]);
    expect(result[0].rank).toBe(1);
  });

  test('does not mutate the input array', () => {
    const input = [
      { teamId: 'A', bestTimeMs: 500 },
      { teamId: 'B', bestTimeMs: 200 },
    ];
    rankTeams(input);
    expect(input[0].teamId).toBe('A'); // original order preserved
  });
});

// ─── Multi-activity ranking ───────────────────────────────────────────────────

describe('aggregateBestScores', () => {
  test('empty array → empty result', () => {
    expect(aggregateBestScores([], 'score', 'lowerIsBetter')).toEqual([]);
  });

  test('lowerIsBetter picks minimum per team', () => {
    const scores = [
      { teamId: 'A', score: 300 },
      { teamId: 'A', score: 100 },
      { teamId: 'A', score: 200 },
    ];
    const result = aggregateBestScores(scores, 'score', 'lowerIsBetter');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ teamId: 'A', bestScore: 100 });
  });

  test('higherIsBetter picks maximum per team', () => {
    const scores = [
      { teamId: 'B', score: 60 },
      { teamId: 'B', score: 90 },
      { teamId: 'B', score: 75 },
    ];
    const result = aggregateBestScores(scores, 'score', 'higherIsBetter');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ teamId: 'B', bestScore: 90 });
  });

  test('ignores entries where scoreField is not a number', () => {
    const scores = [
      { teamId: 'A', score: 50 },
      { teamId: 'B', score: 'bad' as any },
      { teamId: 'C', score: null as any },
    ];
    const result = aggregateBestScores(scores, 'score', 'lowerIsBetter');
    expect(result).toHaveLength(1);
    expect(result[0].teamId).toBe('A');
  });

  test('handles multiple teams correctly', () => {
    const scores = [
      { teamId: 'A', val: 400 },
      { teamId: 'B', val: 300 },
      { teamId: 'A', val: 200 },
    ];
    const result = aggregateBestScores(scores, 'val', 'lowerIsBetter');
    expect(result.find((r) => r.teamId === 'A')?.bestScore).toBe(200);
    expect(result.find((r) => r.teamId === 'B')?.bestScore).toBe(300);
  });
});

describe('rankByScore', () => {
  test('lowerIsBetter assigns rank 1 to lowest score', () => {
    const teams = [
      { teamId: 'A', bestScore: 400 },
      { teamId: 'B', bestScore: 200 },
      { teamId: 'C', bestScore: 300 },
    ];
    const result = rankByScore(teams, 'lowerIsBetter');
    expect(result[0].teamId).toBe('B');
    expect(result[0].rank).toBe(1);
    expect(result[2].rank).toBe(3);
  });

  test('higherIsBetter assigns rank 1 to highest score', () => {
    const teams = [
      { teamId: 'A', bestScore: 60 },
      { teamId: 'B', bestScore: 90 },
      { teamId: 'C', bestScore: 75 },
    ];
    const result = rankByScore(teams, 'higherIsBetter');
    expect(result[0].teamId).toBe('B');
    expect(result[0].rank).toBe(1);
  });

  test('empty array → empty array', () => {
    expect(rankByScore([], 'lowerIsBetter')).toEqual([]);
  });

  test('does not mutate input', () => {
    const input = [
      { teamId: 'A', bestScore: 500 },
      { teamId: 'B', bestScore: 200 },
    ];
    rankByScore(input, 'lowerIsBetter');
    expect(input[0].teamId).toBe('A');
  });
});

describe('ACTIVITY_CONFIGS', () => {
  const EXPECTED_KEYS = [
    'reactionBoard', 'vibration', 'soundPollution', 'breathing',
    'earthquake', 'humanPerformance', 'parachute', 'handFan',
  ];

  test('has entries for all 8 activities', () => {
    EXPECTED_KEYS.forEach((key) => {
      expect(ACTIVITY_CONFIGS).toHaveProperty(key);
    });
  });

  test('each config has required fields', () => {
    Object.values(ACTIVITY_CONFIGS).forEach((config) => {
      expect(config).toHaveProperty('scoreField');
      expect(config).toHaveProperty('direction');
      expect(config).toHaveProperty('formatScore');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('shortLabel');
      expect(config).toHaveProperty('icon');
    });
  });

  test('formatScore returns a string for every config', () => {
    Object.values(ACTIVITY_CONFIGS).forEach((config) => {
      expect(typeof config.formatScore(42)).toBe('string');
    });
  });
});

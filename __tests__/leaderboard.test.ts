import { aggregateBestTimes, rankTeams } from '../src/lib/leaderboard';

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

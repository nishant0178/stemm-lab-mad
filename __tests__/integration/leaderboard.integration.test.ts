import { getLeaderboard } from '../../src/services/firestore';
import { getDocs, query, where } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection:      jest.fn(() => 'mock-collection'),
  addDoc:          jest.fn(),
  getDocs:         jest.fn(),
  doc:             jest.fn(() => 'mock-doc'),
  updateDoc:       jest.fn(),
  query:           jest.fn(() => 'mock-query'),
  where:           jest.fn(() => 'mock-where'),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  getDoc:          jest.fn(),
}));

jest.mock('../../src/config/firebase', () => ({ db: 'mock-db' }));

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

function makeScoreSnap(scores: Array<{ teamId: string; reactionTimeMs: number }>) {
  const docs = scores.map((s, i) => ({
    id: `score-${i}`,
    data: () => ({ ...s, activity: 'reactionBoard' }),
  }));
  return { docs, empty: docs.length === 0, forEach: (cb: (d: any) => void) => docs.forEach(cb) } as any;
}

function makeTeamSnap(teams: Array<{ id: string; name: string }>) {
  const docs = teams.map((t) => ({ id: t.id, data: () => ({ name: t.name }) }));
  return { docs, empty: docs.length === 0, forEach: (cb: (d: any) => void) => docs.forEach(cb) } as any;
}

beforeEach(() => jest.clearAllMocks());

describe('getLeaderboard', () => {
  test('calls getDocs to fetch scores collection', async () => {
    mockGetDocs.mockResolvedValueOnce(makeScoreSnap([]));
    await getLeaderboard('reactionBoard', 10);
    expect(getDocs).toHaveBeenCalled();
  });

  test('filters by activity using where', async () => {
    mockGetDocs.mockResolvedValueOnce(makeScoreSnap([]));
    await getLeaderboard('reactionBoard', 10);
    expect(where).toHaveBeenCalledWith('activity', '==', 'reactionBoard');
  });

  test('returns empty array when no scores exist', async () => {
    mockGetDocs.mockResolvedValueOnce(makeScoreSnap([]));
    const result = await getLeaderboard('reactionBoard', 10);
    expect(result).toEqual([]);
  });

  test('aggregates multiple scores per team and keeps lowest time', async () => {
    mockGetDocs
      .mockResolvedValueOnce(makeScoreSnap([
        { teamId: 'team-A', reactionTimeMs: 400 },
        { teamId: 'team-A', reactionTimeMs: 250 },
        { teamId: 'team-B', reactionTimeMs: 300 },
      ]))
      .mockResolvedValueOnce(makeTeamSnap([
        { id: 'team-A', name: 'Avengers' },
        { id: 'team-B', name: 'Rockets' },
      ]));

    const result = await getLeaderboard('reactionBoard', 10);
    expect(result).toHaveLength(2);
    const teamA = result.find((e) => e.teamId === 'team-A');
    expect(teamA?.bestReactionTimeMs).toBe(250);
  });

  test('returns ranked entries sorted ascending by best time', async () => {
    mockGetDocs
      .mockResolvedValueOnce(makeScoreSnap([
        { teamId: 'team-A', reactionTimeMs: 400 },
        { teamId: 'team-B', reactionTimeMs: 200 },
      ]))
      .mockResolvedValueOnce(makeTeamSnap([
        { id: 'team-A', name: 'Avengers' },
        { id: 'team-B', name: 'Rockets' },
      ]));

    const result = await getLeaderboard('reactionBoard', 10);
    expect(result[0].teamId).toBe('team-B');
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  test('respects limit — never returns more entries than requested', async () => {
    const scores = ['A', 'B', 'C', 'D', 'E'].map((id, i) => ({
      teamId: `team-${id}`,
      reactionTimeMs: (i + 1) * 100,
    }));
    const teams = ['A', 'B', 'C', 'D', 'E'].map((id) => ({
      id: `team-${id}`,
      name: `Team ${id}`,
    }));
    mockGetDocs
      .mockResolvedValueOnce(makeScoreSnap(scores))
      .mockResolvedValueOnce(makeTeamSnap(teams));

    const result = await getLeaderboard('reactionBoard', 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

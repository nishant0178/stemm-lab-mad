import { saveReactionBoardScore, saveVibrationScore } from '../../src/services/firestore';
import { addDoc } from 'firebase/firestore';

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

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAddDoc.mockResolvedValue({ id: 'mock-score-id' } as any);
});

describe('saveReactionBoardScore', () => {
  const payload = {
    teamId: 'team-abc123',
    userId: 'user-xyz789',
    activity: 'reactionBoard' as const,
    reactionTimeMs: 350,
    bestEverMs: 350,
  };

  test('calls addDoc exactly once', async () => {
    await saveReactionBoardScore(payload);
    expect(addDoc).toHaveBeenCalledTimes(1);
  });

  test('passes correct activity and reactionTimeMs to addDoc', async () => {
    await saveReactionBoardScore(payload);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ activity: 'reactionBoard', reactionTimeMs: 350 }),
    );
  });

  test('includes teamId and userId in the document', async () => {
    await saveReactionBoardScore(payload);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: 'team-abc123', userId: 'user-xyz789' }),
    );
  });

  test('includes an attemptedAt timestamp field', async () => {
    await saveReactionBoardScore(payload);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ attemptedAt: expect.anything() }),
    );
  });

  test('returns the new document id', async () => {
    const id = await saveReactionBoardScore(payload);
    expect(id).toBe('mock-score-id');
  });

  test('throws when addDoc rejects', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));
    await expect(saveReactionBoardScore(payload)).rejects.toThrow('Firestore unavailable');
  });
});

describe('saveVibrationScore', () => {
  const payload = {
    teamId: 'team-abc123',
    userId: 'user-xyz789',
    activity: 'vibration' as const,
    motionScore: 1.2,
  };

  test('calls addDoc with activity: vibration and motionScore: 1.2', async () => {
    await saveVibrationScore(payload);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ activity: 'vibration', motionScore: 1.2 }),
    );
  });

  test('includes an attemptedAt timestamp field', async () => {
    await saveVibrationScore(payload);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ attemptedAt: expect.anything() }),
    );
  });

  test('calls addDoc exactly once', async () => {
    await saveVibrationScore(payload);
    expect(addDoc).toHaveBeenCalledTimes(1);
  });
});

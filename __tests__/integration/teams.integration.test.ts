import { createTeam, updateTeamLocation } from '../../src/services/firestore';
import { addDoc, updateDoc, getDocs } from 'firebase/firestore';

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

const mockAddDoc    = addDoc    as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockGetDocs   = getDocs   as jest.MockedFunction<typeof getDocs>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAddDoc.mockResolvedValue({ id: 'new-team-id' } as any);
  mockUpdateDoc.mockResolvedValue(undefined as any);
});

describe('createTeam', () => {
  const teamData = {
    name: 'Avengers',
    yearLevel: 'Year 10',
    members: ['nishant', 'alice'],
    createdBy: 'user-xyz',
  };

  test('calls addDoc to create a document in teams collection', async () => {
    await createTeam(teamData);
    expect(addDoc).toHaveBeenCalledTimes(1);
  });

  test('passes team name, yearLevel, and members to addDoc', async () => {
    await createTeam(teamData);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'Avengers',
        yearLevel: 'Year 10',
        members: ['nishant', 'alice'],
      }),
    );
  });

  test('includes createdAt timestamp in the document', async () => {
    await createTeam(teamData);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ createdAt: expect.anything() }),
    );
  });

  test('returns team object with the new document id', async () => {
    const result = await createTeam(teamData);
    expect(result.id).toBe('new-team-id');
    expect(result.name).toBe('Avengers');
  });

  test('throws when addDoc rejects', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(createTeam(teamData)).rejects.toThrow('Permission denied');
  });
});

describe('updateTeamLocation', () => {
  const location = { latitude: -37.8136, longitude: 144.9631 };

  test('calls updateDoc exactly once', async () => {
    await updateTeamLocation('team-abc', location);
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });

  test('writes location field containing latitude and longitude', async () => {
    await updateTeamLocation('team-abc', location);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        location: expect.objectContaining({
          latitude: -37.8136,
          longitude: 144.9631,
        }),
      }),
    );
  });

  test('location field includes lastUpdated timestamp', async () => {
    await updateTeamLocation('team-abc', location);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        location: expect.objectContaining({ lastUpdated: expect.any(Number) }),
      }),
    );
  });
});

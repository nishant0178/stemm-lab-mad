import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Team, ReactionBoardScore, VibrationScore, LeaderboardEntry } from '../types';

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function createTeam(
  data: Omit<Team, 'id'>,
): Promise<Team> {
  const ref = await addDoc(collection(db, 'teams'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return { ...data, id: ref.id };
}

export async function getTeamByUser(uid: string): Promise<Team | null> {
  const q = query(collection(db, 'teams'), where('createdBy', '==', uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const snap = snapshot.docs[0];
  return { id: snap.id, ...(snap.data() as Omit<Team, 'id'>) };
}

// ─── Scores ───────────────────────────────────────────────────────────────────

export async function saveReactionBoardScore(
  score: Omit<ReactionBoardScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveVibrationScore(
  score: Omit<VibrationScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(
  activity: string,
  limit: number = 10,
): Promise<LeaderboardEntry[]> {
  // Fetch all scores for this activity
  const scoresSnap = await getDocs(
    query(collection(db, 'scores'), where('activity', '==', activity)),
  );

  // Aggregate best (lowest) time per team
  const bestByTeam = new Map<string, number>();
  scoresSnap.forEach((doc) => {
    const { teamId, reactionTimeMs } = doc.data() as { teamId: string; reactionTimeMs: number };
    const current = bestByTeam.get(teamId);
    if (current === undefined || reactionTimeMs < current) {
      bestByTeam.set(teamId, reactionTimeMs);
    }
  });

  if (bestByTeam.size === 0) return [];

  // Fetch team names in parallel
  const teamsSnap = await getDocs(collection(db, 'teams'));
  const teamNames = new Map<string, string>();
  teamsSnap.forEach((doc) => {
    teamNames.set(doc.id, (doc.data() as { name: string }).name);
  });

  // Build ranked list
  const entries = Array.from(bestByTeam.entries())
    .map(([teamId, bestReactionTimeMs]) => ({
      teamId,
      teamName: teamNames.get(teamId) ?? 'Unknown Team',
      bestReactionTimeMs,
    }))
    .sort((a, b) => a.bestReactionTimeMs - b.bestReactionTimeMs)
    .slice(0, limit)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return entries;
}

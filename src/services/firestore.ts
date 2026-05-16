import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Team, ReactionBoardScore, VibrationScore, SoundScore, BreathingScore, EarthquakeScore, HumanPerformanceScore, ParachuteScore, HandFanScore, LeaderboardEntry } from '../types';
import { ACTIVITY_CONFIGS } from '../lib/leaderboard';

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

export async function getAllTeams(): Promise<Team[]> {
  const snap = await getDocs(collection(db, 'teams'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Team, 'id'>) }));
}

export async function updateTeamLocation(
  teamId: string,
  location: { latitude: number; longitude: number },
): Promise<void> {
  await updateDoc(doc(db, 'teams', teamId), {
    location: { ...location, lastUpdated: Date.now() },
  });
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

export async function saveSoundScore(
  score: Omit<SoundScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveBreathingScore(
  score: Omit<BreathingScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveEarthquakeScore(
  score: Omit<EarthquakeScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveHumanPerformanceScore(
  score: Omit<HumanPerformanceScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveParachuteScore(
  score: Omit<ParachuteScore, 'attemptedAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'scores'), {
    ...score,
    attemptedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function saveHandFanScore(
  score: Omit<HandFanScore, 'attemptedAt'>,
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
  const config = ACTIVITY_CONFIGS[activity];
  if (!config) return [];

  const scoresSnap = await getDocs(
    query(collection(db, 'scores'), where('activity', '==', activity)),
  );

  const bestByTeam = new Map<string, number>();
  scoresSnap.forEach((scoreDoc) => {
    const data = scoreDoc.data() as { teamId: string; [key: string]: any };
    let value: number;

    if (activity === 'handFan') {
      const trials = data.trials as Array<{ force: number }> | undefined;
      if (!trials || trials.length === 0) return;
      value = trials.reduce((sum, t) => sum + t.force, 0) / trials.length;
    } else {
      value = data[config.scoreField];
      if (typeof value !== 'number') return;
    }

    const existing = bestByTeam.get(data.teamId);
    if (existing === undefined) {
      bestByTeam.set(data.teamId, value);
    } else {
      bestByTeam.set(
        data.teamId,
        config.direction === 'lowerIsBetter'
          ? Math.min(existing, value)
          : Math.max(existing, value),
      );
    }
  });

  if (bestByTeam.size === 0) return [];

  const teamsSnap = await getDocs(collection(db, 'teams'));
  const teamNames = new Map<string, string>();
  teamsSnap.forEach((teamDoc) => {
    teamNames.set(teamDoc.id, (teamDoc.data() as { name: string }).name);
  });

  return Array.from(bestByTeam.entries())
    .map(([teamId, bestScore]) => ({
      teamId,
      teamName: teamNames.get(teamId) ?? 'Unknown Team',
      bestScore,
      scoreLabel: config.formatScore(bestScore),
    }))
    .sort((a, b) =>
      config.direction === 'lowerIsBetter'
        ? a.bestScore - b.bestScore
        : b.bestScore - a.bestScore,
    )
    .slice(0, limit)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

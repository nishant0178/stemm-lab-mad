import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { scheduleLeaderboardNotification } from './notifications';

export function startLeaderboardWatcher(myTeamId: string): () => void {
  let myTeamBest = Infinity;
  const seenIds = new Set<string>();
  let isInitialized = false;

  const q = query(
    collection(db, 'scores'),
    where('activity', '==', 'reactionBoard'),
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    if (!isInitialized) {
      // First snapshot contains all existing docs — establish baseline silently
      snapshot.docs.forEach((docSnap) => {
        seenIds.add(docSnap.id);
        const { teamId, reactionTimeMs } = docSnap.data() as {
          teamId: string;
          reactionTimeMs: number;
        };
        if (teamId === myTeamId && reactionTimeMs < myTeamBest) {
          myTeamBest = reactionTimeMs;
        }
      });
      isInitialized = true;
      return;
    }

    for (const change of snapshot.docChanges()) {
      if (change.type !== 'added') continue;
      if (seenIds.has(change.doc.id)) continue;
      seenIds.add(change.doc.id);

      const { teamId, reactionTimeMs } = change.doc.data() as {
        teamId: string;
        reactionTimeMs: number;
      };

      // Keep our own best up to date
      if (teamId === myTeamId) {
        if (reactionTimeMs < myTeamBest) myTeamBest = reactionTimeMs;
        continue;
      }

      // Another team posted a score — does it beat us?
      if (myTeamBest === Infinity) continue; // we haven't played yet, nothing to defend
      if (reactionTimeMs >= myTeamBest) continue;

      try {
        const teamSnap = await getDoc(doc(db, 'teams', teamId));
        const teamName = teamSnap.exists()
          ? (teamSnap.data() as { name: string }).name
          : 'Another team';
        await scheduleLeaderboardNotification(teamName, reactionTimeMs);
      } catch {
        // Non-fatal — notification is best-effort
      }
    }
  });

  return unsubscribe;
}

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Team } from '../types';

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

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('stemm_lab.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity TEXT NOT NULL,
      reactionTimeMs INTEGER NOT NULL,
      attemptedAt INTEGER NOT NULL
    );
  `);
}

export async function saveScoreLocally(
  activity: string,
  reactionTimeMs: number,
): Promise<void> {
  if (!db) return;
  await db.runAsync(
    'INSERT INTO scores (activity, reactionTimeMs, attemptedAt) VALUES (?, ?, ?)',
    activity,
    reactionTimeMs,
    Date.now(),
  );
}

export type LocalScore = {
  id: number;
  activity: string;
  reactionTimeMs: number;
  attemptedAt: number;
};

export async function getRecentScores(limit: number = 5): Promise<LocalScore[]> {
  if (!db) return [];
  return db.getAllAsync<LocalScore>(
    'SELECT * FROM scores ORDER BY attemptedAt DESC LIMIT ?',
    limit,
  );
}

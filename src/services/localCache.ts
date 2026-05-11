import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  console.log('[localCache] initDatabase called');
  db = await SQLite.openDatabaseAsync('stemm_lab.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity TEXT NOT NULL,
      reactionTimeMs INTEGER NOT NULL,
      attemptedAt INTEGER NOT NULL
    );
  `);
  console.log('[localCache] DB initialised — table ready');
}

export async function saveScoreLocally(
  activity: string,
  reactionTimeMs: number,
): Promise<void> {
  console.log('[localCache] saveScoreLocally called', { activity, reactionTimeMs, dbReady: !!db });
  if (!db) {
    console.warn('[localCache] saveScoreLocally: db is null, skipping');
    return;
  }
  try {
    console.log('[localCache] running INSERT');
    await db.runAsync(
      'INSERT INTO scores (activity, reactionTimeMs, attemptedAt) VALUES (?, ?, ?)',
      activity,
      reactionTimeMs,
      Date.now(),
    );
    console.log('[localCache] INSERT succeeded');
  } catch (e) {
    console.error('[localCache] INSERT failed:', e);
    throw e;
  }
}

export type LocalScore = {
  id: number;
  activity: string;
  reactionTimeMs: number;
  attemptedAt: number;
};

export async function getRecentScores(limit: number = 5): Promise<LocalScore[]> {
  console.log('[localCache] getRecentScores called', { dbReady: !!db, limit });
  if (!db) {
    console.warn('[localCache] getRecentScores: db is null, returning []');
    return [];
  }
  const rows = await db.getAllAsync<LocalScore>(
    'SELECT * FROM scores ORDER BY attemptedAt DESC LIMIT ?',
    limit,
  );
  console.log('[localCache] getRecentScores returned', rows.length, 'rows:', rows);
  return rows;
}

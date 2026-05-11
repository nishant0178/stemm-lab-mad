import * as SQLite from 'expo-sqlite';

let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    console.log('[localCache] initDatabase: opening');
    const db = await SQLite.openDatabaseAsync('stemmlab.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity TEXT,
        reactionTimeMs INTEGER,
        attemptedAt INTEGER
      );
    `);
    console.log('[localCache] initDatabase: ready');
    return db;
  })();
  return dbInitPromise;
}

export async function saveScoreLocally(
  activity: string,
  reactionTimeMs: number,
): Promise<void> {
  try {
    const db = await initDatabase();
    await db.runAsync(
      'INSERT INTO scores (activity, reactionTimeMs, attemptedAt) VALUES (?, ?, ?)',
      [activity, reactionTimeMs, Date.now()],
    );
    console.log('[localCache] saveScoreLocally: inserted');
  } catch (err) {
    console.error('[localCache] saveScoreLocally failed:', err);
  }
}

export type LocalScore = {
  id: number;
  activity: string;
  reactionTimeMs: number;
  attemptedAt: number;
};

export async function getRecentScores(limit: number = 5): Promise<LocalScore[]> {
  try {
    const db = await initDatabase();
    const rows = await db.getAllAsync<LocalScore>(
      'SELECT * FROM scores ORDER BY attemptedAt DESC LIMIT ?',
      [limit],
    );
    console.log('[localCache] getRecentScores: returned', rows.length, 'rows');
    return rows;
  } catch (err) {
    console.error('[localCache] getRecentScores failed:', err);
    return [];
  }
}

/**
 * Local score cache.
 * On native platforms (iOS/Android), uses SQLite as per the brief.
 * On web (development/testing only), falls back to AsyncStorage because
 * expo-sqlite's web backend hangs on openDatabaseAsync and never resolves.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

export type LocalScore = {
  id: number;
  activity: string;
  reactionTimeMs: number;
  attemptedAt: number;
};

const isWeb = Platform.OS === 'web';
const WEB_STORAGE_KEY = 'stemmlab_scores';
const MAX_WEB_SCORES = 50;

// ─── Web backend (AsyncStorage) ───────────────────────────────────────────────

async function webGetAll(): Promise<LocalScore[]> {
  const raw = await AsyncStorage.getItem(WEB_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function webSave(activity: string, reactionTimeMs: number): Promise<void> {
  const existing = await webGetAll();
  const newScore: LocalScore = {
    id: Date.now(),
    activity,
    reactionTimeMs,
    attemptedAt: Date.now(),
  };
  const updated = [newScore, ...existing].slice(0, MAX_WEB_SCORES);
  await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(updated));
  console.log('[localCache:web] saved', newScore);
}

async function webGetRecent(limit: number): Promise<LocalScore[]> {
  const all = await webGetAll();
  const recent = all.slice(0, limit);
  console.log('[localCache:web] returning', recent.length, 'rows');
  return recent;
}

// ─── Native backend (SQLite) ──────────────────────────────────────────────────

let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function initNativeDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    console.log('[localCache:native] initDatabase: opening');
    const db = await SQLite.openDatabaseAsync('stemmlab.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity TEXT,
        reactionTimeMs INTEGER,
        attemptedAt INTEGER
      );
    `);
    console.log('[localCache:native] initDatabase: ready');
    return db;
  })();
  return dbInitPromise;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  if (isWeb) {
    console.log('[localCache] using AsyncStorage backend (web)');
    return;
  }
  await initNativeDb();
}

export async function saveScoreLocally(
  activity: string,
  reactionTimeMs: number,
): Promise<void> {
  try {
    if (isWeb) {
      await webSave(activity, reactionTimeMs);
      return;
    }
    const db = await initNativeDb();
    await db.runAsync(
      'INSERT INTO scores (activity, reactionTimeMs, attemptedAt) VALUES (?, ?, ?)',
      [activity, reactionTimeMs, Date.now()],
    );
    console.log('[localCache:native] inserted');
  } catch (err) {
    console.error('[localCache] saveScoreLocally failed:', err);
  }
}

export async function getRecentScores(limit: number = 5): Promise<LocalScore[]> {
  try {
    if (isWeb) {
      return await webGetRecent(limit);
    }
    const db = await initNativeDb();
    const rows = await db.getAllAsync<LocalScore>(
      'SELECT * FROM scores ORDER BY attemptedAt DESC LIMIT ?',
      [limit],
    );
    console.log('[localCache:native] returned', rows.length, 'rows');
    return rows;
  } catch (err) {
    console.error('[localCache] getRecentScores failed:', err);
    return [];
  }
}

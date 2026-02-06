import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

let _db: ReturnType<typeof drizzle> | null = null;

function getDatabase(): ReturnType<typeof drizzle> {
  if (!_db) {
    const dbPath = path.join(process.cwd(), 'data', 'jobs.db');
    const sqlite = new Database(dbPath);

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    _db = drizzle(sqlite, { schema });

    // Initialize tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tracked_searches (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        location TEXT,
        employment_type TEXT DEFAULT 'all',
        is_active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        last_fetched_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        dedup_hash TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        title_normalized TEXT,
        company TEXT,
        company_normalized TEXT,
        location TEXT,
        location_normalized TEXT,
        is_remote INTEGER DEFAULT 0,
        employment_type TEXT,
        description TEXT,
        salary TEXT,
        posted_at INTEGER,
        first_seen_at INTEGER NOT NULL,
        sources TEXT NOT NULL,
        urls TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS search_jobs (
        search_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        found_at INTEGER NOT NULL,
        PRIMARY KEY (search_id, job_id),
        FOREIGN KEY (search_id) REFERENCES tracked_searches(id) ON DELETE CASCADE,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS seen_jobs (
        job_id TEXT NOT NULL,
        seen_at INTEGER NOT NULL,
        PRIMARY KEY (job_id),
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        saved_at INTEGER NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'saved',
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_dedup_hash ON jobs(dedup_hash);
      CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
      CREATE INDEX IF NOT EXISTS idx_search_jobs_search_id ON search_jobs(search_id);
      CREATE INDEX IF NOT EXISTS idx_search_jobs_job_id ON search_jobs(job_id);
    `);
  }
  return _db;
}

// Proxy so consumers can use `db.select()...` without calling db()
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    const instance = getDatabase();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

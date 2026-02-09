import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required. Get it from your Supabase project: Settings → Database → Connection string (URI).');
}

// Use prepare: false for Supabase connection pooler (PgBouncer in transaction mode)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

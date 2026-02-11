import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Only manage tables defined in our schema.
  // Ignores manually-created tables (documents, tailoring_sessions, tailoring_outputs)
  // so drizzle-kit doesn't confuse them with renames and hang the build.
  tablesFilter: ['tracked_searches', 'jobs', 'search_jobs', 'seen_jobs', 'saved_jobs', 'waitlist'],
} satisfies Config;

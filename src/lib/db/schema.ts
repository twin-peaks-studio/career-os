import { pgTable, text, boolean, timestamp, serial, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const trackedSearches = pgTable('tracked_searches', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  query: text('query').notNull(),
  location: text('location'),
  employmentType: text('employment_type').default('all'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull(),
  lastFetchedAt: timestamp('last_fetched_at'),
});

// Jobs stay global — they're shared listings, not user-specific.
// If two users search for the same job, we don't want duplicate rows.
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  dedupHash: text('dedup_hash').unique().notNull(),
  title: text('title').notNull(),
  titleNormalized: text('title_normalized'),
  company: text('company'),
  companyNormalized: text('company_normalized'),
  location: text('location'),
  locationNormalized: text('location_normalized'),
  isRemote: boolean('is_remote').default(false),
  employmentType: text('employment_type'),
  description: text('description'),
  salary: text('salary'),
  postedAt: timestamp('posted_at'),
  firstSeenAt: timestamp('first_seen_at').notNull(),
  sources: jsonb('sources').notNull().$type<string[]>(),
  urls: jsonb('urls').notNull().$type<Record<string, string>>(),
});

export const searchJobs = pgTable('search_jobs', {
  searchId: text('search_id').notNull().references(() => trackedSearches.id, { onDelete: 'cascade' }),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  foundAt: timestamp('found_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.searchId, table.jobId] }),
]);

// seenJobs now tracks per-user: "has THIS user seen THIS job?"
// Previously jobId was the only PK — meaning one user marking a job "seen"
// would mark it seen for everyone. Now it's (userId + jobId).
export const seenJobs = pgTable('seen_jobs', {
  userId: text('user_id').notNull(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  seenAt: timestamp('seen_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.jobId] }),
]);

export const savedJobs = pgTable('saved_jobs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at').notNull(),
  notes: text('notes'),
  status: text('status').default('saved'),
});

export type TrackedSearchRow = typeof trackedSearches.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type SearchJobRow = typeof searchJobs.$inferSelect;
export type SeenJobRow = typeof seenJobs.$inferSelect;
export type SavedJobRow = typeof savedJobs.$inferSelect;

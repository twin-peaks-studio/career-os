import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const trackedSearches = sqliteTable('tracked_searches', {
  id: text('id').primaryKey(),
  query: text('query').notNull(),
  location: text('location'),
  employmentType: text('employment_type').default('all'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
});

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  dedupHash: text('dedup_hash').unique().notNull(),
  title: text('title').notNull(),
  titleNormalized: text('title_normalized'),
  company: text('company'),
  companyNormalized: text('company_normalized'),
  location: text('location'),
  locationNormalized: text('location_normalized'),
  isRemote: integer('is_remote', { mode: 'boolean' }).default(false),
  employmentType: text('employment_type'),
  description: text('description'),
  salary: text('salary'),
  postedAt: integer('posted_at', { mode: 'timestamp' }),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).notNull(),
  sources: text('sources').notNull(), // JSON array: ["google", "indeed"]
  urls: text('urls').notNull(), // JSON object: {"google": "url1", "indeed": "url2"}
});

export const searchJobs = sqliteTable('search_jobs', {
  searchId: text('search_id').notNull().references(() => trackedSearches.id, { onDelete: 'cascade' }),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  foundAt: integer('found_at', { mode: 'timestamp' }).notNull(),
});

export const seenJobs = sqliteTable('seen_jobs', {
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  seenAt: integer('seen_at', { mode: 'timestamp' }).notNull(),
});

export const savedJobs = sqliteTable('saved_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  savedAt: integer('saved_at', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  status: text('status').default('saved'), // saved|applied|interviewing|rejected
});

export type TrackedSearchRow = typeof trackedSearches.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type SearchJobRow = typeof searchJobs.$inferSelect;
export type SeenJobRow = typeof seenJobs.$inferSelect;
export type SavedJobRow = typeof savedJobs.$inferSelect;

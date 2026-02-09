import { pgTable, text, boolean, timestamp, serial, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const trackedSearches = pgTable('tracked_searches', {
  id: text('id').primaryKey(),
  query: text('query').notNull(),
  location: text('location'),
  employmentType: text('employment_type').default('all'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull(),
  lastFetchedAt: timestamp('last_fetched_at'),
});

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

export const seenJobs = pgTable('seen_jobs', {
  jobId: text('job_id').primaryKey().references(() => jobs.id, { onDelete: 'cascade' }),
  seenAt: timestamp('seen_at').notNull(),
});

export const savedJobs = pgTable('saved_jobs', {
  id: serial('id').primaryKey(),
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

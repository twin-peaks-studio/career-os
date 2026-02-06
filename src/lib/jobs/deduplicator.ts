import crypto from 'crypto';
import { normalizeCompany, normalizeTitle, normalizeLocation } from './normalizer';
import { RawJob, Job, Source } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a deduplication hash based on normalized job attributes
 */
export function generateDedupHash(job: {
  company: string | null;
  title: string;
  location: string | null;
}): string {
  const normalized = [
    normalizeCompany(job.company),
    normalizeTitle(job.title),
    normalizeLocation(job.location),
  ].join('|');

  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Merges a new job with an existing job (for deduplication)
 * Keeps the best data from both and combines sources
 */
export function mergeJobs(existing: Job, newRaw: RawJob): Job {
  const newSources = existing.sources.includes(newRaw.source)
    ? existing.sources
    : [...existing.sources, newRaw.source];

  const newUrls = {
    ...existing.urls,
    [newRaw.source]: newRaw.url,
  };

  return {
    ...existing,
    // Keep better data (prefer non-null values)
    company: existing.company || newRaw.company,
    location: existing.location || newRaw.location,
    description: existing.description || newRaw.description,
    salary: existing.salary || newRaw.salary,
    employmentType: existing.employmentType || newRaw.employmentType,
    // Prefer earlier posted date
    postedAt: selectEarlierDate(existing.postedAt, newRaw.postedAt),
    // Update sources
    sources: newSources,
    urls: newUrls,
    // Update remote status if any source indicates remote
    isRemote: existing.isRemote || newRaw.isRemote,
  };
}

/**
 * Converts a raw job from a source into our unified Job format
 */
export function rawJobToJob(rawJob: RawJob): Job {
  const dedupHash = generateDedupHash({
    company: rawJob.company,
    title: rawJob.title,
    location: rawJob.location,
  });

  return {
    id: uuidv4(),
    dedupHash,
    title: rawJob.title,
    titleNormalized: normalizeTitle(rawJob.title),
    company: rawJob.company,
    companyNormalized: normalizeCompany(rawJob.company),
    location: rawJob.location,
    locationNormalized: normalizeLocation(rawJob.location),
    isRemote: rawJob.isRemote,
    employmentType: rawJob.employmentType,
    description: rawJob.description,
    salary: rawJob.salary,
    postedAt: rawJob.postedAt,
    firstSeenAt: new Date(),
    sources: [rawJob.source],
    urls: { [rawJob.source]: rawJob.url } as Record<Source, string>,
  };
}

/**
 * Deduplicates an array of raw jobs, merging duplicates
 */
export function deduplicateRawJobs(rawJobs: RawJob[]): Job[] {
  const jobMap = new Map<string, Job>();

  for (const rawJob of rawJobs) {
    const dedupHash = generateDedupHash({
      company: rawJob.company,
      title: rawJob.title,
      location: rawJob.location,
    });

    const existing = jobMap.get(dedupHash);

    if (existing) {
      jobMap.set(dedupHash, mergeJobs(existing, rawJob));
    } else {
      jobMap.set(dedupHash, rawJobToJob(rawJob));
    }
  }

  return Array.from(jobMap.values());
}

/**
 * Selects the earlier of two dates, handling nulls
 */
function selectEarlierDate(date1: Date | null, date2: Date | null): Date | null {
  if (!date1) return date2;
  if (!date2) return date1;
  return date1 < date2 ? date1 : date2;
}

/**
 * Checks if a job was posted today (within last 24 hours)
 */
export function isPostedToday(postedAt: Date | null): boolean {
  if (!postedAt) return false;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return postedAt >= twentyFourHoursAgo;
}

/**
 * Checks if a job was posted within the last week
 */
export function isPostedThisWeek(postedAt: Date | null): boolean {
  if (!postedAt) return true; // Include jobs with unknown dates

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return postedAt >= oneWeekAgo;
}

/**
 * Sorts jobs by posted date (most recent first)
 */
export function sortJobsByDate(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    // Jobs posted today go first
    const aToday = isPostedToday(a.postedAt);
    const bToday = isPostedToday(b.postedAt);
    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;

    // Then sort by date
    if (!a.postedAt && !b.postedAt) return 0;
    if (!a.postedAt) return 1;
    if (!b.postedAt) return -1;
    return b.postedAt.getTime() - a.postedAt.getTime();
  });
}

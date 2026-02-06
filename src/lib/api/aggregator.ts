import { fetchGoogleJobs } from './serpapi';
import { fetchIndeedJobs } from './indeed-rss';
import { fetchLinkedInJobs } from './linkedin-rss';
import { deduplicateRawJobs, sortJobsByDate, isPostedThisWeek } from '@/lib/jobs/deduplicator';
import { SearchParams, RawJob, Job, Source, AggregatedResult } from '@/types';

const SOURCE_FETCHERS: Record<Source, (params: SearchParams) => Promise<RawJob[]>> = {
  google: fetchGoogleJobs,
  indeed: fetchIndeedJobs,
  linkedin: fetchLinkedInJobs,
};

// Rate limiting - simple delay between source fetches
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay to appear more human-like
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface FetchOptions {
  sources?: Source[];
  maxJobsPerSource?: number;
  filterToWeek?: boolean;
}

export async function aggregateJobs(
  params: SearchParams,
  options: FetchOptions = {}
): Promise<AggregatedResult> {
  const {
    sources = ['google', 'indeed', 'linkedin'],
    maxJobsPerSource = 25,
    filterToWeek = true,
  } = options;

  const allRawJobs: RawJob[] = [];
  const sourceResults: AggregatedResult['sources'] = [];

  // Fetch from each source sequentially with delays
  for (const source of sources) {
    const fetcher = SOURCE_FETCHERS[source];
    if (!fetcher) continue;

    try {
      // Add random delay between requests (2-4 seconds)
      if (allRawJobs.length > 0) {
        await delay(randomDelay(2000, 4000));
      }

      const jobs = await fetcher(params);
      const limitedJobs = jobs.slice(0, maxJobsPerSource);
      allRawJobs.push(...limitedJobs);

      sourceResults.push({
        name: source,
        count: limitedJobs.length,
      });
    } catch (error) {
      console.error(`Error fetching from ${source}:`, error);
      sourceResults.push({
        name: source,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Deduplicate and process
  let jobs = deduplicateRawJobs(allRawJobs);

  // Filter to only jobs from this week
  if (filterToWeek) {
    jobs = jobs.filter(job => isPostedThisWeek(job.postedAt));
  }

  // Sort by date (most recent first)
  jobs = sortJobsByDate(jobs);

  // Apply source limits: max 10 LinkedIn, remaining 10 from other sources
  const linkedInJobs = jobs.filter(job => job.sources.includes('linkedin')).slice(0, 10);
  const otherJobs = jobs.filter(job => !job.sources.includes('linkedin')).slice(0, 10);

  // Combine and re-sort
  jobs = sortJobsByDate([...linkedInJobs, ...otherJobs]).slice(0, 20);

  return {
    jobs,
    sources: sourceResults,
    fetchedAt: new Date(),
  };
}

/**
 * Fetch jobs for a single search and return them
 * This is the main function called by the API and cron job
 */
export async function fetchJobsForSearch(params: SearchParams): Promise<Job[]> {
  const result = await aggregateJobs(params);
  return result.jobs;
}

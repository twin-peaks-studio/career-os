/**
 * Daily job fetch script
 *
 * This can be run via:
 * 1. A cron job on your server: node -r ts-node/register src/lib/cron/daily-fetch.ts
 * 2. Vercel Cron (if deploying to Vercel)
 * 3. Manually via the API: POST /api/fetch
 *
 * For local development, you can also trigger via the UI's "Fetch All" button.
 */

import { db } from '@/lib/db';
import { trackedSearches, jobs, searchJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { aggregateJobs } from '@/lib/api/aggregator';
import { normalizeTitle, normalizeCompany, normalizeLocation } from '@/lib/jobs/normalizer';
import { SearchParams, Job, Source } from '@/types';

async function storeJobs(fetchedJobs: Job[], searchId: string): Promise<number> {
  let newJobsCount = 0;
  const now = new Date();

  for (const job of fetchedJobs) {
    const existing = await db
      .select()
      .from(jobs)
      .where(eq(jobs.dedupHash, job.dedupHash))
      .limit(1);

    if (existing.length > 0) {
      // Job exists - merge sources if needed
      const existingJob = existing[0];
      const existingSources: Source[] = JSON.parse(existingJob.sources);
      const existingUrls: Record<string, string> = JSON.parse(existingJob.urls);

      let updated = false;

      for (const source of job.sources) {
        if (!existingSources.includes(source)) {
          existingSources.push(source);
          updated = true;
        }
      }

      for (const [source, url] of Object.entries(job.urls)) {
        if (!existingUrls[source]) {
          existingUrls[source] = url;
          updated = true;
        }
      }

      if (updated) {
        await db
          .update(jobs)
          .set({
            sources: JSON.stringify(existingSources),
            urls: JSON.stringify(existingUrls),
          })
          .where(eq(jobs.id, existingJob.id));
      }

      // Link to search if not already linked
      await db
        .insert(searchJobs)
        .values({
          searchId,
          jobId: existingJob.id,
          foundAt: now,
        })
        .onConflictDoNothing();
    } else {
      // New job - insert it
      await db.insert(jobs).values({
        id: job.id,
        dedupHash: job.dedupHash,
        title: job.title,
        titleNormalized: normalizeTitle(job.title),
        company: job.company,
        companyNormalized: normalizeCompany(job.company),
        location: job.location,
        locationNormalized: normalizeLocation(job.location),
        isRemote: job.isRemote,
        employmentType: job.employmentType,
        description: job.description,
        salary: job.salary,
        postedAt: job.postedAt,
        firstSeenAt: now,
        sources: JSON.stringify(job.sources),
        urls: JSON.stringify(job.urls),
      });

      // Link to search
      await db.insert(searchJobs).values({
        searchId,
        jobId: job.id,
        foundAt: now,
      });

      newJobsCount++;
    }
  }

  return newJobsCount;
}

export async function runDailyFetch(): Promise<void> {
  console.log('Starting daily job fetch...');
  const startTime = Date.now();

  // Get all active searches
  const searches = await db
    .select()
    .from(trackedSearches)
    .where(eq(trackedSearches.isActive, true));

  console.log(`Found ${searches.length} active searches`);

  for (const search of searches) {
    console.log(`Fetching jobs for: "${search.query}" (${search.location || 'any location'})`);

    try {
      const params: SearchParams = {
        query: search.query,
        location: search.location || undefined,
        employmentType: search.employmentType as SearchParams['employmentType'],
      };

      const result = await aggregateJobs(params);
      const newJobsCount = await storeJobs(result.jobs, search.id);

      // Update last fetched timestamp
      await db
        .update(trackedSearches)
        .set({ lastFetchedAt: new Date() })
        .where(eq(trackedSearches.id, search.id));

      console.log(`  - Found ${result.jobs.length} jobs, ${newJobsCount} new`);
      console.log(`  - Sources: ${result.sources.map(s => `${s.name}(${s.count})`).join(', ')}`);
    } catch (error) {
      console.error(`  - Error: ${error}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Daily fetch completed in ${duration}s`);
}

// Run if called directly
if (require.main === module) {
  runDailyFetch()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

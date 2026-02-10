import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trackedSearches, jobs, searchJobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { aggregateJobs } from '@/lib/api/aggregator';
import { normalizeTitle, normalizeCompany, normalizeLocation } from '@/lib/jobs/normalizer';
import { SearchParams, Job, Source } from '@/types';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

/**
 * Store jobs in the database, handling deduplication.
 * Jobs are global (shared) — the storeJobs logic doesn't change with auth.
 */
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
      const existingJob = existing[0];
      const existingSources: Source[] = [...(existingJob.sources as Source[])];
      const existingUrls: Record<string, string> = { ...(existingJob.urls as Record<string, string>) };

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
            sources: existingSources,
            urls: existingUrls,
          })
          .where(eq(jobs.id, existingJob.id));
      }

      await db
        .insert(searchJobs)
        .values({
          searchId,
          jobId: existingJob.id,
          foundAt: now,
        })
        .onConflictDoNothing();
    } else {
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
        sources: job.sources,
        urls: job.urls,
      });

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

// POST /api/fetch - Trigger a fetch for this user's searches
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { searchId } = body;

    let searches;

    if (searchId) {
      // Fetch for a specific search — but only if it belongs to this user
      searches = await db
        .select()
        .from(trackedSearches)
        .where(and(eq(trackedSearches.id, searchId), eq(trackedSearches.userId, user.id)));
    } else {
      // Fetch for all of THIS user's active searches
      searches = await db
        .select()
        .from(trackedSearches)
        .where(and(eq(trackedSearches.isActive, true), eq(trackedSearches.userId, user.id)));
    }

    if (searches.length === 0) {
      return NextResponse.json(
        { error: 'No searches found' },
        { status: 404 }
      );
    }

    const results: Array<{
      searchId: string;
      query: string;
      totalFetched: number;
      newJobs: number;
      sources: Array<{ name: string; count: number; error?: string }>;
    }> = [];

    for (const search of searches) {
      const params: SearchParams = {
        query: search.query,
        location: search.location || undefined,
        employmentType: search.employmentType as SearchParams['employmentType'],
      };

      const result = await aggregateJobs(params);
      const newJobsCount = await storeJobs(result.jobs, search.id);

      await db
        .update(trackedSearches)
        .set({ lastFetchedAt: new Date() })
        .where(eq(trackedSearches.id, search.id));

      results.push({
        searchId: search.id,
        query: search.query,
        totalFetched: result.jobs.length,
        newJobs: newJobsCount,
        sources: result.sources,
      });
    }

    return NextResponse.json({
      success: true,
      fetchedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Error during fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/fetch/status - Get fetch status for this user's searches
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searches = await db
      .select()
      .from(trackedSearches)
      .where(eq(trackedSearches.userId, user.id));

    const status = searches.map(search => ({
      id: search.id,
      query: search.query,
      isActive: search.isActive,
      lastFetchedAt: search.lastFetchedAt,
    }));

    return NextResponse.json({ searches: status });
  } catch (error) {
    console.error('Error getting fetch status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}

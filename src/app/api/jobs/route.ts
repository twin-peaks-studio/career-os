import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, searchJobs, seenJobs, trackedSearches } from '@/lib/db/schema';
import { eq, desc, gte, inArray, and } from 'drizzle-orm';
import { Job, Source } from '@/types';
import { isPostedToday } from '@/lib/jobs/deduplicator';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

function dbJobToJob(row: typeof jobs.$inferSelect): Job {
  return {
    id: row.id,
    dedupHash: row.dedupHash,
    title: row.title,
    titleNormalized: row.titleNormalized || '',
    company: row.company,
    companyNormalized: row.companyNormalized || '',
    location: row.location,
    locationNormalized: row.locationNormalized || '',
    isRemote: row.isRemote ?? false,
    employmentType: row.employmentType,
    description: row.description,
    salary: row.salary,
    postedAt: row.postedAt,
    firstSeenAt: row.firstSeenAt,
    sources: row.sources as Source[],
    urls: row.urls as Record<Source, string>,
  };
}

// GET /api/jobs?searchId=xxx - Get jobs for a tracked search
// GET /api/jobs?today=true - Get today's jobs from this user's searches
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId');
    const today = searchParams.get('today') === 'true';

    let jobRows: (typeof jobs.$inferSelect)[];

    if (today) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Only show today's jobs from THIS user's searches
      const userSearchIds = await db
        .select({ id: trackedSearches.id })
        .from(trackedSearches)
        .where(eq(trackedSearches.userId, user.id));

      const sIds = userSearchIds.map(s => s.id);

      if (sIds.length === 0) {
        return NextResponse.json([]);
      }

      const userJobIds = await db
        .select({ jobId: searchJobs.jobId })
        .from(searchJobs)
        .where(inArray(searchJobs.searchId, sIds));

      const jobIds = [...new Set(userJobIds.map(r => r.jobId))];

      if (jobIds.length === 0) {
        return NextResponse.json([]);
      }

      jobRows = await db
        .select()
        .from(jobs)
        .where(and(inArray(jobs.id, jobIds), gte(jobs.postedAt, twentyFourHoursAgo)))
        .orderBy(desc(jobs.postedAt))
        .limit(30);
    } else if (searchId) {
      // Verify this search belongs to the current user before showing its jobs
      const searchOwner = await db
        .select({ userId: trackedSearches.userId })
        .from(trackedSearches)
        .where(and(eq(trackedSearches.id, searchId), eq(trackedSearches.userId, user.id)))
        .limit(1);

      if (searchOwner.length === 0) {
        return NextResponse.json({ error: 'Search not found' }, { status: 404 });
      }

      const linkedJobIds = await db
        .select({ jobId: searchJobs.jobId })
        .from(searchJobs)
        .where(eq(searchJobs.searchId, searchId));

      if (linkedJobIds.length === 0) {
        return NextResponse.json([]);
      }

      const ids = linkedJobIds.map(row => row.jobId);

      jobRows = await db
        .select()
        .from(jobs)
        .where(inArray(jobs.id, ids))
        .orderBy(desc(jobs.postedAt))
        .limit(30);
    } else {
      jobRows = await db
        .select()
        .from(jobs)
        .orderBy(desc(jobs.postedAt))
        .limit(30);
    }

    // Get seen status for THIS user only
    const seenJobIds = await db
      .select({ jobId: seenJobs.jobId })
      .from(seenJobs)
      .where(eq(seenJobs.userId, user.id));
    const seenSet = new Set(seenJobIds.map(row => row.jobId));

    const jobsWithMeta = jobRows.map(row => {
      const job = dbJobToJob(row);
      return {
        ...job,
        isPostedToday: isPostedToday(job.postedAt),
        isSeen: seenSet.has(job.id),
      };
    });

    jobsWithMeta.sort((a, b) => {
      if (a.isPostedToday && !b.isPostedToday) return -1;
      if (!a.isPostedToday && b.isPostedToday) return 1;
      if (!a.postedAt && !b.postedAt) return 0;
      if (!a.postedAt) return 1;
      if (!b.postedAt) return -1;
      return b.postedAt.getTime() - a.postedAt.getTime();
    });

    return NextResponse.json(jobsWithMeta);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Mark a job as seen (for this user)
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (action === 'mark_seen') {
      // Record that THIS user has seen this job
      await db.insert(seenJobs).values({
        userId: user.id,
        jobId,
        seenAt: new Date(),
      }).onConflictDoNothing();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
